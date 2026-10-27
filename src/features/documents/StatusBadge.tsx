import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DocumentStatus } from '@/services'

const config = {
  processing: { label: 'Processando', variant: 'secondary', icon: Loader2, spin: true },
  ready: { label: 'Pronto', variant: 'default', icon: CheckCircle2, spin: false },
  failed: { label: 'Falhou', variant: 'destructive', icon: XCircle, spin: false },
} as const

export function StatusBadge({ status, error }: { status: DocumentStatus; error?: string }) {
  const { label, variant, icon: Icon, spin } = config[status]
  return (
    <Badge variant={variant} title={error}>
      <Icon className={spin ? 'animate-spin' : undefined} aria-hidden />
      {label}
    </Badge>
  )
}
