import type { UsageDay, UsageRange } from '@/services'

export type Period = '7d' | '30d' | 'month'

export interface DayPoint {
  day: string
  indexing: number
  search: number
  total: number
  tokens: number
}

export interface Peak {
  day: string
  costUsd: number
  /** Quantas vezes acima da média dos dias anteriores. */
  ratio: number
}

const pad = (n: number) => String(n).padStart(2, '0')
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** Intervalo [from, to) e a lista de dias (inclusive os sem uso) do período, em data local. */
export function periodWindow(period: Period, now = new Date()): { range: UsageRange; days: string[] } {
  const today = startOfDay(now)
  const first = period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : addDays(today, period === '7d' ? -6 : -29)
  const end = addDays(today, 1)
  const days: string[] = []
  for (let d = first; d < end; d = addDays(d, 1)) days.push(dayKey(d))
  return { range: { from: first.toISOString(), to: end.toISOString() }, days }
}

/** Soma por dia, preenchendo com zero os dias sem uso para o gráfico não "pular". */
export function buildSeries(rows: UsageDay[], days: string[]): DayPoint[] {
  const byDay = new Map<string, DayPoint>(days.map((day) => [day, { day, indexing: 0, search: 0, total: 0, tokens: 0 }]))
  for (const r of rows) {
    const p = byDay.get(r.day)
    if (!p) continue
    p[r.kind] += r.costUsd
    p.total += r.costUsd
    p.tokens += r.tokens
  }
  return days.map((d) => byDay.get(d)!)
}

/** Dia mais alto que passa de 2x a média dos dias anteriores. Precisa de pelo menos 3 dias de histórico. */
export function findPeak(series: DayPoint[]): Peak | null {
  let best: Peak | null = null
  let sum = 0
  series.forEach((p, i) => {
    if (i >= 3) {
      const avg = sum / i
      if (avg > 0 && p.total > avg * 2 && (!best || p.total > best.costUsd)) {
        best = { day: p.day, costUsd: p.total, ratio: p.total / avg }
      }
    }
    sum += p.total
  })
  return best
}

/** Gasto estimado até o fim do mês, mantendo o ritmo médio diário até hoje. */
export function projectMonth(spent: number, now = new Date()): number {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return (spent / now.getDate()) * daysInMonth
}

export type BudgetLevel = 'ok' | 'warning' | 'over'

export function budgetLevel(spent: number, budget: number): BudgetLevel {
  if (budget <= 0) return spent > 0 ? 'over' : 'ok'
  const ratio = spent / budget
  return ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warning' : 'ok'
}

/** Aceita "6,5" e "6.5". Devolve null se não for um número válido e não negativo. */
export function parseUsd(input: string): number | null {
  const n = Number(input.trim().replace(',', '.'))
  return input.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null
}
