import { createClient } from 'jsr:@supabase/supabase-js@2'

const EMBEDDING_MODEL = 'text-embedding-3-small' // o mesmo usado na indexação (vector(1536))
const MAX_QUERY_CHARS = 500

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Só o service role grava em usage_events; o cliente do usuário (anon + JWT) não tem esse acesso.
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

/** Registra o consumo de uma busca. Falhar aqui nunca pode derrubar a busca. */
async function logUsage(userId: string | undefined, tokens: number) {
  const { error } = await admin
    .from('usage_events')
    .insert({ user_id: userId ?? null, kind: 'search', model: EMBEDDING_MODEL, tokens })
  if (error) console.error('usage_events', error.message)
}

async function embed(input: string, apiKey: string): Promise<{ vector: number[]; tokens: number }> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(`OpenAI ${res.status}: ${detail?.error?.message ?? 'falha ao gerar embedding'}`)
  }
  const body = await res.json()
  return { vector: body.data[0].embedding, tokens: body.usage?.total_tokens ?? 0 }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return json({ error: 'OPENAI_API_KEY não configurado.' }, 500)

  const body = await req.json().catch(() => ({}))
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) return json({ error: 'query é obrigatória.' }, 400)
  if (query.length > MAX_QUERY_CHARS) return json({ error: `query passa de ${MAX_QUERY_CHARS} caracteres.` }, 400)
  const topK = Number.isInteger(body.topK) ? Math.min(Math.max(body.topK, 1), 20) : 5

  // Cliente com o JWT de quem chamou: a busca roda sob o RLS desse usuário.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })

  try {
    const { vector, tokens } = await embed(query, apiKey)
    // Sem sessão persistida dentro da função, o JWT precisa ir explícito.
    const { data: userData } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') ?? '')
    await logUsage(userData.user?.id, tokens)
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: JSON.stringify(vector),
      match_count: topK,
    })
    if (error) throw new Error(error.message)

    return json({
      results: data.map((r: Record<string, any>) => ({
        chunkId: r.chunk_id,
        documentId: r.document_id,
        documentName: r.document_name,
        snippet: r.content,
        score: r.similarity,
      })),
    })
  } catch (e) {
    console.error('search-documents', e)
    return json({ error: e instanceof Error ? e.message : 'Falha na busca.' }, 500)
  }
})
