import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { costService, type UsageRange, type UsageScope } from '@/services'

const STALE = 60_000

export const useDailyUsage = (range: UsageRange, scope: UsageScope) =>
  useQuery({
    queryKey: ['costs', 'daily', scope, range.from, range.to],
    queryFn: () => costService.getDaily(range, scope),
    staleTime: STALE,
  })

export const useUsageByUser = (range: UsageRange, enabled: boolean) =>
  useQuery({
    queryKey: ['costs', 'by-user', range.from, range.to],
    queryFn: () => costService.getByUser(range),
    enabled,
    staleTime: STALE,
  })

export const useBudget = () => useQuery({ queryKey: ['costs', 'budget'], queryFn: () => costService.getBudget() })

export const useIsAdmin = () =>
  useQuery({ queryKey: ['costs', 'is-admin'], queryFn: () => costService.isAdmin(), staleTime: Infinity })

export function useSetBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (usd: number) => costService.setBudget(usd),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['costs', 'budget'] }),
  })
}
