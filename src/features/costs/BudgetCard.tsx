import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { costsCopy } from '@/lib/copy'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { budgetLevel, parseUsd } from './calc'
import { useSetBudget } from './hooks'

interface BudgetCardProps {
  month: string
  spent: number
  projected: number
  budget: number | null
  isAdmin: boolean
}

const barColor = { ok: 'bg-primary', warning: 'bg-warning', over: 'bg-destructive' }
const textColor = { ok: 'text-success', warning: 'text-warning', over: 'text-destructive' }

export function BudgetCard({ month, spent, projected, budget, isAdmin }: BudgetCardProps) {
  const copy = costsCopy.budget
  const setBudget = useSetBudget()
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const [invalid, setInvalid] = useState(false)

  const open = () => {
    setInput(budget === null ? '' : String(budget).replace('.', ','))
    setInvalid(false)
    setEditing(true)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const usd = parseUsd(input)
    if (usd === null) return setInvalid(true)
    setBudget.mutate(usd, {
      onSuccess: () => {
        setEditing(false)
        toast.success(copy.saved)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  const showForm = editing || (budget === null && isAdmin)
  const level = budget === null ? null : budgetLevel(spent, budget)
  const percent = budget && budget > 0 ? Math.min(100, (spent / budget) * 100) : 0

  return (
    <section aria-labelledby="orcamento" className="space-y-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="orcamento" className="text-base font-medium">
          {copy.title(month)}
        </h2>
        {isAdmin && budget !== null && !editing && (
          <Button variant="ghost" size="sm" onClick={open}>
            {copy.edit}
          </Button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={submit} className="space-y-3" noValidate>
          {budget === null && <p className="text-muted-foreground">{copy.unsetAdmin}</p>}
          <div className="flex max-w-xs flex-col gap-1.5">
            <Label htmlFor="orcamento-valor">{copy.label}</Label>
            <Input
              id="orcamento-valor"
              inputMode="decimal"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-invalid={invalid}
              aria-describedby={invalid ? 'orcamento-erro' : undefined}
              placeholder="10,00"
            />
            {invalid && (
              <p id="orcamento-erro" role="alert" className="text-sm text-destructive">
                {copy.invalid}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={setBudget.isPending}>
              {copy.save}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                {copy.cancel}
              </Button>
            )}
          </div>
        </form>
      ) : budget === null ? (
        <p className="text-muted-foreground">{copy.unsetUser}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-2xl font-semibold tabular-nums">{copy.spentOf(formatUsd(spent), formatUsd(budget, 2))}</p>
            {level && <p className={cn('text-sm font-medium', textColor[level])}>{copy.level[level]} · {Math.round((spent / (budget || 1)) * 100)}%</p>}
          </div>
          <Progress value={percent} aria-label={copy.title(month)} indicatorClassName={level ? barColor[level] : undefined} />
          <p className="text-sm text-muted-foreground">{copy.projection(formatUsd(projected))}</p>
        </div>
      )}
    </section>
  )
}
