import type { CostService } from '../costs.service'
import type { UsageDay, UserUsage } from '../types'
import { supabase } from './client'

const BUDGET_KEY = 'monthly_budget_usd'

// Linhas devolvidas pelas funções usage_daily e usage_by_user (numeric chega como número ou texto).
interface DailyRow {
  day: string
  kind: UsageDay['kind']
  tokens: number | string
  cost_usd: number | string
}
interface UserRow {
  user_id: string | null
  name: string
  email: string
  tokens: number | string
  cost_usd: number | string
  indexing_cost_usd: number | string
  search_cost_usd: number | string
}

// Detalhe técnico vai para o console; a tela mostra uma frase só.
function fail(context: string, message: string): never {
  console.error(context, message)
  throw new Error('Não conseguimos carregar os custos agora.')
}

export const supabaseCostService: CostService = {
  async getDaily({ from, to }, scope) {
    const { data, error } = await supabase.rpc('usage_daily', { p_from: from, p_to: to, p_scope: scope })
    if (error) fail('usage_daily', error.message)
    return ((data ?? []) as DailyRow[]).map(
      (r): UsageDay => ({ day: r.day, kind: r.kind, tokens: Number(r.tokens), costUsd: Number(r.cost_usd) }),
    )
  },

  async getByUser({ from, to }) {
    const { data, error } = await supabase.rpc('usage_by_user', { p_from: from, p_to: to })
    if (error) fail('usage_by_user', error.message)
    return ((data ?? []) as UserRow[]).map(
      (r): UserUsage => ({
        userId: r.user_id,
        name: r.name,
        email: r.email,
        tokens: Number(r.tokens),
        costUsd: Number(r.cost_usd),
        indexingCostUsd: Number(r.indexing_cost_usd),
        searchCostUsd: Number(r.search_cost_usd),
      }),
    )
  },

  async getBudget() {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', BUDGET_KEY).maybeSingle()
    if (error) fail('app_settings', error.message)
    return data ? Number(data.value) : null
  },

  async setBudget(usd) {
    const { error } = await supabase.from('app_settings').upsert({ key: BUDGET_KEY, value: usd })
    if (error) {
      console.error('app_settings', error.message)
      throw new Error('Não foi possível salvar o orçamento. Tente de novo.')
    }
  },

  async isAdmin() {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) fail('is_admin', error.message)
    return data === true
  },
}
