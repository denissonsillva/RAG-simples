import { FileText, FileType2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const kinds: Record<string, { icon: LucideIcon; className: string }> = {
  pdf: { icon: FileType2, className: 'bg-destructive/10 text-destructive' },
  docx: { icon: FileText, className: 'bg-brand-soft text-primary' },
}
const fallback = { icon: FileText, className: 'bg-muted text-muted-foreground' }

/** Ícone colorido por tipo de arquivo, no estilo das listas de arquivos que as pessoas já conhecem. */
export function FileTypeIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const { icon: Icon, className: tone } = kinds[ext] ?? fallback
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tone, className)}>
      <Icon className="size-5" aria-hidden />
    </span>
  )
}
