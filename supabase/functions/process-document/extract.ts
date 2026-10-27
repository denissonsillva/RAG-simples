// Extração de texto por formato. Tudo que é "zip + XML" (docx, xlsx, pptx) é lido com fflate, sem bibliotecas pesadas.
import { extractText, getDocumentProxy } from 'npm:unpdf@1.4.0'
import { strFromU8, unzipSync } from 'npm:fflate@0.8.2'

const MAX_ENTRY_BYTES = 50 * 1024 * 1024 // limite por arquivo interno, contra "zip bomb"

/** Formatos antigos (binários) que não conseguimos ler; a mensagem diz o que fazer. */
const LEGACY: Record<string, string> = { xls: 'xlsx', ppt: 'pptx', doc: 'docx' }

// ---------- utilidades ----------

function decodeText(bytes: Uint8Array): string {
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    // CSV exportado pelo Excel no Brasil costuma vir em Windows-1252
    text = new TextDecoder('windows-1252').decode(bytes)
  }
  return text.replace(/^﻿/, '')
}

function decodeEntities(s: string): string {
  const code = (n: number) => (Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '')
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => code(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => code(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function attr(tag: string, name: string): string | undefined {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tag)
  return m ? decodeEntities(m[1] ?? m[2] ?? '') : undefined
}

function unzip(bytes: Uint8Array, wanted: (name: string) => boolean): Record<string, Uint8Array> {
  try {
    return unzipSync(bytes, {
      filter: (f) => {
        if (!wanted(f.name)) return false
        if (f.originalSize > MAX_ENTRY_BYTES) throw new Error('GRANDE')
        return true
      },
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'GRANDE') throw new Error('Arquivo grande demais depois de descompactado (limite do arquivo interno).')
    throw new Error('O arquivo parece estar corrompido ou não é do formato esperado.')
  }
}

// ---------- tabelas (CSV e planilhas) ----------

function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = [',', ';', '\t'].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ',')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Linha de cabeçalho + linhas de dados viram "Coluna: valor; Coluna: valor", que dá contexto a cada trecho. */
function tableToText(rows: string[][], title?: string): string {
  const filled = rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean))
  if (filled.length === 0) return ''
  const body =
    filled.length === 1
      ? filled[0].filter(Boolean).join('; ')
      : filled
          .slice(1)
          .map((r) =>
            r
              .map((cell, i) => (cell ? `${filled[0][i] || `Coluna ${i + 1}`}: ${cell}` : ''))
              .filter(Boolean)
              .join('; '),
          )
          .join('\n\n')
  return title ? `Planilha: ${title}\n\n${body}` : body
}

// ---------- xlsx ----------

const columnIndex = (ref: string) =>
  ref
    .replace(/[0-9]/g, '')
    .toUpperCase()
    .split('')
    .reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1

const textsOf = (xml: string) =>
  [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join('')

function extractXlsx(bytes: Uint8Array): string {
  const files = unzip(bytes, (n) => /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(n))
  const read = (name: string) => (files[name] ? strFromU8(files[name]) : '')

  const shared = [...read('xl/sharedStrings.xml').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => decodeEntities(textsOf(m[1])))

  const targets = new Map<string, string>()
  for (const m of read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(m[0], 'Id')
    const target = attr(m[0], 'Target')
    if (id && target) targets.set(id, target.startsWith('/') ? target.slice(1) : `xl/${target}`)
  }

  const out: string[] = []
  for (const m of read('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const name = attr(m[0], 'name') ?? 'Planilha'
    const path = targets.get(attr(m[0], 'r:id') ?? '')
    const xml = path ? read(path) : ''
    if (!xml) continue

    const rows: string[][] = []
    for (const r of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: string[] = []
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = attr(`<c ${c[1]}`, 'r')
        const type = attr(`<c ${c[1]}`, 't')
        const inner = c[2] ?? ''
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? ''
        let value = ''
        if (type === 's') value = shared[Number(v)] ?? ''
        else if (type === 'inlineStr') value = decodeEntities(textsOf(inner))
        else if (type === 'b') value = v === '1' ? 'Sim' : 'Não'
        else if (type === 'e') value = ''
        else value = decodeEntities(v)
        cells[ref ? columnIndex(ref) : cells.length] = value
      }
      rows.push(Array.from(cells, (c) => c ?? ''))
    }
    const text = tableToText(rows, name)
    if (text) out.push(text)
  }
  return out.join('\n\n')
}

// ---------- pptx ----------

function extractPptx(bytes: Uint8Array): string {
  const files = unzip(bytes, (n) => /^ppt\/(slides\/slide|notesSlides\/notesSlide)\d+\.xml$/.test(n))
  const number = (name: string) => Number(/(\d+)\.xml$/.exec(name)?.[1] ?? 0)
  const paragraphs = (xml: string) =>
    xml
      .split(/<\/a:p>/)
      .map((p) => decodeEntities([...p.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]).join('')).trim())
      .filter(Boolean)
      .join('\n')

  const notes = new Map(
    Object.keys(files)
      .filter((n) => n.startsWith('ppt/notesSlides/'))
      .map((n) => [number(n), paragraphs(strFromU8(files[n]))] as const),
  )

  return Object.keys(files)
    .filter((n) => n.startsWith('ppt/slides/'))
    .sort((a, b) => number(a) - number(b))
    .map((n) => {
      const text = paragraphs(strFromU8(files[n]))
      const note = notes.get(number(n))
      return [text && `Slide ${number(n)}:\n${text}`, note && `Notas do slide ${number(n)}:\n${note}`].filter(Boolean).join('\n\n')
    })
    .filter(Boolean)
    .join('\n\n')
}

// ---------- xml ----------

/** Elementos folha viram "nome: valor"; atributos entram como texto; o fechamento de um bloco vira quebra de parágrafo. */
function xmlToText(xml: string): string {
  let s = xml
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c: string) => escapeXml(c))

  s = s.replace(/<([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))+)\s*(\/?)>/g, (_, tag: string, attrs: string, selfClosing: string) => {
    const pairs = [...attrs.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
      .filter((m) => !m[1].startsWith('xmlns'))
      .map((m) => `${m[1]}: ${m[2] ?? m[3] ?? ''}`)
      .join('; ')
    return `<${tag}>${pairs}${selfClosing ? `</${tag}>` : ''}`
  })

  s = s
    .replace(/<([A-Za-z_][\w:.-]*)>([^<>]*\S[^<>]*)<\/\1>/g, (_, tag: string, text: string) => `\n${tag}: ${text.trim()}\n`)
    .replace(/<\/[^>]+>/g, '\n\n')
    .replace(/<[^>]+>/g, '\n')

  return decodeEntities(s)
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ---------- docx ----------

function extractDocx(bytes: Uint8Array): string {
  const files = unzip(bytes, (n) => n === 'word/document.xml')
  const xml = files['word/document.xml']
  if (!xml) throw new Error('O arquivo parece estar corrompido ou não é do formato esperado.')
  return decodeEntities(
    strFromU8(xml)
      .replace(/<\/w:p>/g, '\n\n')
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
}

// ---------- entrada ----------

export async function extract(bytes: Uint8Array, name: string): Promise<string> {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'txt':
    case 'md':
      return decodeText(bytes)
    case 'csv':
      return tableToText(parseCsv(decodeText(bytes)))
    case 'xml':
      return xmlToText(decodeText(bytes))
    case 'pdf': {
      const pdf = await getDocumentProxy(bytes)
      const { text } = await extractText(pdf, { mergePages: true })
      return text
    }
    case 'docx':
      return extractDocx(bytes)
    case 'xlsx':
      return extractXlsx(bytes)
    case 'pptx':
      return extractPptx(bytes)
    default:
      if (LEGACY[ext]) throw new Error(`Formato antigo (.${ext}) não é lido. Salve o arquivo como .${LEGACY[ext]} e envie de novo.`)
      throw new Error('Formato não suportado.')
  }
}
