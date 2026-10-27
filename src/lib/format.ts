const units = ['B', 'KB', 'MB', 'GB']

export function formatBytes(bytes: number): string {
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(i === 0 || value >= 10 ? 0 : 1)}\u00a0${units[i]}`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

export function fileTypeLabel(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase()
  return ext && ext.length <= 5 ? ext : 'ARQ'
}

/** Dólar com 6 casas: embeddings custam frações de centavo, e 2 casas mostrariam sempre zero. */
export function formatUsd(value: number, digits = 6): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatTokens(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/** "2026-10-14" -> "14/10" */
export function formatDayShort(key: string): string {
  const [, m, d] = key.split('-')
  return `${d}/${m}`
}
