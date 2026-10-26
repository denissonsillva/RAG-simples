import { FileSearch, FileText, LogOut, Search, Upload } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/documentos', label: 'Documentos', icon: FileText, end: true },
  { to: '/documentos/novo', label: 'Upload', icon: Upload, end: true },
  { to: '/busca', label: 'Busca', icon: Search, end: true },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="border-b bg-sidebar md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-4 py-3 text-base font-semibold md:py-5">
          <FileSearch className="size-5" aria-hidden />
          RAG Docs
        </div>
        <nav aria-label="Principal" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3 md:pb-0">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted text-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback>{user ? initials(user.name) : '?'}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{user?.name}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut aria-hidden />
            Sair
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
