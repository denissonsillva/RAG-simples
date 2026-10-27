import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { statusLabel } from '@/lib/copy'
import type { DocumentStatus } from '@/services'

const config = {
  processing: { variant: 'info', icon: <Spinner className="size-3.5" /> },
  ready: { variant: 'success', icon: <CheckCircle2 aria-hidden /> },
  failed: { variant: 'destructive', icon: <XCircle aria-hidden /> },
} as const

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { variant, icon } = config[status]
  return (
    <Badge variant={variant}>
      {icon}
      {statusLabel[status]}
    </Badge>
  )
}
