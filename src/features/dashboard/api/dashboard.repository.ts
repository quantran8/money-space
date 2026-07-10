import { apiRequest } from '@/shared/api/http'

export type DashboardOverview = {
  updatedAt: string
  liquid: string
  liquidDisplay: string
  liquidSplit: {
    cash: string
    account: string
  }
  savings: string
  debt: string
  netWorthDisplay: string
  attentionCount: number
}

/**
 * The dashboard endpoint returns a rich object; the client only consumes the
 * `snapshot` block (assets/payments/etc. come from their own feature hooks).
 */
type DashboardResponse = {
  snapshot?: Partial<DashboardOverview> | null
}

const EMPTY_OVERVIEW: DashboardOverview = {
  updatedAt: '',
  liquid: '0',
  liquidDisplay: '0M',
  liquidSplit: { cash: '0M', account: '0M' },
  savings: '0M',
  debt: '0M',
  netWorthDisplay: '0M',
  attentionCount: 0,
}

export type AttentionItem = {
  title: string
  reason: string
  level: string
}

export async function getDashboard(householdId: string): Promise<DashboardOverview> {
  const response = await apiRequest<DashboardResponse>(
    `/api/households/${householdId}/dashboard`,
  )
  // Merge onto defaults so a partial/empty snapshot never yields undefined fields.
  return { ...EMPTY_OVERVIEW, ...(response.snapshot ?? {}) }
}

export function listAttentionItems(householdId: string) {
  return apiRequest<{ householdId: string; items: AttentionItem[]; total: number }>(
    `/api/households/${householdId}/attention-items`,
  )
}
