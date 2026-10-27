import { Search, SearchX } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { searchCopy } from '@/lib/copy'
import { useSearch } from './hooks'
import { ResultCard } from './ResultCard'

// Quantos trechos a busca devolve (limite da Edge Function: 20).
const TOP_K_OPTIONS = [3, 5, 10, 20]
const DEFAULT_TOP_K = 5
const topKItems = TOP_K_OPTIONS.map((n) => ({ value: String(n), label: searchCopy.topKOption(n) }))

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [topK, setTopK] = useState(DEFAULT_TOP_K)
  const search = useSearch()
  // top-k da busca que gerou o resultado em tela (o seletor pode já ter mudado)
  const requestedTopK = search.variables?.topK ?? topK

  const run = (q: string, k = topK) => {
    setSubmitted(q)
    search.mutate({ query: q, topK: k })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) run(q)
  }

  const searchExample = (q: string) => {
    setQuery(q)
    run(q)
  }

  // Mudar a quantidade refaz a última busca com o novo limite.
  const onTopKChange = (value: string | null) => {
    if (!value) return
    const next = Number(value)
    setTopK(next)
    if (submitted) run(submitted, next)
  }

  return (
    <>
      <PageHeader title={searchCopy.title} description={searchCopy.description} />

      <form onSubmit={onSubmit} className="mb-8 space-y-3" role="search">
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <div className="relative flex-1 basis-full sm:basis-0">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchCopy.placeholder}
              aria-label="Sua pergunta"
              name="pergunta"
              autoComplete="off"
              enterKeyHint="search"
              className="h-12 rounded-xl pl-12 text-base"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 w-full rounded-xl sm:w-auto" disabled={search.isPending || !query.trim()}>
            {search.isPending ? <Spinner /> : <Search aria-hidden />}
            Buscar
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="quantidade" className="text-sm text-muted-foreground">
            {searchCopy.topKLabel}
          </Label>
          <Select value={String(topK)} items={topKItems} onValueChange={onTopKChange}>
            <SelectTrigger id="quantidade" className="w-40">
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
        </div>
      </form>

      <div className="space-y-4" aria-live="polite">
        {search.isPending && (
          <div className="space-y-3" aria-busy="true">
            <p className="sr-only" role="status">
              {searchCopy.loading}
            </p>
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        )}

        {search.isError && (
          <Alert variant="destructive">
            <AlertDescription className="text-foreground">{searchCopy.error}</AlertDescription>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => run(submitted, requestedTopK)}>
              Tentar de novo
            </Button>
          </Alert>
        )}

        {search.isSuccess && search.data.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-primary">
              <SearchX className="size-7" aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-medium">{searchCopy.empty(submitted).title}</h2>
              <p className="mx-auto max-w-md text-muted-foreground">{searchCopy.empty(submitted).body}</p>
            </div>
            <Link to="/documentos/novo" className={buttonVariants({ variant: 'outline' })}>
              Enviar um documento
            </Link>
          </div>
        )}

        {search.isSuccess && search.data.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-muted-foreground tabular-nums">
              {searchCopy.count(search.data.length, requestedTopK)}
            </h2>
            {search.data.map((r) => (
              <ResultCard key={r.chunkId} result={r} query={submitted} />
            ))}
          </>
        )}

        {search.isIdle && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-primary">
              <Search className="size-7" aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-medium">{searchCopy.idle.title}</h2>
              <p className="text-muted-foreground">{searchCopy.idle.body}</p>
            </div>
            <ul className="flex flex-wrap justify-center gap-2">
              {searchCopy.examples.map((q) => (
                <li key={q}>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => searchExample(q)}>
                    {q}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
