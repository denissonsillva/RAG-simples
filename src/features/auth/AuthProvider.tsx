import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, type User } from '@/services'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    authService
      .getSession()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async (input) => {
    setUser(await authService.signIn(input))
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(async (input) => {
    setUser(await authService.signUp(input))
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
