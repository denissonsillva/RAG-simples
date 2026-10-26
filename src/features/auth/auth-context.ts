import { createContext } from 'react'
import type { SignInInput, SignUpInput, User } from '@/services'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (input: SignInInput) => Promise<void>
  signUp: (input: SignUpInput) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
