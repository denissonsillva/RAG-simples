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
  uploadedById?: string
  uploadedAt: string
  status: DocumentStatus
  error?: string
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

export type UsageKind = 'indexing' | 'search'
export type UsageScope = 'all' | 'mine'

/** Consumo de um dia (data local, AAAA-MM-DD) para um tipo de uso. */
export interface UsageDay {
  day: string
  kind: UsageKind
  tokens: number
  costUsd: number
}

export interface UserUsage {
  userId: string | null
  name: string
  email: string
  tokens: number
  costUsd: number
  indexingCostUsd: number
  searchCostUsd: number
}

/** Intervalo [from, to) em ISO. */
export interface UsageRange {
  from: string
  to: string
}
