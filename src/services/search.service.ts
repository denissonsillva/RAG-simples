import type { SearchResult } from './types'

export interface SearchService {
  search(query: string, topK?: number): Promise<SearchResult[]>
}
