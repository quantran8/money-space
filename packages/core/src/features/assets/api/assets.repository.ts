import { apiRequest } from '#/shared/api/http'
import type {
  Asset,
  AssetClass,
  AssetDeleteImpact,
  AssetSnapshotPoint,
  MarketQuote,
} from '#/features/assets/model/assets.types'

type AssetRecord = Asset & {
  currentValue: number
  valueUpdatedAt: string
}

type AssetListResponse = {
  household: {
    id: string
    name: string
    currency: string
    updateFrequency: string
    createdAt: string
  }
  asOf: string
  items: AssetRecord[]
  total: number
}

type AssetSummaryResponse = {
  householdId: string
  asOf: string
  totals: {
    usable_now: number
    not_immediately_usable: number
    long_term: number
    totalAssets: number
  }
  groups: Array<{
    liquidity: 'usable_now' | 'not_immediately_usable' | 'long_term'
    name: string
    value: number
  }>
}

type AssetSnapshotsResponse = {
  householdId: string
  items: Array<{
    date: string
    usableNow: number
    notImmediatelyUsable: number
    longTerm: number
  }>
  total: number
}

type AssetValueHistoryResponse = {
  householdId: string
  assetId: string
  currentValue: number
  items: Array<{ date: string; value: number }>
  total: number
}

export type AssetValuePoint = {
  date: string
  value: number
}

export type AssetPayload = Omit<Asset, 'id' | 'liquidity'> & {
  /**
   * The wallet a purchase was paid from, or null when the household is
   * declaring something it already owns. Lives on the payload, NOT on `Asset`:
   * it describes one acquisition, not the asset — buying more of the same
   * position later has no single value to store. Purchase history is kept in
   * money events, next to sales.
   */
  fundingAssetId?: string | null
}

export function listAssets(householdId: string) {
  return apiRequest<AssetListResponse>(`/api/households/${householdId}/assets`)
}

export function getAssetSummary(householdId: string) {
  return apiRequest<AssetSummaryResponse>(`/api/households/${householdId}/assets/summary`)
}

export async function getAssetSnapshots(householdId: string) {
  const response = await apiRequest<AssetSnapshotsResponse>(
    `/api/households/${householdId}/assets/snapshots`,
  )
  return {
    ...response,
    items: response.items.map(
      (item): AssetSnapshotPoint => ({
        date: item.date,
        usable_now: item.usableNow,
        not_immediately_usable: item.notImmediatelyUsable,
        long_term: item.longTerm,
      }),
    ),
  }
}

export async function getAssetValueHistory(householdId: string, assetId: string) {
  const response = await apiRequest<AssetValueHistoryResponse>(
    `/api/households/${householdId}/assets/${assetId}/value-history`,
  )
  return {
    currentValue: response.currentValue,
    items: response.items.map(
      (item): AssetValuePoint => ({ date: item.date, value: item.value }),
    ),
  }
}

export function createAsset(householdId: string, payload: AssetPayload) {
  return apiRequest(`/api/households/${householdId}/assets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAsset(
  householdId: string,
  assetId: string,
  payload: Partial<AssetPayload>,
) {
  return apiRequest(`/api/households/${householdId}/assets/${assetId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/**
 * What deleting this asset would detach — goals whose claims would go, events
 * and debts that would lose their wallet pointer.
 *
 * Read BEFORE the delete, so the confirmation can say what it costs. The server
 * refuses a delete while any of these exist unless `cascade` is passed, and this
 * is where the household gets what it needs to decide.
 */
export function assetDeleteImpact(householdId: string, assetId: string) {
  return apiRequest<AssetDeleteImpact>(
    `/api/households/${householdId}/assets/${assetId}/delete-impact`,
  )
}

export function deleteAsset(householdId: string, assetId: string, cascade = false) {
  return apiRequest<{ deleted: boolean; assetId: string }>(
    `/api/households/${householdId}/assets/${assetId}${cascade ? '?cascade=true' : ''}`,
    {
      method: 'DELETE',
    },
  )
}

export function latestPrice(_assetClass: AssetClass, _symbol: string): MarketQuote | null {
  return null
}

export function fxToVnd(_currency: string): number {
  return 1
}
