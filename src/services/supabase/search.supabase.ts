import { FunctionsHttpError } from '@supabase/supabase-js'
import type { SearchService } from '../search.service'
import type { SearchResult } from '../types'
import { supabase } from './client'

export const supabaseSearchService: SearchService = {
  async search(query, topK = 5) {
    const { data, error } = await supabase.functions.invoke<{ results: SearchResult[] }>('search-documents', {
      body: { query, topK },
    })
    if (error) {
      const detail = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null
      throw new Error(detail?.error ?? 'Não foi possível buscar agora.')
    }
    return data?.results ?? []
  },
}
