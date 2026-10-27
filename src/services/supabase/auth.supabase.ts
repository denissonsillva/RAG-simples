import type { User as SupabaseUser } from '@supabase/supabase-js'
import { EmailConfirmationRequiredError, type AuthService } from '../auth.service'
import type { User } from '../types'
import { supabase } from './client'

const toUser = (u: SupabaseUser): User => ({
  id: u.id,
  name: (u.user_metadata?.name as string | undefined) ?? u.email?.split('@')[0] ?? '',
  email: u.email ?? '',
})

function translate(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos. Confira os dados ou crie uma conta.'
  if (m.includes('already registered')) return 'Já existe uma conta com este e-mail. Tente entrar ou use outro e-mail.'
  if (m.includes('email not confirmed')) return 'Seu e-mail ainda não foi confirmado. Abra o link que enviamos e tente de novo.'
  if (m.includes('rate limit')) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
  if (m.includes('password')) return 'Essa senha não é aceita. Use pelo menos 6 caracteres.'
  // Qualquer outra coisa (rede, servidor) vai para o console; a pessoa vê uma frase simples.
  console.error('auth:', message)
  return 'Não conseguimos concluir agora. Confira sua conexão e tente de novo.'
}

export const supabaseAuthService: AuthService = {
  async signUp({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    })
    if (error) throw new Error(translate(error.message))
    // Sem sessão = confirmação de e-mail habilitada no projeto: o cadastro funcionou, falta abrir o link.
    if (!data.user || !data.session) throw new EmailConfirmationRequiredError(email.trim().toLowerCase())
    return toUser(data.user)
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw new Error(translate(error.message))
    return toUser(data.user)
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(translate(error.message))
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session ? toUser(data.session.user) : null
  },
}
