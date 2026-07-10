import { apiRequest } from '@/shared/api/http'
import type { HouseholdSummary } from '@/shared/hooks/use-active-household'

export type CreateHouseholdPayload = {
  name: string
  currency: string
  updateFrequency?: 'weekly' | 'monthly' | 'manual'
  inviteEmail?: string
}

export function createHousehold(payload: CreateHouseholdPayload) {
  return apiRequest<HouseholdSummary>('/api/households', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
