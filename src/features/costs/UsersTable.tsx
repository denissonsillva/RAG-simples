import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { costsCopy } from '@/lib/copy'
import { formatTokens, formatUsd } from '@/lib/format'
import type { UserUsage } from '@/services'

export function UsersTable({ rows }: { rows: UserUsage[] }) {
  const copy = costsCopy.users
  if (rows.length === 0) return <p className="text-muted-foreground">{copy.empty}</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.name}</TableHead>
          <TableHead className="text-right">{copy.indexing}</TableHead>
          <TableHead className="text-right">{copy.search}</TableHead>
          <TableHead className="text-right">{copy.tokens}</TableHead>
          <TableHead className="text-right">{copy.total}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.userId ?? r.email}>
            <TableCell>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.email}</div>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatUsd(r.indexingCostUsd)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUsd(r.searchCostUsd)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatTokens(r.tokens)}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{formatUsd(r.costUsd)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
