// Textos que o usuário lê. Concentrados aqui para manter o tom (simples, com próximo passo) em um só lugar.
import type { DocumentStatus } from '@/services'

export const statusLabel: Record<DocumentStatus, string> = {
  processing: 'Processando…',
  ready: 'Pronto',
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
    return 'O processamento demorou mais do que o esperado. Toque em “Processar de novo”.'
  }
  if (r.includes('openai') || r.includes('segredo')) {
    return 'O serviço que processa os documentos está indisponível no momento. Tente de novo em alguns minutos.'
  }
  if (r.includes('limite')) {
    return 'Este arquivo é grande demais para a configuração escolhida. Envie de novo usando chunks maiores.'
  }
  return 'Algo deu errado ao processar este documento. Toque em “Processar de novo”.'
}

export const documentsCopy = {
  title: 'Documentos',
  description: 'Aqui estão os documentos de toda a equipe. Qualquer pessoa pode ver e buscar neles.',
  loadError: 'Não conseguimos carregar os documentos. Verifique sua conexão e tente de novo.',
  empty: { title: 'Nenhum documento por aqui ainda', body: 'Envie o primeiro arquivo e comece a fazer perguntas sobre ele.' },
  reprocessOk: (name: string) => `Processando “${name}” de novo.`,
  reprocessError: 'Não foi possível processar de novo agora. Tente em instantes.',
  deleteOk: (name: string) => `“${name}” foi excluído.`,
  deleteError: 'Não foi possível excluir o documento. Tente de novo.',
  deleteTitle: 'Excluir este documento?',
  deleteBody: (name: string) =>
    `“${name}” e os chunks usados na busca serão removidos para todas as pessoas. Essa ação não pode ser desfeita.`,
  onlyOwnerReprocess: 'Só quem enviou o documento pode processá-lo de novo.',
  onlyOwnerDelete: 'Só quem enviou o documento pode excluí-lo.',
  announce: (name: string, status: DocumentStatus) => `${name}: ${statusLabel[status].replace('…', '')}.`,
}

export const searchCopy = {
  title: 'Busca',
  description: 'Pergunte como se estivesse falando com uma pessoa. Retornamos os chunks dos documentos com maior score de similaridade.',
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
  topKLabel: 'Top-K (resultados)',
  topKOption: (n: number) => `${n} resultados`,
}

/** Mostra o score de similaridade (0 a 1). A cor segue faixas calibradas nos testes: chunks bons ficaram perto de 0,5 e o corte do servidor é 0,3. Reajuste com documentos reais. */
export function relevanceLevel(score: number): { label: string; tone: 'success' | 'info' | 'outline' } {
  const label = `Score ${score.toFixed(2).replace('.', ',')}`
  if (score >= 0.55) return { label, tone: 'success' }
  if (score >= 0.4) return { label, tone: 'info' }
  return { label, tone: 'outline' }
}

export const costsCopy = {
  title: 'Custos',
  description: 'Quanto a vetorização dos documentos e das buscas gasta com a IA (OpenAI), e como isso muda ao longo do tempo.',
  loadError: 'Não conseguimos carregar os custos. Verifique sua conexão e tente de novo.',
  scope: { all: 'Geral', mine: 'Meu consumo' },
  period: { '7d': '7 dias', '30d': '30 dias', month: 'Este mês' },
  budget: {
    title: (month: string) => `Orçamento de ${month}`,
    spentOf: (spent: string, budget: string) => `${spent} de ${budget}`,
    projection: (value: string) => `Se o ritmo continuar, o mês termina em ${value}.`,
    level: { ok: 'Dentro do limite', warning: 'Perto do limite', over: 'Limite ultrapassado' },
    unsetAdmin: 'Defina quanto você aceita gastar por mês. Avisamos aqui quando chegar perto.',
    unsetUser: 'O orçamento do mês ainda não foi definido por um administrador.',
    label: 'Orçamento mensal (US$)',
    save: 'Salvar',
    edit: 'Alterar',
    cancel: 'Cancelar',
    invalid: 'Digite um valor em dólar, como 10 ou 7,50.',
    saved: 'Orçamento salvo.',
  },
  cards: { cost: 'Custo total', tokens: 'Tokens usados', indexing: 'Vetorização de documentos', search: 'Vetorização de buscas' },
  chart: {
    title: 'Gasto por dia',
    indexing: 'Vetorização de documentos',
    search: 'Vetorização de buscas',
    peak: (day: string, value: string, ratio: string) => `Pico em ${day}: ${value}, cerca de ${ratio} vezes a média dos dias anteriores.`,
    noPeak: 'Nenhum pico no período.',
  },
  users: {
    title: 'Custo por usuário',
    name: 'Usuário',
    indexing: 'Documentos',
    search: 'Buscas',
    tokens: 'Tokens',
    total: 'Total',
    empty: 'Nenhum uso registrado neste período.',
  },
  empty: {
    title: 'Ainda não há consumo registrado',
    body: 'Os custos aparecem a partir do momento em que um documento é processado ou uma busca é feita.',
  },
}
