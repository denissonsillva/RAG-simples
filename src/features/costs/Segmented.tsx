import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

/** Alternância curta entre opções (ex.: Geral | Meu consumo). Cada botão informa se está selecionado. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-8 rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            o.value === value && 'bg-card text-foreground shadow-sm',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
