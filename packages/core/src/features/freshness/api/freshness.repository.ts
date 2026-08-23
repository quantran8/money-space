import { apiRequest } from '#/shared/api/http'
import type { DataFreshnessResult } from '#/features/freshness/model/freshness.types'

export function getDataFreshness(householdId: string) {
  return apiRequest<DataFreshnessResult>(
    `/api/households/${householdId}/assets/data-freshness`,
  )
}

/**
 * "I checked — nothing changed." Bumps freshness WITHOUT writing a value, and
 * deliberately creates no valuation history point: nothing about the money
 * changed, so inventing a history entry would put a fictional data point on the
 * asset's chart.
 */
export function confirmAssetsUnchanged(householdId: string, assetIds?: string[]) {
  return apiRequest<{ confirmed: number; assetIds: string[] }>(
    `/api/households/${householdId}/assets/confirm-unchanged`,
    { method: 'POST', body: JSON.stringify({ assetIds }) },
  )
}
