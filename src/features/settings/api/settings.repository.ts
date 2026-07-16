import { apiRequest } from '@/shared/api/http'
import type { HouseholdSummary } from '@/shared/hooks/use-active-household'

export function updateHouseholdConfig(householdId: string, currency: string) {
  return apiRequest<HouseholdSummary>(`/api/households/${householdId}/config`, {
    method: 'PATCH',
    body: JSON.stringify({ currency }),
  })
}
