import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  /** Escolha da pessoa (pode ser "system"). */
  theme: Theme
  /** Tema realmente aplicado agora. */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

export const THEME_STORAGE_KEY = 'rag-theme'
// Mesmas cores de --background; mantidas em sincronia com src/index.css e o script de index.html.
export const THEME_COLORS = { light: '#F6F9FC', dark: '#0E141B' } as const

export const ThemeContext = createContext<ThemeContextValue | null>(null)
