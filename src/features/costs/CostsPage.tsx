import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { costsCopy } from '@/lib/copy'
import { formatDayShort, formatTokens, formatUsd } from '@/lib/format'
import type { UsageKind, UsageScope } from '@/services'
import { BudgetCard } from './BudgetCard'
import { buildSeries, findPeak, periodWindow, projectMonth, type Period } from './calc'
import { useBudget, useDailyUsage, useIsAdmin, useUsageByUser } from './hooks'
import { Segmented } from './Segmented'
import { UsageChart } from './UsageChart'
import { UsersTable } from './UsersTable'

const scopeOptions = (Object.keys(costsCopy.scope) as UsageScope[]).map((value) => ({ value, label: costsCopy.scope[value] }))
const periodOptions = (Object.keys(costsCopy.period) as Period[]).map((value) => ({ value, label: costsCopy.period[value] }))

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function CostsPage() {
  const [scope, setScope] = useState<UsageScope>('all')
  const [period, setPeriod] = useState<Period>('30d')
  const { data: isAdmin = false } = useIsAdmin()
  const { data: budget = null } = useBudget()

  const [now] = useState(() => new Date())
  const selected = useMemo(() => periodWindow(period, now), [period, now])
  const month = useMemo(() => periodWindow('month', now), [now])

  const daily = useDailyUsage(selected.range, scope)
  // O orçamento é do mês e do sistema todo, independente do período escolhido.
  const monthDaily = useDailyUsage(month.range, 'all')
  const byUser = useUsageByUser(selected.range, isAdmin && scope === 'all')

  const series = useMemo(() => buildSeries(daily.data ?? [], selected.days), [daily.data, selected.days])
  const peak = useMemo(() => findPeak(series), [series])
  const monthSpent = (monthDaily.data ?? []).reduce((s, r) => s + r.costUsd, 0)

  const cost = series.reduce((s, p) => s + p.total, 0)
  const tokens = series.reduce((s, p) => s + p.tokens, 0)
  const indexing = series.reduce((s, p) => s + p.indexing, 0)
  const search = series.reduce((s, p) => s + p.search, 0)
  const kindTokens = (kind: UsageKind) => (daily.data ?? []).filter((r) => r.kind === kind).reduce((s, r) => s + r.tokens, 0)
  const detail = (part: number, kind: UsageKind) =>
    `${formatTokens(kindTokens(kind))} tokens${cost > 0 ? ` · ${Math.round((part / cost) * 100)}% do total` : ''}`

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now)
  const isError = daily.isError || monthDaily.isError

  return (
    <>
      <PageHeader
        title={costsCopy.title}
        description={costsCopy.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Quem" value={scope} options={scopeOptions} onChange={setScope} />
            <Segmented label="Período" value={period} options={periodOptions} onChange={setPeriod} />
          </div>
        }
      />

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            {costsCopy.loadError}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void daily.refetch()
                void monthDaily.refetch()
              }}
            >
              Tentar de novo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {scope === 'all' &&
          (monthDaily.isLoading ? (
            <Skeleton className="h-36 rounded-2xl" />
          ) : (
            <BudgetCard
              month={monthName}
              spent={monthSpent}
              projected={projectMonth(monthSpent, now)}
              budget={budget}
              isAdmin={isAdmin}
            />
          ))}

        {daily.isLoading ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : (
          <>
            {!isError && cost === 0 && (
              <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
                <h2 className="text-lg font-medium">{costsCopy.empty.title}</h2>
                <p className="text-muted-foreground">{costsCopy.empty.body}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label={costsCopy.cards.cost} value={formatUsd(cost)} hint={`${formatTokens(tokens)} tokens`} />
              <Stat label={costsCopy.cards.indexing} value={formatUsd(indexing)} hint={detail(indexing, 'indexing')} />
              <Stat label={costsCopy.cards.search} value={formatUsd(search)} hint={detail(search, 'search')} />
            </div>

            <section aria-labelledby="grafico" className="space-y-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
              <h2 id="grafico" className="text-base font-medium">
                {costsCopy.chart.title}
              </h2>
              <UsageChart series={series} peak={peak} />
              <p className="text-sm text-muted-foreground">
                {peak
                  ? costsCopy.chart.peak(formatDayShort(peak.day), formatUsd(peak.costUsd), peak.ratio.toFixed(1).replace('.', ','))
                  : costsCopy.chart.noPeak}
              </p>
            </section>
          </>
        )}

        {isAdmin && scope === 'all' && (
          <section aria-labelledby="usuarios" className="space-y-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
            <h2 id="usuarios" className="text-base font-medium">
              {costsCopy.users.title}
            </h2>
            {byUser.isLoading ? <Skeleton className="h-24" /> : <UsersTable rows={byUser.data ?? []} />}
          </section>
        )}
      </div>
    </>
  )
}
