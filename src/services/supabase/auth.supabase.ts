import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { AuthService } from '../auth.service'
import type { User } from '../types'
import { supabase } from './client'

const toUser = (u: SupabaseUser): User => ({
  id: u.id,
  name: (u.user_metadata?.name as string | undefined) ?? u.email?.split('@')[0] ?? '',
  email: u.email ?? '',
})

function translate(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha inválidos.'
  if (m.includes('already registered')) return 'Já existe uma conta com este e-mail.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  if (m.includes('password')) return 'Senha inválida. Use ao menos 6 caracteres.'
  return message
}

export const supabaseAuthService: AuthService = {
  async signUp({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    })
    if (error) throw new Error(translate(error.message))
    // Sem sessão = confirmação de e-mail habilitada no projeto.
    if (!data.user || !data.session) {
      throw new Error('Conta criada. Confirme o e-mail enviado para poder entrar.')
    }
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
