// Único ponto que escolhe a implementação dos serviços.
// Tudo usa Supabase (Auth, documentos, busca). Os mocks em ./mock ficam só como referência da fase 1.
import { supabaseAuthService } from './supabase/auth.supabase'
import { supabaseDocumentService } from './supabase/documents.supabase'
import { supabaseSearchService } from './supabase/search.supabase'

export const authService = supabaseAuthService
export const documentService = supabaseDocumentService
export const searchService = supabaseSearchService

export { EmailConfirmationRequiredError } from './auth.service'
export type * from './types'
