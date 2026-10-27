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
