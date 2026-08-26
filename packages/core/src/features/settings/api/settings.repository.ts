import { apiRequest } from '#/shared/api/http'
import type { HouseholdSummary } from '#/shared/hooks/use-active-household'

/**
 * The household's own settings. Every field is optional on the server and
 * validated only when present, so a caller may send one or both.
 */
export function updateHouseholdConfig(
  householdId: string,
  payload: { currency?: string; name?: string },
) {
  return apiRequest<HouseholdSummary>(`/households/${householdId}/config`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/**
 * Delete the shared space. Creator-only on the server — one of the three
 * lifecycle operations — and irreversible, so the UI keeps it behind a
 * confirmation inside the household admin disclosure.
 */
export function deleteHousehold(householdId: string) {
  return apiRequest<{ deleted: true; householdId: string }>(
    `/households/${householdId}`,
    { method: 'DELETE' },
  )
}
