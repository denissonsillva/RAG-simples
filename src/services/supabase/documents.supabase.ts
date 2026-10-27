import type { DocumentService } from '../documents.service'
import type { ChunkStrategy, Document, DocumentStatus } from '../types'
import { supabase } from './client'

const BUCKET = 'documents'

interface DocumentRow {
  id: string
  name: string
  mime_type: string
  size_bytes: number
  uploaded_by: string
  created_at: string
  status: DocumentStatus
  error: string | null
  chunk_strategy: ChunkStrategy
  chunk_size: number
  chunk_overlap: number
  chunk_count: number
  profiles: { name: string } | null
}

const toDocument = (r: DocumentRow): Document => ({
  id: r.id,
  name: r.name,
  mimeType: r.mime_type,
  sizeBytes: r.size_bytes,
  uploadedBy: r.profiles?.name ?? '—',
  uploadedById: r.uploaded_by,
  uploadedAt: r.created_at,
  status: r.status,
  error: r.error ?? undefined,
  chunking: { strategy: r.chunk_strategy, chunkSize: r.chunk_size, overlap: r.chunk_overlap },
  chunkCount: r.chunk_count,
})

const COLUMNS = '*, profiles(name)'

export const supabaseDocumentService: DocumentService = {
  async list() {
    const { data, error } = await supabase
      .from('documents')
      .select(COLUMNS)
      .order('created_at', { ascending: false })
      .overrideTypes<DocumentRow[]>()
    if (error) throw new Error(error.message)
    return data.map(toDocument)
  },

  async upload(file, chunking) {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Sessão expirada. Entre de novo.')

    const id = crypto.randomUUID()
    // <uid>/<id>/<arquivo>: a policy do bucket exige o uid na primeira pasta; o id evita colisão de nomes.
    const storagePath = `${auth.user.id}/${id}/${file.name.replace(/[^\w.-]+/g, '_')}`

    const { error: upError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type || undefined })
    if (upError) throw new Error(upError.message)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        id,
        name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        storage_path: storagePath,
        chunk_strategy: chunking.strategy,
        chunk_size: chunking.chunkSize,
        chunk_overlap: chunking.overlap,
      })
      .select(COLUMNS)
      .single()
    if (error) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      throw new Error(error.message)
    }

    // O processamento roda em segundo plano na Edge Function; a lista acompanha pelo status.
    const { error: fnError } = await supabase.functions.invoke('process-document', {
      body: { documentId: id },
    })
    if (fnError) {
      throw new Error('Arquivo enviado, mas o processamento não pôde ser iniciado.')
    }
    return toDocument(data as unknown as DocumentRow)
  },

  async reprocess(id) {
    // RLS + grant por coluna: o dono só consegue gravar status = 'processing'.
    const { data, error } = await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', id)
      .select('id')
    if (error) throw new Error(error.message)
    if (data.length === 0) throw new Error('Só quem enviou o documento pode reprocessá-lo.')

    const { error: fnError } = await supabase.functions.invoke('process-document', {
      body: { documentId: id },
    })
    if (fnError) throw new Error('Não foi possível iniciar o reprocessamento.')
  },

  async remove(id) {
    // Só o dono apaga (RLS). Linha primeiro: se a policy negar, nada é removido do Storage.
    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .select('storage_path')
    if (error) throw new Error(error.message)
    if (data.length === 0) throw new Error('Só quem enviou o documento pode excluí-lo.')
    await supabase.storage.from(BUCKET).remove(data.map((d) => d.storage_path))
  },
}
