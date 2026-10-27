import type { SignInInput, SignUpInput, User } from './types'

export interface AuthService {
  signUp(input: SignUpInput): Promise<User>
  signIn(input: SignInInput): Promise<User>
  signOut(): Promise<void>
  getSession(): Promise<User | null>
}

/** O cadastro deu certo, mas o projeto exige confirmar o e-mail antes do primeiro acesso. Não é uma falha. */
export class EmailConfirmationRequiredError extends Error {
  readonly email: string

  constructor(email: string) {
    super('Confirmação de e-mail pendente.')
    this.name = 'EmailConfirmationRequiredError'
    this.email = email
  }
}
