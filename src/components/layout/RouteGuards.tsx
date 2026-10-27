import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/features/auth/useAuth'

function FullScreenLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
      <Spinner className="size-5" />
      Carregando…
    </div>
  )
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoading />
  if (user) return <Navigate to="/documentos" replace />
  return <Outlet />
}
