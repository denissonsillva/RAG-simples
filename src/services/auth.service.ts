import type { SignInInput, SignUpInput, User } from './types'

export interface AuthService {
  signUp(input: SignUpInput): Promise<User>
  signIn(input: SignInInput): Promise<User>
  signOut(): Promise<void>
  getSession(): Promise<User | null>
}
