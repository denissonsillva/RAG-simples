import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentService, type ChunkingConfig } from '@/services'

export const documentsKey = ['documents'] as const

export function useDocuments() {
  return useQuery({
    queryKey: documentsKey,
    queryFn: () => documentService.list(),
    // enquanto houver documento em processamento, atualiza a lista sozinha
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.status === 'processing') ? 2000 : false,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, chunking }: { file: File; chunking: ChunkingConfig }) =>
      documentService.upload(file, chunking),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey }),
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey }),
  })
}
