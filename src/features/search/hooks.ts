import { useMutation } from '@tanstack/react-query'
import { searchService } from '@/services'

export function useSearch() {
  return useMutation({
    mutationFn: (query: string) => searchService.search(query, 5),
  })
}
