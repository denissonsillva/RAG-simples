export interface User {
  id: string
  name: string
  email: string
}

export type ChunkStrategy = 'fixed' | 'paragraph' | 'semantic'

export interface ChunkingConfig {
  strategy: ChunkStrategy
  chunkSize: number
  overlap: number
}

export type DocumentStatus = 'processing' | 'ready' | 'failed'

export interface Document {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  uploadedAt: string
  status: DocumentStatus
  chunking: ChunkingConfig
  chunkCount: number
}

export interface SearchResult {
  chunkId: string
  documentId: string
  documentName: string
  snippet: string
  score: number
}

export interface SignUpInput {
  name: string
  email: string
  password: string
}

export interface SignInInput {
  email: string
  password: string
}
