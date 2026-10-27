import { useMutation } from '@tanstack/react-query'
import { searchService } from '@/services'

export function useSearch() {
  return useMutation({
    mutationFn: ({ query, topK }: { query: string; topK: number }) => searchService.search(query, topK),
  })
}
