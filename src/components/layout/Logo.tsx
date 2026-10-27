import { FileSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5 font-semibold', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-primary">
        <FileSearch className="size-4.5" aria-hidden />
      </span>
      RAG Docs
    </span>
  )
}
