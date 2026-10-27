import type { CostService } from '../costs.service'
import type { UsageDay, UserUsage } from '../types'
import { delay } from './storage'

// Dados de exemplo (determinísticos) para desenvolver a tela sem o Supabase. Com um pico em 14 dias atrás.
const PRICE_PER_TOKEN = 0.02 / 1_000_000
const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function seedDays(): UsageDay[] {
  const out: UsageDay[] = []
  const today = new Date()
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const wave = 1 + Math.sin(i / 3)
    const indexing = Math.round((40_000 + wave * 30_000) * (i === 14 ? 9 : 1))
    const search = Math.round(8_000 + wave * 5_000)
    out.push({ day: dayKey(d), kind: 'indexing', tokens: indexing, costUsd: indexing * PRICE_PER_TOKEN })
    out.push({ day: dayKey(d), kind: 'search', tokens: search, costUsd: search * PRICE_PER_TOKEN })
  }
  return out
}

let budget: number | null = 0.5

export const mockCostService: CostService = {
  async getDaily({ from, to }, scope) {
    await delay(200, 500)
    const f = dayKey(new Date(from))
    const t = dayKey(new Date(to))
    const share = scope === 'mine' ? 0.4 : 1
    return seedDays()
      .filter((r) => r.day >= f && r.day < t)
      .map((r) => ({ ...r, tokens: Math.round(r.tokens * share), costUsd: r.costUsd * share }))
  },

  async getByUser(range) {
    await delay(200, 500)
    const total = (await mockCostService.getDaily(range, 'all')).reduce((s, r) => s + r.costUsd, 0)
    const tokens = Math.round(total / PRICE_PER_TOKEN)
    const rows: UserUsage[] = [
      { name: 'Denisson Silva', email: 'denisson.sillva@gmail.com', share: 0.6 },
      { name: 'Teste Upload', email: 'teste.upload.rag@example.com', share: 0.4 },
    ].map(({ name, email, share }) => ({
      userId: email,
      name,
      email,
      tokens: Math.round(tokens * share),
      costUsd: total * share,
      indexingCostUsd: total * share * 0.8,
      searchCostUsd: total * share * 0.2,
    }))
    return rows
  },

  async getBudget() {
    await delay(100, 300)
    return budget
  },

  async setBudget(usd) {
    await delay(100, 300)
    budget = usd
  },

  async isAdmin() {
    return true
  },
}
