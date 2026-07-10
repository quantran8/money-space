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

export type AttentionItem = {
  title: string
  reason: string
  level: string
}

export function getDashboard(householdId: string) {
  return apiRequest<DashboardOverview>(`/api/households/${householdId}/dashboard`)
}

export function listAttentionItems(householdId: string) {
  return apiRequest<{ householdId: string; items: AttentionItem[]; total: number }>(
    `/api/households/${householdId}/attention-items`,
  )
}
