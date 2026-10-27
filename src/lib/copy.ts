// Textos que o usuário lê. Concentrados aqui para manter o tom (simples, com próximo passo) em um só lugar.
import type { DocumentStatus } from '@/services'

export const statusLabel: Record<DocumentStatus, string> = {
  processing: 'Preparando…',
  ready: 'Pronto para buscar',
  failed: 'Não foi possível ler',
}

/** Traduz o motivo técnico gravado pelo servidor em uma frase com o que fazer em seguida. */
export function friendlyDocumentError(raw?: string): string {
  const r = (raw ?? '').toLowerCase()
  if (r.includes('nenhum texto')) {
    return 'Não encontramos texto neste arquivo. Se for um PDF, ele pode ser uma imagem escaneada. Envie uma versão em texto.'
  }
  if (r.includes('formato antigo')) {
    return 'Este arquivo está em um formato antigo que não conseguimos ler. Abra-o no Excel, PowerPoint ou Word, salve no formato novo (.xlsx, .pptx ou .docx) e envie de novo.'
  }
  if (r.includes('corrompido')) {
    return 'Não conseguimos abrir este arquivo. Ele pode estar danificado. Tente salvá-lo de novo e enviar outra vez.'
  }
  if (r.includes('tempo esgotado')) {
    return 'A preparação demorou mais do que o esperado. Toque em “Processar de novo”.'
  }
  if (r.includes('openai') || r.includes('segredo')) {
    return 'O serviço que prepara os documentos está indisponível no momento. Tente de novo em alguns minutos.'
  }
  if (r.includes('limite')) {
    return 'Este arquivo é grande demais para a configuração escolhida. Envie de novo usando trechos maiores.'
  }
  return 'Algo deu errado ao preparar este documento. Toque em “Processar de novo”.'
}

export const documentsCopy = {
  title: 'Documentos',
  description: 'Aqui estão os documentos de toda a equipe. Qualquer pessoa pode ver e buscar neles.',
  loadError: 'Não conseguimos carregar os documentos. Verifique sua conexão e tente de novo.',
  empty: { title: 'Nenhum documento por aqui ainda', body: 'Envie o primeiro arquivo e comece a fazer perguntas sobre ele.' },
  reprocessOk: (name: string) => `Preparando “${name}” de novo.`,
  reprocessError: 'Não foi possível processar de novo agora. Tente em instantes.',
  deleteOk: (name: string) => `“${name}” foi excluído.`,
  deleteError: 'Não foi possível excluir o documento. Tente de novo.',
  deleteTitle: 'Excluir este documento?',
  deleteBody: (name: string) =>
    `“${name}” e os trechos usados na busca serão removidos para todas as pessoas. Essa ação não pode ser desfeita.`,
  onlyOwnerReprocess: 'Só quem enviou o documento pode processá-lo de novo.',
  onlyOwnerDelete: 'Só quem enviou o documento pode excluí-lo.',
  announce: (name: string, status: DocumentStatus) => `${name}: ${statusLabel[status].replace('…', '')}.`,
}

export const searchCopy = {
  title: 'Busca',
  description: 'Pergunte como se estivesse falando com uma pessoa. Mostramos os trechos dos documentos que mais combinam.',
  placeholder: 'Ex.: Como solicitar férias…',
  idle: { title: 'O que você quer saber?', body: 'Escreva sua pergunta acima ou experimente uma destas:' },
  examples: ['Como solicito férias?', 'Posso trabalhar de casa?', 'Como funciona o reembolso de viagens?'],
  loading: 'Buscando nos documentos…',
  error: 'Não conseguimos buscar agora. Confira sua conexão e tente de novo.',
  empty: (q: string) => ({
    title: `Não encontramos nada sobre “${q}”`,
    body: 'Tente usar outras palavras ou faça a pergunta de outro jeito. Se o assunto não está em nenhum documento, envie um que fale dele.',
  }),
  count: (shown: number, asked: number) =>
    `Mostrando ${shown} de até ${asked} ${asked === 1 ? 'resultado' : 'resultados'}`,
  topKLabel: 'Quantidade de resultados',
  topKOption: (n: number) => `${n} resultados`,
}

/** Faixas calibradas nos testes: trechos bons ficaram perto de 0,5 e o corte do servidor é 0,3. Reajuste com documentos reais. */
export function relevanceLevel(score: number): { label: string; tone: 'success' | 'info' | 'outline' } {
  if (score >= 0.55) return { label: 'Muito relevante', tone: 'success' }
  if (score >= 0.4) return { label: 'Relevante', tone: 'info' }
  return { label: 'Pouco relevante', tone: 'outline' }
}
