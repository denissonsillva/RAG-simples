import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn } from '@/lib/utils'

/** Barra de progresso. `value={null}` mostra o estado indeterminado. */
function Progress({
  className,
  indicatorClassName,
  value,
  ...props
}: ProgressPrimitive.Root.Props & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root value={value} data-slot="progress" className={cn('w-full', className)} {...props}>
      <ProgressPrimitive.Track className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full rounded-full bg-primary transition-[width] duration-300',
            value === null && 'w-1/3 animate-pulse',
            indicatorClassName,
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
