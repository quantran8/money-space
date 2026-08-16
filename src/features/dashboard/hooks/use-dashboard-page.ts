import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview'
import {
  buildGoalTracks,
  buildMoneyLocationMap,
} from '@/features/dashboard/model/home-derivations'
import { useFlexibleMoney, useForecast } from '@/features/forecast/hooks/use-forecast'
import { useFreshness } from '@/features/freshness/hooks/use-freshness'
import { useMembers } from '@/features/members/hooks/use-members'

/**
 * Home's page state (design.md §12).
 *
 * Composition only — every figure comes from the slice that owns it: the
 * forecast pair from `features/forecast`, coverage from `features/freshness`,
 * goals from `features/goals`, sources from `features/assets`.
 *
 * The skeleton is gated on the whole fan-out rather than on any single query,
 * because Home's sections are not independent: the hero, the low point and the
 * source list are three readings of the same inputs, and showing them as they
 * trickle in would let the household read a number before the block that
 * qualifies it has arrived (§2.15).
 *
 * Members are joined here for one reason only: to name who is RESPONSIBLE for a
 * source in §12.4 (§0.2, §16.4). Nothing on Home attributes spending.
 */
export function useDashboardPage() {
  const { snapshot, goals, assets, isLoading: overviewLoading } = useDashboardOverview()

  const { forecast, isLoading: forecastLoading } = useForecast()
  const { flexibleMoney, isLoading: flexibleLoading } = useFlexibleMoney()
  const { freshness, isLoading: freshnessLoading, confirmUnchanged } = useFreshness()
  const { members, isLoading: membersLoading } = useMembers()

  const isLoading =
    overviewLoading || forecastLoading || flexibleLoading || freshnessLoading || membersLoading

  if (isLoading || !snapshot || !flexibleMoney) {
    return { isReady: false as const }
  }

  const holderNameById = new Map(members.map((member) => [member.id, member.name]))

  return {
    isReady: true as const,
    goals,
    goalTracks: buildGoalTracks(goals),
    forecast,
    flexibleMoney,
    freshness,
    moneyLocation: buildMoneyLocationMap(assets, holderNameById),
    /** Quick update = confirm the stale sources are unchanged (§14.5). */
    confirmUnchanged,
  }
}
