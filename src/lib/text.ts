// Utilidades de texto compartilhadas pela busca mock e pelo destaque dos resultados.
const STOPWORDS = new Set([
  'como', 'para', 'por', 'com', 'sem', 'uma', 'uns', 'umas', 'que', 'qual', 'quais', 'quando',
  'onde', 'dos', 'das', 'nos', 'nas', 'pelo', 'pela', 'pelos', 'pelas', 'sobre', 'ate', 'entre',
  'mais', 'menos', 'muito', 'ser', 'sao', 'foi', 'tem', 'ter', 'esta', 'este', 'esse', 'essa',
  'isso', 'isto', 'aos', 'seu', 'sua', 'seus', 'suas', 'ele', 'ela', 'eles', 'elas', 'quem',
  'fazer', 'pode', 'posso', 'preciso',
])

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

// Casamento por prefixo (5 letras) como aproximação de "mesmo radical".
export const termMatchesWord = (term: string, word: string) =>
  word === term || (term.length >= 5 && word.startsWith(term.slice(0, 5)))
