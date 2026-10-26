import { z } from 'zod'
import type { ChunkStrategy } from '@/services'

export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md']

export const uploadSchema = z
  .object({
    chunkSize: z
      .number({ error: 'Informe um número.' })
      .int('Use um número inteiro.')
      .min(100, 'Mínimo de 100.')
      .max(4000, 'Máximo de 4000.'),
    overlap: z
      .number({ error: 'Informe um número.' })
      .int('Use um número inteiro.')
      .min(0, 'Não pode ser negativa.'),
  })
  .refine((v) => v.overlap < v.chunkSize, {
    path: ['overlap'],
    message: 'Deve ser menor que o tamanho do chunk.',
  })

export type UploadFormValues = z.infer<typeof uploadSchema>

export function validateFile(file: File | null): string | null {
  if (!file) return 'Selecione um arquivo.'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ACCEPTED_EXTENSIONS.includes(ext)) return 'Formato não aceito. Use PDF, DOCX, TXT ou MD.'
  if (file.size > MAX_FILE_BYTES) return 'O arquivo passa de 20 MB.'
  if (file.size === 0) return 'O arquivo está vazio.'
  return null
}

export const strategyOptions: { value: ChunkStrategy; label: string; hint: string }[] = [
  { value: 'fixed', label: 'Tamanho fixo', hint: 'Corta o texto a cada N caracteres.' },
  { value: 'paragraph', label: 'Por parágrafo', hint: 'Respeita quebras de parágrafo.' },
  { value: 'semantic', label: 'Semântico', hint: 'Agrupa trechos por assunto.' },
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
    label: 'Documento longo',
    description: 'Relatórios, livros, contratos. Chunks grandes preservam contexto entre parágrafos.',
    strategy: 'paragraph',
    chunkSize: 1000,
    overlapPercent: 15,
  },
  {
    id: 'technical',
    label: 'Técnico',
    description: 'Documentação e manuais. Respeita títulos e seções, com sobreposição maior.',
    strategy: 'paragraph',
    chunkSize: 500,
    overlapPercent: 20,
  },
  {
    id: 'conversational',
    label: 'Conversacional',
    description: 'FAQs, transcrições, tickets. Chunks curtos para respostas pontuais.',
    strategy: 'fixed',
    chunkSize: 300,
    overlapPercent: 10,
  },
]

export const presetOverlap = (p: ChunkPreset) => Math.round((p.chunkSize * p.overlapPercent) / 100)

const SAMPLE_SENTENCE =
  'Exemplo de texto para pré-visualização. Arquivos PDF e DOCX só têm o texto extraído no servidor, então o preview usa este conteúdo de exemplo para mostrar o efeito do tamanho do chunk e da sobreposição. '

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
