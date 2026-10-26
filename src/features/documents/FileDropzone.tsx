import { FileUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface FileDropzoneProps {
  file: File | null
  onFile: (file: File | null) => void
  accept: string
  invalid?: boolean
}

export function FileDropzone({ file, onFile, accept, invalid }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

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
        onFile(e.dataTransfer.files[0] ?? null)
      }}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors',
        dragging && 'border-primary bg-muted',
        invalid && 'border-destructive',
      )}
    >
      <FileUp className="size-7 text-muted-foreground" aria-hidden />
      <p className="text-sm">
        {file ? (
          <span className="font-medium">{file.name}</span>
        ) : (
          'Arraste um arquivo aqui ou'
        )}{' '}
        <button
          type="button"
          className="font-medium underline underline-offset-4"
          onClick={() => inputRef.current?.click()}
        >
          {file ? 'trocar arquivo' : 'escolha no computador'}
        </button>
      </p>
      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT ou MD, até 20 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label="Arquivo"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
