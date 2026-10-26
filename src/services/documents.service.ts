import type { ChunkingConfig, Document } from './types'

export interface DocumentService {
  list(): Promise<Document[]>
  upload(file: File, chunking: ChunkingConfig): Promise<Document>
  remove(id: string): Promise<void>
}
