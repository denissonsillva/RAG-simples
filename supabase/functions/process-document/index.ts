import { createClient } from 'jsr:@supabase/supabase-js@2'
import { extractText, getDocumentProxy } from 'npm:unpdf@1.4.0'
import { unzipSync, strFromU8 } from 'npm:fflate@0.8.2'

const EMBEDDING_MODEL = 'text-embedding-3-small' // 1536 dimensões = vector(1536)
const CHARS_PER_TOKEN = 4 // mesma conta do preview da tela
const MAX_CHUNKS = 2000
const EMBED_BATCH = 100

type Strategy = 'fixed' | 'paragraph' | 'semantic'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// ---------- extração ----------

async function extract(bytes: Uint8Array, name: string): Promise<string> {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'txt' || ext === 'md') return new TextDecoder().decode(bytes)
  if (ext === 'pdf') {
    const pdf = await getDocumentProxy(bytes)
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  }
  if (ext === 'docx') {
    const xml = strFromU8(unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' })['word/document.xml'])
    return xml
      .replace(/<\/w:p>/g, '\n\n')
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  }
  throw new Error('Formato não suportado.')
}

// ---------- fatiamento ----------

function fixedWindows(text: string, size: number, step: number): string[] {
  const out: string[] = []
  for (let start = 0; start < text.length; start += step) {
    out.push(text.slice(start, start + size))
    if (start + size >= text.length) break
  }
  return out
}

/** Junta unidades (parágrafos/frases) até `size` caracteres; cada novo chunk reaproveita o final do anterior (`overlap`). */
function pack(units: string[], size: number, overlap: number, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const u of units) {
    if (cur && cur.length + sep.length + u.length > size) {
      out.push(cur)
      cur = overlap > 0 ? cur.slice(-overlap) : ''
    }
    cur = cur ? cur + sep + u : u
  }
  if (cur.trim()) out.push(cur)
  return out
}

function chunk(text: string, strategy: Strategy, sizeTokens: number, overlapTokens: number): string[] {
  const size = sizeTokens * CHARS_PER_TOKEN
  const overlap = overlapTokens * CHARS_PER_TOKEN
  const clean = text.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
  if (!clean) return []

  let units: string[]
  let sep: string
  if (strategy === 'fixed') {
    return fixedWindows(clean, size, size - overlap).filter((c) => c.trim())
  } else if (strategy === 'paragraph') {
    units = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    sep = '\n\n'
  } else {
    // "semantic": agrupa frases consecutivas; sem modelo de tópicos, o limite é o fim da frase.
    units = clean.replace(/\n+/g, ' ').match(/[^.!?]+[.!?]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean]
    sep = ' '
  }
  // unidade maior que o chunk é quebrada em janelas fixas
  units = units.flatMap((u) => (u.length > size ? fixedWindows(u, size, size - overlap) : [u]))
  return pack(units, size, overlap, sep).filter((c) => c.trim())
}

// ---------- embeddings ----------

async function embed(inputs: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(`OpenAI ${res.status}: ${detail?.error?.message ?? 'falha ao gerar embeddings'}`)
  }
  const body = await res.json()
  return body.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index).map((d: { embedding: number[] }) => d.embedding)
}

// ---------- pipeline ----------

async function processDocument(doc: Record<string, any>) {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error('Segredo OPENAI_API_KEY não configurado na Edge Function.')

    const { data: file, error: dlError } = await admin.storage.from('documents').download(doc.storage_path)
    if (dlError || !file) throw new Error(`Falha ao baixar o arquivo: ${dlError?.message}`)

    const text = await extract(new Uint8Array(await file.arrayBuffer()), doc.name)
    const chunks = chunk(text, doc.chunk_strategy, doc.chunk_size, doc.chunk_overlap)
    if (chunks.length === 0) throw new Error('Nenhum texto encontrado no arquivo (PDF escaneado?).')
    if (chunks.length > MAX_CHUNKS) throw new Error(`Arquivo gera ${chunks.length} chunks; o limite é ${MAX_CHUNKS}. Aumente o tamanho do chunk.`)

    await admin.from('document_chunks').delete().eq('document_id', doc.id) // reprocessamento idempotente
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH)
      const vectors = await embed(batch, apiKey)
      const rows = batch.map((content, j) => ({
        document_id: doc.id,
        chunk_index: i + j,
        content,
        embedding: JSON.stringify(vectors[j]),
      }))
      const { error } = await admin.from('document_chunks').insert(rows)
      if (error) throw new Error(`Falha ao salvar chunks: ${error.message}`)
    }

    await admin.from('documents').update({ status: 'ready', chunk_count: chunks.length, error: null }).eq('id', doc.id)
  } catch (e) {
    console.error('process-document', doc.id, e)
    await admin.from('document_chunks').delete().eq('document_id', doc.id)
    await admin
      .from('documents')
      .update({ status: 'failed', chunk_count: 0, error: e instanceof Error ? e.message : String(e) })
      .eq('id', doc.id)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  // verify_jwt já validou a assinatura; aqui identificamos o usuário para checar o dono.
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Não autenticado.' }, 401)

  const { documentId } = await req.json().catch(() => ({}))
  if (typeof documentId !== 'string') return json({ error: 'documentId é obrigatório.' }, 400)

  const { data: doc } = await admin.from('documents').select('*').eq('id', documentId).maybeSingle()
  if (!doc || doc.uploaded_by !== userData.user.id) return json({ error: 'Documento não encontrado.' }, 404)
  if (doc.status !== 'processing') return json({ status: doc.status })

  // responde já; o trabalho pesado segue em segundo plano e a lista acompanha pelo status.
  EdgeRuntime.waitUntil(processDocument(doc))
  return json({ status: 'processing' }, 202)
})
