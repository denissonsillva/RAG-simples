import { Badge } from '@/components/ui/badge'
import { relevanceLevel } from '@/lib/copy'

/** Score de similaridade do chunk com a pergunta; a cor indica a faixa. */
export function RelevanceBadge({ score }: { score: number }) {
  const { label, tone } = relevanceLevel(score)
  return (
    <Badge variant={tone} className="shrink-0">
      {label}
    </Badge>
  )
}
