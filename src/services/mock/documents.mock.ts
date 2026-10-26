import type { DocumentService } from '../documents.service'
import type { Document, User } from '../types'
import { phraseBank, seedChunks, seedDocuments, type MockChunk } from './seed'
import { delay, newId, readJson, writeJson } from './storage'

// Tempo simulado de processamento (extração, chunking e embeddings).
const PROCESSING_MS = 4000

export function loadDocuments(): Document[] {
  if (!readJson<boolean>('seeded', false)) {
    writeJson('documents', seedDocuments)
    writeJson('chunks', seedChunks)
    writeJson('seeded', true)
  }
  const docs = readJson<Document[]>('documents', [])
  const now = Date.now()
  let changed = false
  const settled = docs.map((d) => {
    if (d.status === 'processing' && now - new Date(d.uploadedAt).getTime() > PROCESSING_MS) {
      changed = true
      return { ...d, status: 'ready' as const }
    }
    return d
  })
  if (changed) writeJson('documents', settled)
  return settled
}

export function loadChunks(): MockChunk[] {
  loadDocuments()
  return readJson<MockChunk[]>('chunks', [])
}

function generateChunks(documentId: string, name: string, count: number): MockChunk[] {
  const title = name.replace(/\.[^.]+$/, '')
  return Array.from({ length: Math.min(count, 6) }, (_, i) => ({
    id: newId(),
    documentId,
    text: `${title}, trecho ${i + 1}. ${phraseBank[(i * 3 + title.length) % phraseBank.length]} ${phraseBank[(i * 5 + 1) % phraseBank.length]}`,
  }))
}

export const mockDocumentService: DocumentService = {
  async list() {
    await delay()
    return loadDocuments().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  },

  async upload(file, chunking) {
    await delay(600, 1200)
    const session = readJson<User | null>('session', null)
    const step = Math.max(chunking.chunkSize - chunking.overlap, 1)
    const doc: Document = {
      id: newId(),
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      uploadedBy: session?.name ?? 'Usuário',
      uploadedAt: new Date().toISOString(),
      status: 'processing',
      chunking,
      chunkCount: Math.max(1, Math.ceil(file.size / step)),
    }
    const docs = loadDocuments()
    writeJson('documents', [doc, ...docs])
    writeJson('chunks', [...loadChunks(), ...generateChunks(doc.id, doc.name, doc.chunkCount)])
    return doc
  },

  async remove(id) {
    await delay()
    writeJson('documents', loadDocuments().filter((d) => d.id !== id))
    writeJson('chunks', loadChunks().filter((c) => c.documentId !== id))
  },
}
