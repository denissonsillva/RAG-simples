import type { AuthService } from '../auth.service'
import type { SignInInput, SignUpInput, User } from '../types'
import { delay, newId, readJson, removeKey, writeJson } from './storage'

interface StoredUser extends User {
  password: string
}

const demoUser: StoredUser = {
  id: 'user-demo',
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  password: 'senha123',
}

const toUser = ({ id, name, email }: StoredUser): User => ({ id, name, email })

function loadUsers(): StoredUser[] {
  const users = readJson<StoredUser[]>('users', [])
  if (users.length === 0) {
    writeJson('users', [demoUser])
    return [demoUser]
  }
  return users
}

export const mockAuthService: AuthService = {
  async signUp({ name, email, password }: SignUpInput) {
    await delay()
    const users = loadUsers()
    const normalized = email.trim().toLowerCase()
    if (users.some((u) => u.email === normalized)) {
      throw new Error('Já existe uma conta com este e-mail.')
    }
    const user: StoredUser = { id: newId(), name: name.trim(), email: normalized, password }
    writeJson('users', [...users, user])
    writeJson('session', toUser(user))
    return toUser(user)
  },

  async signIn({ email, password }: SignInInput) {
    await delay()
    const normalized = email.trim().toLowerCase()
    const user = loadUsers().find((u) => u.email === normalized && u.password === password)
    if (!user) throw new Error('E-mail ou senha inválidos.')
    writeJson('session', toUser(user))
    return toUser(user)
  },

  async signOut() {
    await delay(100, 250)
    removeKey('session')
  },

  async getSession() {
    return readJson<User | null>('session', null)
  },
}
