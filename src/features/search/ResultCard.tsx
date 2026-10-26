import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { normalize, termMatchesWord, tokenize } from '@/lib/text'
import type { SearchResult } from '@/services'

// Destaca as palavras do trecho que casam com algum termo relevante da busca.
function highlight(text: string, query: string) {
  const terms = tokenize(query)
  return text.split(/(\s+)/).map((part, i) => {
    const word = normalize(part).replace(/[^a-z0-9]/g, '')
    const hit = word.length >= 3 && terms.some((t) => termMatchesWord(t, word))
    return hit ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40">
        {part}
      </mark>
    ) : (
      part
    )
  })
}

export function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{result.documentName}</span>
          </span>
          <Badge variant="secondary" aria-label={`Relevância ${Math.round(result.score * 100)} por cento`}>
            {result.score.toFixed(2)}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{highlight(result.snippet, query)}</p>
      </CardContent>
    </Card>
  )
}
