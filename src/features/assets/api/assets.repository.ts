import { apiRequest } from '@/shared/api/http'
import type {
  Asset,
  AssetClass,
  AssetSnapshotPoint,
  MarketQuote,
} from '@/features/assets/model/assets.types'

type AssetRecord = Asset & {
  currentValue: number
  currentValueDisplay: string
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
    valueDisplay: string
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

export type AssetPayload = Omit<Asset, 'id'>

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

export function deleteAsset(householdId: string, assetId: string) {
  return apiRequest<{ deleted: boolean; assetId: string }>(
    `/api/households/${householdId}/assets/${assetId}`,
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
