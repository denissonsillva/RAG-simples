import { Badge } from '@/components/ui/badge'
import { relevanceLevel } from '@/lib/copy'

/** A nota numérica não diz nada a quem não conhece o assunto; a etiqueta diz. */
export function RelevanceBadge({ score }: { score: number }) {
  const { label, tone } = relevanceLevel(score)
  return (
    <Badge variant={tone} className="shrink-0">
      {label}
    </Badge>
  )
}
