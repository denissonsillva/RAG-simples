import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/layout/RouteGuards'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { CostsPage } from '@/features/costs/CostsPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { UploadPage } from '@/features/documents/UploadPage'
import { SearchPage } from '@/features/search/SearchPage'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/cadastro', element: <SignupPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/documentos" replace /> },
          { path: '/documentos', element: <DocumentsPage /> },
          { path: '/documentos/novo', element: <UploadPage /> },
          { path: '/busca', element: <SearchPage /> },
          { path: '/custos', element: <CostsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
