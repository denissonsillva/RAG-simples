import { FileText, Search, Upload } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { SkipLink } from '@/components/layout/SkipLink'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { UserMenu } from '@/components/layout/UserMenu'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/documentos', label: 'Documentos', icon: FileText, end: true },
  { to: '/documentos/novo', label: 'Upload', icon: Upload, end: true },
  { to: '/busca', label: 'Busca', icon: Search, end: true },
]

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <SkipLink />
      <aside className="border-b bg-sidebar md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="px-4 py-3 text-base md:px-5 md:py-5">
          <Logo />
        </div>
        <nav aria-label="Principal" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3 md:pb-0">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive &&
                    'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:before:absolute md:before:inset-y-2 md:before:left-0 md:before:w-[3px] md:before:rounded-full md:before:bg-sidebar-primary',
                )
              }
            >
              <Icon className="size-4.5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-1 border-b bg-card px-3 py-2 md:px-4">
          <ThemeToggle />
          <UserMenu />
        </header>
        <main id="conteudo" tabIndex={-1} className="flex-1 p-4 outline-none md:p-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
