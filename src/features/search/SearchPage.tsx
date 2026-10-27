import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearch } from './hooks'
import { ResultCard } from './ResultCard'

// Quantos trechos a busca devolve (limite da Edge Function: 20).
const TOP_K_OPTIONS = [3, 5, 10, 20]
const DEFAULT_TOP_K = 5
const topKItems = TOP_K_OPTIONS.map((n) => ({ value: String(n), label: `${n} trechos` }))

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [topK, setTopK] = useState(DEFAULT_TOP_K)
  const search = useSearch()
  // top-k da busca que gerou o resultado em tela (o seletor pode já ter mudado)
  const requestedTopK = search.variables?.topK ?? topK

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSubmitted(q)
    search.mutate({ query: q, topK })
  }

  // Mudar o top-k refaz a última busca com o novo limite.
  const onTopKChange = (value: string | null) => {
    if (!value) return
    const next = Number(value)
    setTopK(next)
    if (submitted) search.mutate({ query: submitted, topK: next })
  }

  return (
    <>
      <PageHeader
        title="Busca"
        description="Pergunte em linguagem natural. A busca devolve os trechos mais relevantes dos documentos."
      />

      <form onSubmit={onSubmit} className="mb-6 flex max-w-2xl flex-wrap gap-2 sm:flex-nowrap" role="search">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: como solicitar férias?"
          aria-label="Pergunta"
          className="h-9"
        />
        <Select value={String(topK)} items={topKItems} onValueChange={onTopKChange}>
          <SelectTrigger aria-label="Quantidade de trechos (top-k)" className="h-9 w-32 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {topKItems.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="lg" disabled={search.isPending || !query.trim()}>
          <Search aria-hidden />
          Buscar
        </Button>
      </form>

      <div className="max-w-2xl space-y-3" aria-live="polite">
        {search.isPending && (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {search.isError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível buscar agora. Tente de novo.
          </p>
        )}

        {search.isSuccess && search.data.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum trecho encontrado para "{submitted}". Tente outras palavras.
          </p>
        )}

        {search.isSuccess && search.data.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {search.data.length} de {requestedTopK} trechos
          </p>
        )}

        {search.isSuccess &&
          search.data.map((r) => <ResultCard key={r.chunkId} result={r} query={submitted} />)}

        {search.isIdle && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Digite uma pergunta para ver os trechos mais relevantes.
          </p>
        )}
      </div>
    </>
  )
}
