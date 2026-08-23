import { apiRequest } from '#/shared/api/http'
import type { HouseholdSummary } from '#/shared/hooks/use-active-household'

export function updateHouseholdConfig(householdId: string, currency: string) {
  return apiRequest<HouseholdSummary>(`/api/households/${householdId}/config`, {
    method: 'PATCH',
    body: JSON.stringify({ currency }),
  })
}

/**
 * Delete the shared space. Creator-only on the server — one of the three
 * lifecycle operations — and irreversible, so the UI keeps it behind a
 * confirmation inside the household admin disclosure.
 */
export function deleteHousehold(householdId: string) {
  return apiRequest<{ deleted: true; householdId: string }>(
    `/api/households/${householdId}`,
    { method: 'DELETE' },
  )
}
