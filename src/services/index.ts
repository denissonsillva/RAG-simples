// Único ponto que escolhe a implementação dos serviços.
// Para integrar o Supabase, troque os imports abaixo por ./supabase/*.
import { mockAuthService } from './mock/auth.mock'
import { mockDocumentService } from './mock/documents.mock'
import { mockSearchService } from './mock/search.mock'

export const authService = mockAuthService
export const documentService = mockDocumentService
export const searchService = mockSearchService

export type * from './types'
