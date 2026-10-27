import type { UsageDay, UsageRange, UsageScope, UserUsage } from './types'

export interface CostService {
  /** Série diária. `all` = consumo geral (sem identificar quem gastou); `mine` = só o do usuário logado. */
  getDaily(range: UsageRange, scope: UsageScope): Promise<UsageDay[]>
  /** Custo por usuário. Só administradores; para os outros o servidor recusa. */
  getByUser(range: UsageRange): Promise<UserUsage[]>
  /** Orçamento mensal em US$, ou null se ainda não foi definido. */
  getBudget(): Promise<number | null>
  setBudget(usd: number): Promise<void>
  isAdmin(): Promise<boolean>
}
