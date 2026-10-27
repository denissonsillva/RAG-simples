import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Indicador de carregamento. Sem `label`, fica oculto para leitores de tela (use dentro de algo já anunciado). */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <Loader2
      className={cn('size-4 animate-spin', className)}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
