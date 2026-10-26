import type { SearchService } from '../search.service'
import type { SearchResult } from '../types'
import { loadChunks, loadDocuments } from './documents.mock'
import { termMatchesWord, tokenize } from '@/lib/text'
import { delay } from './storage'

export const mockSearchService: SearchService = {
  async search(query, topK = 5) {
    await delay(400, 900)
    const terms = [...new Set(tokenize(query))]
    if (terms.length === 0) return []

    const ready = new Map(
      loadDocuments()
        .filter((d) => d.status === 'ready')
        .map((d) => [d.id, d]),
    )

    const results: SearchResult[] = []
    for (const chunk of loadChunks()) {
      const doc = ready.get(chunk.documentId)
      if (!doc) continue
      const words = tokenize(chunk.text)
      const hits = terms.filter((t) => words.some((w) => termMatchesWord(t, w))).length
      if (hits === 0) continue
      results.push({
        chunkId: chunk.id,
        documentId: doc.id,
        documentName: doc.name,
        snippet: chunk.text,
        score: Math.min(0.98, 0.35 + 0.63 * (hits / terms.length)),
      })
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK)
  },
}
