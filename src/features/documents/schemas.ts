import { z } from 'zod'
import type { ChunkStrategy } from '@/services'

export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'pptx', 'csv', 'xml', 'txt', 'md']
/** Formatos antigos: aceitos na escolha do arquivo só para explicar como converter. */
export const LEGACY_EXTENSIONS: Record<string, { to: string; app: string }> = {
  xls: { to: 'xlsx', app: 'Excel' },
  ppt: { to: 'pptx', app: 'PowerPoint' },
  doc: { to: 'docx', app: 'Word' },
}
export const FORMATS_LABEL = 'PDF, Word, Excel, PowerPoint, CSV, XML, TXT ou MD'

export const uploadSchema = z
  .object({
    chunkSize: z
      .number({ error: 'Digite um número.' })
      .int('Use um número inteiro, sem vírgula.')
      .min(100, 'O mínimo é 100.')
      .max(4000, 'O máximo é 4000.'),
    overlap: z
      .number({ error: 'Informe um número.' })
      .int('Use um número inteiro.')
      .min(0, 'Use 0 ou mais.'),
  })
  .refine((v) => v.overlap < v.chunkSize, {
    path: ['overlap'],
    message: 'O overlap precisa ser menor que o chunk size.',
  })

export type UploadFormValues = z.infer<typeof uploadSchema>

export function validateFile(file: File | null): string | null {
  if (!file) return 'Escolha um arquivo para enviar.'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const legacy = LEGACY_EXTENSIONS[ext]
  if (legacy) return `Arquivos .${ext} são de um formato antigo. Abra no ${legacy.app}, salve como .${legacy.to} e envie de novo.`
  if (!ACCEPTED_EXTENSIONS.includes(ext)) return `Este formato não é aceito. Envie um arquivo ${FORMATS_LABEL}.`
  if (file.size > MAX_FILE_BYTES) return 'Este arquivo tem mais de 20 MB. Envie um arquivo menor.'
  if (file.size === 0) return 'Este arquivo está vazio. Escolha outro.'
  return null
}

export const strategyOptions: { value: ChunkStrategy; label: string; hint: string }[] = [
  { value: 'fixed', label: 'Tamanho fixo', hint: 'Corta o texto em chunks do mesmo tamanho, mesmo no meio de uma frase.' },
  { value: 'paragraph', label: 'Por parágrafo', hint: 'Junta parágrafos inteiros até chegar ao tamanho escolhido.' },
  { value: 'semantic', label: 'Por frases', hint: 'Junta frases seguidas até chegar ao tamanho escolhido, sem cortar uma frase ao meio.' },
]

export interface ChunkPreset {
  id: string
  label: string
  description: string
  strategy: ChunkStrategy
  chunkSize: number
  overlapPercent: number
}

export const chunkPresets: ChunkPreset[] = [
  {
    id: 'long',
    label: 'Textos longos',
    description: 'Relatórios, livros e contratos. Chunks grandes guardam mais contexto.',
    strategy: 'paragraph',
    chunkSize: 1000,
    overlapPercent: 15,
  },
  {
    id: 'technical',
    label: 'Manuais e documentação',
    description: 'Guias e instruções. Chunks médios, com mais overlap para não perder o fio.',
    strategy: 'paragraph',
    chunkSize: 500,
    overlapPercent: 20,
  },
  {
    id: 'conversational',
    label: 'Perguntas e respostas',
    description: 'FAQs, transcrições e chamados. Chunks curtos para respostas diretas.',
    strategy: 'fixed',
    chunkSize: 300,
    overlapPercent: 10,
  },
]

export const presetOverlap = (p: ChunkPreset) => Math.round((p.chunkSize * p.overlapPercent) / 100)

const SAMPLE_SENTENCE =
  'Este é um texto de exemplo para mostrar como o seu documento será dividido. O texto real do arquivo só é lido depois do envio, mas a divisão segue as mesmas regras que você escolher aqui. '

export const PREVIEW_TEXT = SAMPLE_SENTENCE.repeat(12).trim()
const CHARS_PER_TOKEN = 4

/** Fatia o texto de exemplo em janelas de `chunkSize` tokens com `overlap` tokens de sobreposição. */
export function previewChunks(chunkSize: number, overlap: number): { text: string; tokens: number }[] {
  if (!Number.isFinite(chunkSize) || !Number.isFinite(overlap) || chunkSize < 1 || overlap < 0 || overlap >= chunkSize) {
    return []
  }
  const size = chunkSize * CHARS_PER_TOKEN
  const step = (chunkSize - overlap) * CHARS_PER_TOKEN
  const chunks: { text: string; tokens: number }[] = []
  for (let start = 0; start < PREVIEW_TEXT.length; start += step) {
    const text = PREVIEW_TEXT.slice(start, start + size)
    chunks.push({ text, tokens: Math.ceil(text.length / CHARS_PER_TOKEN) })
    if (start + size >= PREVIEW_TEXT.length) break
  }
  return chunks
}

/** 1 token ≈ ¾ de palavra (média para português). Usado só para explicar tamanhos a quem não conhece "tokens". */
export const tokensToWords = (tokens: number) => Math.round(tokens * 0.75)
