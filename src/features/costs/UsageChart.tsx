import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { costsCopy } from '@/lib/copy'
import { formatDayShort, formatUsd } from '@/lib/format'
import type { DayPoint, Peak } from './calc'

const config = {
  indexing: { label: costsCopy.chart.indexing, color: 'var(--chart-2)' },
  search: { label: costsCopy.chart.search, color: 'var(--chart-1)' },
} satisfies ChartConfig

export function UsageChart({ series, peak }: { series: DayPoint[]; peak: Peak | null }) {
  const total = series.reduce((s, p) => s + p.total, 0)
  return (
    <ChartContainer
      config={config}
      className="h-64 w-full"
      role="img"
      aria-label={`${costsCopy.chart.title}: ${formatUsd(total)} em ${series.length} dias.`}
    >
      <BarChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickFormatter={formatDayShort} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickFormatter={formatUsd} tickLine={false} axisLine={false} width={92} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, items) => formatDayShort(String(items[0]?.payload?.day ?? ''))}
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{config[name as keyof typeof config]?.label}</span>
                  <span className="font-mono font-medium tabular-nums">{formatUsd(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {peak && <ReferenceLine x={peak.day} stroke="var(--destructive)" strokeDasharray="4 4" />}
        <Bar dataKey="indexing" stackId="a" fill="var(--color-indexing)" />
        <Bar dataKey="search" stackId="a" fill="var(--color-search)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
