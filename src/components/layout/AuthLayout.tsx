import { FileSearch } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export function AuthLayout() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <FileSearch className="size-6" aria-hidden />
        RAG Docs
      </div>
      <Card className="w-full max-w-sm">
        <CardContent className="pt-2">
          <Outlet />
        </CardContent>
      </Card>
    </main>
  )
}
