import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { FormField } from '@/components/layout/FormField'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ChunkStrategy } from '@/services'
import {
  chunkPresets,
  presetOverlap,
  previewChunks,
  strategyOptions,
  type ChunkPreset,
  type UploadFormValues,
} from './schemas'

interface ChunkingFieldsProps {
  strategy: ChunkStrategy
  onStrategyChange: (value: ChunkStrategy) => void
  chunkSize: number
  overlap: number
  onPresetSelect: (preset: ChunkPreset) => void
  register: UseFormRegister<UploadFormValues>
  errors: FieldErrors<UploadFormValues>
}

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
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">Fatiamento</legend>
      <p className="text-xs text-muted-foreground">
        Cada chunk vira um vetor. É o fatiamento que determina o que a busca consegue encontrar — e ele
        pode ser trocado depois sem reenviar o arquivo.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {chunkPresets.map((preset) => {
          const selected =
            preset.strategy === strategy &&
            preset.chunkSize === chunkSize &&
            presetOverlap(preset) === overlap
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onPresetSelect(preset)}
              className={cn(
                'flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50',
                selected && 'border-foreground bg-muted/40 ring-1 ring-foreground/20',
              )}
            >
              <span className="text-sm font-medium">{preset.label}</span>
              <span className="text-xs text-muted-foreground">{preset.description}</span>
              <span className="mt-auto pt-2 font-mono text-xs text-muted-foreground">
                {preset.chunkSize} tokens · {preset.overlapPercent}% overlap
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
          className="flex w-full items-center justify-between py-1 text-sm font-medium"
        >
          Avançado
          <ChevronDown
            className={cn('size-4 text-muted-foreground transition-transform', advancedOpen && 'rotate-180')}
          />
        </button>

        <div id="chunking-advanced" hidden={!advancedOpen} className="mt-3 space-y-4">
          <FormField id="strategy" label="Estratégia">
            <Select
              value={strategy}
              items={items}
              onValueChange={(v) => v && onStrategyChange(v as ChunkStrategy)}
            >
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
            {current && <p className="text-xs text-muted-foreground">{current.hint}</p>}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="chunkSize" label="Tamanho do chunk (tokens)" error={errors.chunkSize?.message}>
              <Input id="chunkSize" type="number" inputMode="numeric" {...register('chunkSize', { valueAsNumber: true })} />
            </FormField>
            <FormField id="overlap" label="Sobreposição (tokens)" error={errors.overlap?.message}>
              <Input id="overlap" type="number" inputMode="numeric" {...register('overlap', { valueAsNumber: true })} />
            </FormField>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div>
          <p className="text-sm font-medium">Pré-visualização</p>
          <p className="text-xs text-muted-foreground">
            Baseada em um texto de exemplo — PDF e DOCX são extraídos no servidor.
          </p>
        </div>
        {chunks.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ajuste os valores para ver a prévia.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {chunks.length} {chunks.length === 1 ? 'chunk' : 'chunks'} · média de {avgTokens} tokens
            </p>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-1 font-mono text-xs text-muted-foreground">
                chunk 1 · {chunks[0].tokens} tokens
              </p>
              <p className="line-clamp-4 text-sm">{chunks[0].text}</p>
            </div>
          </>
        )}
      </div>
    </fieldset>
  )
}
