import { Outlet } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { SkipLink } from '@/components/layout/SkipLink'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Card, CardContent } from '@/components/ui/card'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <header className="flex items-center justify-between px-4 py-3 md:px-6">
        <Logo className="text-lg" />
        <ThemeToggle />
      </header>
      <main id="conteudo" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-10 outline-none">
        <Card className="w-full max-w-md">
          <CardContent className="pt-2">
            <Outlet />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
