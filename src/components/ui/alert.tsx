import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm',
  {
    variants: {
      variant: {
        info: 'border-brand/40 bg-brand-soft text-foreground [&>svg]:text-primary',
        success: 'border-success/40 bg-success/10 text-foreground [&>svg]:text-success',
        warning: 'border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning',
        destructive: 'border-destructive/40 bg-destructive/10 text-foreground [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
} as const

type AlertProps = ComponentProps<'div'> & VariantProps<typeof alertVariants>

/** Erros são anunciados na hora (`alert`); os demais, com educação (`status`). */
function Alert({ className, variant = 'info', children, ...props }: AlertProps) {
  const Icon = icons[variant ?? 'info']
  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-5" aria-hidden />
      <div className="col-start-2 space-y-1">{children}</div>
    </div>
  )
}

function AlertTitle({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="alert-title" className={cn('font-medium', className)} {...props} />
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('text-muted-foreground', className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
