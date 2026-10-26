import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearch } from './hooks'
import { ResultCard } from './ResultCard'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const search = useSearch()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSubmitted(q)
    search.mutate(q)
  }

  return (
    <>
      <PageHeader
        title="Busca"
        description="Pergunte em linguagem natural. A busca devolve os trechos mais relevantes dos documentos."
      />

      <form onSubmit={onSubmit} className="mb-6 flex max-w-2xl gap-2" role="search">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: como solicitar férias?"
          aria-label="Pergunta"
          className="h-9"
        />
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
