import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileTypeIcon } from '@/components/ui/file-type-icon'
import { normalize, termMatchesWord, tokenize } from '@/lib/text'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/services'
import { RelevanceBadge } from './RelevanceBadge'

// Destaca as expressões do trecho que casam com a pergunta. Palavras seguidas viram um único destaque.
function highlight(text: string, query: string) {
  const terms = tokenize(query)
  const isHit = (part: string) => {
    const word = normalize(part).replace(/[^a-z0-9]/g, '')
    return word.length >= 3 && terms.some((t) => termMatchesWord(t, word))
  }

  const groups: { text: string; hit: boolean }[] = []
  for (const part of text.split(/(\s+)/)) {
    if (part === '') continue
    const hit = !/^\s+$/.test(part) && isHit(part)
    const last = groups[groups.length - 1]
    const joinsHit = hit && last?.hit
    const spaceInsideHit = /^\s+$/.test(part) && last?.hit
    if (last && (joinsHit || spaceInsideHit || (!hit && !last.hit))) last.text += part
    else groups.push({ text: part, hit })
  }
  // espaço entre duas palavras destacadas fica dentro do destaque; o espaço final vai para fora dele
  return groups.map((g, i) => {
    if (!g.hit) return g.text
    const trimmed = g.text.trimEnd()
    return (
      <span key={i}>
        <mark className="rounded bg-highlight px-0.5 text-highlight-foreground">{trimmed}</mark>
        {g.text.slice(trimmed.length)}
      </span>
    )
  })
}

export function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  const [expanded, setExpanded] = useState(false)
  const bodyId = `trecho-${result.chunkId}`

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-3 font-medium">
            <FileTypeIcon name={result.documentName} className="size-9" />
            <span className="truncate" title={result.documentName}>
              {result.documentName}
            </span>
          </span>
          <RelevanceBadge score={result.score} />
        </div>
        <p id={bodyId} className={cn('leading-relaxed text-muted-foreground', !expanded && 'line-clamp-5')}>
          {highlight(result.snippet, query)}
        </p>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((e) => !e)}
          className="-ml-2 inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary outline-none hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {expanded ? 'Mostrar menos' : 'Mostrar mais'}
          <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden />
        </button>
      </CardContent>
    </Card>
  )
}
