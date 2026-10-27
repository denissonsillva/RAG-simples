import { BookOpen, ChevronDown, MessagesSquare, Wrench, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { FormField } from '@/components/layout/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ChunkStrategy } from '@/services'
import {
  chunkPresets,
  presetOverlap,
  previewChunks,
  strategyOptions,
  tokensToWords,
  type ChunkPreset,
  type UploadFormValues,
} from './schemas'

const presetIcons: Record<string, LucideIcon> = {
  long: BookOpen,
  technical: Wrench,
  conversational: MessagesSquare,
}

interface ChunkingFieldsProps {
  strategy: ChunkStrategy
  onStrategyChange: (value: ChunkStrategy) => void
  chunkSize: number
  overlap: number
  onPresetSelect: (preset: ChunkPreset) => void
  register: UseFormRegister<UploadFormValues>
  errors: FieldErrors<UploadFormValues>
}

const words = (tokens: number) =>
  Number.isFinite(tokens) ? `≈ ${tokensToWords(tokens).toLocaleString('pt-BR')} palavras` : ''

export function ChunkingFields({
  strategy,
  onStrategyChange,
  chunkSize,
  overlap,
  onPresetSelect,
  register,
  errors,
}: ChunkingFieldsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const current = strategyOptions.find((o) => o.value === strategy)
  const items = strategyOptions.map(({ value, label }) => ({ value, label }))

  const chunks = previewChunks(chunkSize, overlap)
  const avgTokens = chunks.length
    ? Math.round(chunks.reduce((sum, c) => sum + c.tokens, 0) / chunks.length)
    : 0

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 id="chunking-title" className="text-lg font-semibold">
          2. Como dividir o texto
        </h2>
        <p className="text-muted-foreground">
          A busca encontra trechos do seu documento. Trechos menores dão respostas mais precisas; trechos maiores
          guardam mais contexto. Se não tiver certeza, use “Textos longos”.
        </p>
      </div>

      <div role="group" aria-labelledby="chunking-title" className="grid gap-3 sm:grid-cols-3">
        {chunkPresets.map((preset) => {
          const selected =
            preset.strategy === strategy && preset.chunkSize === chunkSize && presetOverlap(preset) === overlap
          const Icon = presetIcons[preset.id] ?? BookOpen
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onPresetSelect(preset)}
              className={cn(
                'flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:border-primary/60 hover:bg-brand-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                selected && 'border-primary bg-brand-soft ring-1 ring-primary',
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                <Icon className="size-5 text-primary" aria-hidden />
                {preset.label}
              </span>
              <span className="text-sm text-muted-foreground">{preset.description}</span>
              <span className="mt-auto pt-2 text-[0.8125rem] text-muted-foreground tabular-nums">
                {words(preset.chunkSize)} por trecho · repete {preset.overlapPercent}%
              </span>
            </button>
          )
        })}
      </div>

      <div className="border-t pt-3">
        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="chunking-advanced"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 font-medium outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Ajustes avançados
          <ChevronDown
            className={cn('size-5 text-muted-foreground transition-transform', advancedOpen && 'rotate-180')}
            aria-hidden
          />
        </button>

        <div id="chunking-advanced" hidden={!advancedOpen} className="mt-3 space-y-4">
          <FormField id="strategy" label="Jeito de dividir" hint={current?.hint}>
            <Select value={strategy} items={items} onValueChange={(v) => v && onStrategyChange(v as ChunkStrategy)}>
              <SelectTrigger id="strategy" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {strategyOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="chunkSize"
              label="Tamanho de cada trecho"
              hint={`Medido em tokens (1 token ≈ ¾ de palavra). Agora: ${words(chunkSize)}.`}
              error={errors.chunkSize?.message}
            >
              <Input id="chunkSize" type="number" inputMode="numeric" autoComplete="off" {...register('chunkSize', { valueAsNumber: true })} />
            </FormField>
            <FormField
              id="overlap"
              label="Repetição entre trechos"
              hint={`O final de um trecho se repete no começo do próximo, para não perder o contexto. Agora: ${words(overlap)}.`}
              error={errors.overlap?.message}
            >
              <Input id="overlap" type="number" inputMode="numeric" autoComplete="off" {...register('overlap', { valueAsNumber: true })} />
            </FormField>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div>
          <h3 className="font-medium">Como o texto será dividido</h3>
          <p className="text-[0.8125rem] text-muted-foreground">
            Exemplo ilustrativo. O texto do seu arquivo só é lido depois do envio.
          </p>
        </div>
        {chunks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ajuste os valores para ver a prévia.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {chunks.length} {chunks.length === 1 ? 'trecho' : 'trechos'} no exemplo · em média {words(avgTokens)}
            </p>
            <div className="rounded-xl border bg-muted/50 p-4">
              <p className="mb-1 text-[0.8125rem] font-medium text-muted-foreground">
                Trecho 1 · {words(chunks[0].tokens)}
              </p>
              <p className="line-clamp-4">{chunks[0].text}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
