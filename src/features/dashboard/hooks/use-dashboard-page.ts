import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview'
import { buildAssetBuckets } from '@/features/dashboard/model/dashboard'

/**
 * Home's page state.
 *
 * Deliberately small. The v3.1 Home (Phase 9) composes slices that own their
 * own data — financial state, flexible money and the forecast come from
 * `features/forecast`, freshness from `features/freshness`, the goal card from
 * `features/goals`. All this hook still owes Home is the gate on the snapshot
 * and the asset buckets behind Money Location.
 *
 * The pre-v3.1 net-worth hero, discuss topics, responsibility rows and
 * reserve-runway derivations were deleted with the components that consumed
 * them: Total Assets must not be the hero (§19) and small transactions are
 * banned from Home (§12).
 */
export function useDashboardPage() {
  const { snapshot, goals, assets, isLoading } = useDashboardOverview()

  // Keep the skeleton up until EVERY underlying query has resolved — not just
  // the snapshot. The snapshot query can finish before assets / goals, and
  // rendering on `!snapshot` alone would flash the page with empty sections.
  if (isLoading || !snapshot) {
    return { snapshot: undefined } as const
  }

  // Only non-empty buckets, so the segmented bar and legend stay honest when a
  // household holds just one or two classes.
  const { buckets } = buildAssetBuckets(assets)

  return {
    snapshot,
    goals,
    assetBuckets: buckets.filter((bucket) => bucket.value > 0),
  } as const
}
