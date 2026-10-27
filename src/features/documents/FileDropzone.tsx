import { FileUp, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileTypeIcon } from '@/components/ui/file-type-icon'
import { formatBytes } from '@/lib/format'
import { FORMATS_LABEL } from './schemas'
import { cn } from '@/lib/utils'

interface FileDropzoneProps {
  file: File | null
  onFile: (file: File | null) => void
  accept: string
  error?: string | null
}

/** Toda a área é um rótulo do campo de arquivo: clicar em qualquer ponto (ou Enter/Espaço com foco) abre a seleção. */
export function FileDropzone({ file, onFile, accept, error }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const inputId = useId()
  const errorId = `${inputId}-error`

  const choose = (next: File | null) => {
    onFile(next)
    if (inputRef.current) inputRef.current.value = '' // permite escolher o mesmo arquivo de novo
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        choose(e.dataTransfer.files[0] ?? null)
      }}
      className="space-y-2"
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="peer sr-only"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        onChange={(e) => choose(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
            error && 'border-destructive',
          )}
        >
          <FileTypeIcon name={file.name} />
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">{formatBytes(file.size)}</p>
          </div>
          <div className="flex gap-1">
            <label
              htmlFor={inputId}
              className="inline-flex h-10 cursor-pointer items-center rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Trocar arquivo
            </label>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remover ${file.name}`} onClick={() => choose(null)}>
              <X className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-card p-8 text-center transition-colors hover:border-primary hover:bg-brand-soft/50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
            dragging && 'border-primary bg-brand-soft',
            error && 'border-destructive',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-primary">
            <FileUp className="size-6" aria-hidden />
          </span>
          <span className="space-y-1">
            <span className="block font-medium">Arraste um arquivo para cá</span>
            <span className="block text-primary underline underline-offset-4">ou escolha no seu computador</span>
          </span>
          <span className="text-sm text-muted-foreground">{FORMATS_LABEL} · até 20 MB</span>
        </label>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
