import type { ChunkingConfig, Document } from './types'

export interface DocumentService {
  list(): Promise<Document[]>
  upload(file: File, chunking: ChunkingConfig): Promise<Document>
  /** Reenfileira o documento com a configuração de chunking já salva. Só o dono pode. */
  reprocess(id: string): Promise<void>
  remove(id: string): Promise<void>
}
