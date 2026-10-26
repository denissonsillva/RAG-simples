import type { ChunkingConfig, Document } from '../types'

export interface MockChunk {
  id: string
  documentId: string
  text: string
}

const defaultChunking: ChunkingConfig = { strategy: 'paragraph', chunkSize: 800, overlap: 100 }

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

export const seedDocuments: Document[] = [
  {
    id: 'doc-manual-onboarding',
    name: 'Manual de Onboarding.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2_450_000,
    uploadedBy: 'Ana Souza',
    uploadedAt: daysAgo(12),
    status: 'ready',
    chunking: defaultChunking,
    chunkCount: 4,
  },
  {
    id: 'doc-contrato-servicos',
    name: 'Contrato de Prestação de Serviços.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 380_000,
    uploadedBy: 'Carlos Lima',
    uploadedAt: daysAgo(8),
    status: 'ready',
    chunking: { strategy: 'fixed', chunkSize: 600, overlap: 80 },
    chunkCount: 4,
  },
  {
    id: 'doc-artigo-rag',
    name: 'Artigo - Introdução a RAG.md',
    mimeType: 'text/markdown',
    sizeBytes: 54_000,
    uploadedBy: 'Marina Alves',
    uploadedAt: daysAgo(5),
    status: 'ready',
    chunking: { strategy: 'semantic', chunkSize: 1000, overlap: 150 },
    chunkCount: 4,
  },
  {
    id: 'doc-curso-python',
    name: 'Curso de Python - Módulo 1.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 5_800_000,
    uploadedBy: 'Ana Souza',
    uploadedAt: daysAgo(2),
    status: 'ready',
    chunking: defaultChunking,
    chunkCount: 4,
  },
  {
    id: 'doc-politica-seguranca',
    name: 'Política de Segurança da Informação.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1_200_000,
    uploadedBy: 'Carlos Lima',
    uploadedAt: daysAgo(1),
    status: 'failed',
    chunking: defaultChunking,
    chunkCount: 0,
  },
]

export const seedChunks: MockChunk[] = [
  { id: 'c1', documentId: 'doc-manual-onboarding', text: 'No primeiro dia, o novo colaborador recebe o acesso aos sistemas internos, o equipamento de trabalho e é apresentado à equipe. O gestor direto acompanha toda a primeira semana.' },
  { id: 'c2', documentId: 'doc-manual-onboarding', text: 'As férias devem ser solicitadas com pelo menos trinta dias de antecedência pelo portal de recursos humanos. O gestor aprova ou sugere nova data.' },
  { id: 'c3', documentId: 'doc-manual-onboarding', text: 'O reembolso de despesas de viagem exige nota fiscal e deve ser enviado em até quinze dias após a viagem, com a aprovação do gestor.' },
  { id: 'c4', documentId: 'doc-manual-onboarding', text: 'O horário de trabalho é flexível entre oito e dez horas da manhã na entrada, respeitando a jornada de oito horas diárias e o banco de horas.' },
  { id: 'c5', documentId: 'doc-contrato-servicos', text: 'O contratado se compromete a prestar os serviços descritos no anexo I, com prazo de vigência de doze meses, renovável por acordo entre as partes.' },
  { id: 'c6', documentId: 'doc-contrato-servicos', text: 'O pagamento será realizado em até trinta dias após a emissão da nota fiscal. O atraso implica multa de dois por cento e juros de um por cento ao mês.' },
  { id: 'c7', documentId: 'doc-contrato-servicos', text: 'A rescisão do contrato exige aviso prévio de sessenta dias por escrito. A rescisão sem justa causa gera multa proporcional ao prazo restante.' },
  { id: 'c8', documentId: 'doc-contrato-servicos', text: 'As informações confidenciais trocadas entre as partes não podem ser divulgadas a terceiros, mesmo após o encerramento do contrato, pelo prazo de cinco anos.' },
  { id: 'c9', documentId: 'doc-artigo-rag', text: 'RAG, ou geração aumentada por recuperação, combina um modelo de linguagem com uma base de documentos. A busca recupera trechos relevantes que servem de contexto para a resposta.' },
  { id: 'c10', documentId: 'doc-artigo-rag', text: 'O chunking divide os documentos em pedaços menores antes de gerar embeddings. O tamanho do chunk e a sobreposição afetam a qualidade da recuperação.' },
  { id: 'c11', documentId: 'doc-artigo-rag', text: 'Embeddings são vetores numéricos que representam o significado de um texto. Textos parecidos ficam próximos no espaço vetorial, o que permite a busca semântica.' },
  { id: 'c12', documentId: 'doc-artigo-rag', text: 'Bancos vetoriais como o pgvector armazenam embeddings e calculam a similaridade por cosseno ou distância euclidiana para devolver os trechos mais próximos da pergunta.' },
  { id: 'c13', documentId: 'doc-curso-python', text: 'Variáveis em Python não precisam de declaração de tipo. O tipo é definido pelo valor atribuído, como números inteiros, textos e listas.' },
  { id: 'c14', documentId: 'doc-curso-python', text: 'Funções são definidas com a palavra def e podem retornar valores. Use funções para reaproveitar código e deixar o programa organizado.' },
  { id: 'c15', documentId: 'doc-curso-python', text: 'Listas e dicionários são as estruturas de dados mais usadas. Laços for percorrem listas, e compreensões de lista criam novas listas de forma curta.' },
  { id: 'c16', documentId: 'doc-curso-python', text: 'Exceções são tratadas com try e except. Tratar erros evita que o programa pare por causa de um arquivo ausente ou de uma entrada inválida.' },
]

// Banco de frases usado para gerar chunks pesquisáveis de documentos enviados.
export const phraseBank: string[] = [
  'Este documento descreve procedimentos e responsabilidades da equipe responsável.',
  'Os prazos devem ser respeitados e qualquer alteração precisa de aprovação prévia.',
  'A documentação deve ser mantida atualizada e acessível a todos os colaboradores.',
  'Os dados pessoais são tratados conforme a lei e armazenados com segurança.',
  'O processo de revisão ocorre a cada seis meses, com participação das áreas envolvidas.',
  'Os custos do projeto são acompanhados mensalmente e reportados à diretoria.',
  'Os requisitos técnicos incluem autenticação, controle de acesso e registro de auditoria.',
  'O treinamento inicial cobre as ferramentas, os fluxos de trabalho e as boas práticas.',
]
