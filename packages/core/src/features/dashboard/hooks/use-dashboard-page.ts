import { useDashboardOverview } from '#/features/dashboard/hooks/use-dashboard-overview'
import {
  buildGoalTracks,
  buildHolderGroups,
  buildMoneyLocationMap,
} from '#/features/dashboard/model/home-derivations'
import { useEvents } from '#/features/events/hooks/use-events'
import { useEventsSummary } from '#/features/events/hooks/use-events-summary'
import { useFlexibleMoney, useForecast } from '#/features/forecast/hooks/use-forecast'
import { useFreshness } from '#/features/freshness/hooks/use-freshness'
import { useMembers } from '#/features/members/hooks/use-members'

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
export function useDashboardPage({
  /**
   * What to call sources nobody is named on. Copy belongs to the caller (§10.4)
   * — core never reaches into i18n — but the grouping itself is a calculation,
   * so it stays here rather than being rebuilt in each host app.
   */
  sharedHolderLabel = '',
}: { sharedHolderLabel?: string } = {}) {
  const { snapshot, goals, assets, isLoading: overviewLoading } = useDashboardOverview()

  const { forecast, isLoading: forecastLoading } = useForecast()
  const { flexibleMoney, isLoading: flexibleLoading } = useFlexibleMoney()
  const { freshness, isLoading: freshnessLoading, confirmUnchanged } = useFreshness()
  const { members, isLoading: membersLoading } = useMembers()
  // What has ALREADY moved this month — the "đã xảy ra" half of §12.2. Backend
  // aggregate, never re-derived here; no month argument means the current one.
  const { data: eventsSummary, isLoading: eventsSummaryLoading } = useEventsSummary()
  // The few most recent RECORDED movements, as evidence behind the thu/chi
  // totals above them. Same source the totals are aggregated from, so the rows
  // and the figures can never tell different stories (§2.7).
  const { events, isLoading: eventsLoading } = useEvents(undefined)

  const isLoading =
    overviewLoading ||
    forecastLoading ||
    flexibleLoading ||
    freshnessLoading ||
    membersLoading ||
    eventsSummaryLoading ||
    eventsLoading

  if (isLoading || !snapshot || !flexibleMoney) {
    return { isReady: false as const }
  }

  const holderNameById = new Map(members.map((member) => [member.id, member.name]))

  return {
    isReady: true as const,
    goals,
    goalTracks: buildGoalTracks(goals),
    /**
     * The set-aside split. Display only — `netWorth` is not reduced by it, and
     * flexible money keeps its own formula (see DashboardOverview).
     */
    earmarkedForGoals: snapshot.earmarkedForGoals,
    unassigned: snapshot.unassigned,
    forecast,
    flexibleMoney,
    freshness,
    /** Thu/chi/ròng already recorded this month. Undefined if the call failed. */
    eventsSummary,
    /**
     * The most recent recorded movements, newest first — evidence behind the
     * thu/chi totals, not a ledger. Home shows a handful; the full list is the
     * Events page.
     */
    recentEvents: [...events]
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
      .slice(0, 3),
    /** Needed to pick the wallet a confirmed cashflow event moves through. */
    assets,
    moneyLocation: buildMoneyLocationMap(assets, holderNameById),
    /** The same sources read by who is RESPONSIBLE for them (§0.2, §16.4). */
    holderGroups: buildHolderGroups(assets, holderNameById, sharedHolderLabel),
    /** Quick update = confirm the stale sources are unchanged (§14.5). */
    confirmUnchanged,
  }
}
