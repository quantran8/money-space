import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { getAssetValueHistory } from '@/features/assets/api/assets.repository'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useEvents } from '@/features/events/hooks/use-events'
import { computeCurrentValue } from '@/features/assets/model/assets'
import { AS_OF } from '@/features/assets/model/assets-form'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'
import type { MoneyEventItem } from '@/features/events/model/events.types'

/** One event linked to an asset, shown in the detail timeline. */
export type AssetEventEntry = {
  id: string
  title: string
  isoDate: string
  /** Signed VND amount from the asset's perspective (inflow > 0, outflow < 0). */
  amount: number
  type: MoneyEventItem['type']
  direction: MoneyEventItem['direction']
  note?: string
}

/** One point on the asset's value-over-time chart. */
export type AssetValuePoint = {
  isoDate: string
  value: number
}

/**
 * An event touches an asset when it is one side of the money move
 * (`fromAssetId` / `toAssetId`). We normalise the amount to the asset's own
 * perspective: money flowing *out* of this asset is negative, money flowing
 * *in* is positive.
 */
function amountForAsset(event: MoneyEventItem, assetId: string): number {
  const magnitude = Math.abs(event.amount)
  if (event.toAssetId === assetId) return magnitude
  if (event.fromAssetId === assetId) return -magnitude
  return 0
}

function touchesAsset(event: MoneyEventItem, assetId: string): boolean {
  return event.fromAssetId === assetId || event.toAssetId === assetId
}

/**
 * Resolve a single asset plus the timeline of money events that touched it, and
 * the value-over-time series.
 *
 * The value series comes from the backend `value-history` endpoint, which reads
 * the persisted `asset_value_history` series (a point is appended per
 * value-changing action, linked to the money event that caused it; older assets
 * fall back to reconstruction from money events). The related-events timeline is
 * derived here from the household's events.
 */
export function useAssetDetail(assetId: string | undefined) {
  const { activeHouseholdId } = useActiveHousehold()
  const { assets, asOf, isLoading: isLoadingAssets } = useAssets()
  const { events, isLoading: isLoadingEvents } = useEvents()

  const asset = useMemo(
    () => (assetId ? assets.find((item) => item.id === assetId) : undefined),
    [assets, assetId],
  )

  const valueHistoryQuery = useQuery({
    queryKey:
      activeHouseholdId && assetId
        ? queryKeys.assetValueHistory(activeHouseholdId, assetId)
        : ['asset-value-history', 'inactive'],
    queryFn: () => getAssetValueHistory(activeHouseholdId!, assetId!),
    enabled: !!activeHouseholdId && !!assetId,
  })

  const currentValue = useMemo(() => {
    if (valueHistoryQuery.data) return valueHistoryQuery.data.currentValue
    return asset ? computeCurrentValue(asset, asOf || AS_OF) ?? 0 : 0
  }, [valueHistoryQuery.data, asset, asOf])

  const valueHistory = useMemo<AssetValuePoint[]>(
    () =>
      (valueHistoryQuery.data?.items ?? []).map((point) => ({
        isoDate: point.date,
        value: point.value,
      })),
    [valueHistoryQuery.data],
  )

  const relatedEvents = useMemo<AssetEventEntry[]>(() => {
    if (!assetId) return []
    return events
      .filter((event) => touchesAsset(event, assetId))
      .map((event) => {
        // `title` was dropped from money events; the note now labels the entry,
        // falling back to the category code when empty.
        const label = event.note?.trim() || event.category
        return {
          id: event.id ?? `${event.isoDate}-${label}`,
          title: label,
          isoDate: event.isoDate,
          amount: amountForAsset(event, assetId),
          type: event.type,
          direction: event.direction,
          note: event.note || undefined,
        }
      })
      .sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0))
  }, [events, assetId])

  const totalInflow = useMemo(
    () => relatedEvents.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0),
    [relatedEvents],
  )
  const totalOutflow = useMemo(
    () => relatedEvents.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0),
    [relatedEvents],
  )

  return {
    asset,
    currentValue,
    relatedEvents,
    valueHistory,
    totalInflow,
    totalOutflow,
    isLoading: isLoadingAssets || isLoadingEvents || valueHistoryQuery.isLoading,
  }
}
