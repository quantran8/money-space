import { useCallback, useState } from 'react'
import { Text } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useCashflowEvents } from '@money-space/core/features/cashflow/hooks/use-cashflow-events'
import { useDashboardPage } from '@money-space/core/features/dashboard/hooks/use-dashboard-page'
import { buildCoverage } from '@money-space/core/features/dashboard/model/home-derivations'
import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'
import { useNavigate } from '@money-space/core/shared/navigation'
import { queryKeys } from '@money-space/core/shared/api/query-keys'

import { Screen, Sections } from '@/components/ui'
import { DashboardSkeleton } from '@/features/dashboard/ui/dashboard-skeleton'
import { FinancialPictureSection } from '@/features/dashboard/ui/financial-picture-section'
import { GoalsSection } from '@/features/dashboard/ui/goals-section'
import { MoneySourcesSection } from '@/features/dashboard/ui/money-sources-section'
import { UpcomingSection } from '@/features/dashboard/ui/upcoming-section'
import { formatToday } from '@/features/dashboard/lib/home-dates'

/**
 * Tổng quan — Home.
 *
 * A single vertical column of full-width sections. Each has a different
 * internal shape (a huge number, a low point plus a sequence, a list of tracks,
 * ranked bars), and that difference is itself the scanning cue that lets the
 * household read the page in a few seconds.
 *
 * The order is fixed by priority and is identical to the web's (§3 of the Home
 * recipe):
 *   1. Bức tranh hôm nay — flexible money, the sources it is made of, the split
 *   2. 30 ngày tới       — the low point and the event sequence
 *   3. Mục tiêu chính    — every goal against the pace it needs
 *   4. Tiền đang ở đâu   — where the money sits, and how concentrated it is
 *
 * `Cần cập nhật` is the fifth item in that list and lives INSIDE section 1, not
 * at the bottom: it names the sources the hero is computed from, and a block
 * that qualifies a figure cannot sit four sections below it (§2.15). What-if is
 * an action inside section 1 for the same reason it is not a section on the
 * web — consequence must never render before the household asks for it (§2.9).
 *
 * Every figure comes from core's `useDashboardPage`, which fans out to the
 * slice that owns each one and returns them derived. This file is composition:
 * it picks sections, wires actions and formats nothing but a date.
 */
export default function DashboardScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const state = useDashboardPage()
  // Before the early return — hooks cannot be called conditionally.
  const { cashflowEvents } = useCashflowEvents()
  const [refreshing, setRefreshing] = useState(false)

  /**
   * Pull-to-refresh. The backend has no push channel, so a deliberate pull is
   * the household's way of saying "check again" — and after recording something
   * on the other person's phone it is the only way.
   */
  const handleRefresh = useCallback(async () => {
    if (!activeHouseholdId) return
    setRefreshing(true)
    try {
      await Promise.all(
        [
          queryKeys.dashboard(activeHouseholdId),
          queryKeys.forecastBundleAll(activeHouseholdId),
          queryKeys.freshness(activeHouseholdId),
          queryKeys.assets(activeHouseholdId),
          queryKeys.goals(activeHouseholdId),
          queryKeys.eventsSummary(activeHouseholdId),
          queryKeys.cashflowEvents(activeHouseholdId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
    } finally {
      setRefreshing(false)
    }
  }, [activeHouseholdId, queryClient])

  if (!state.isReady) {
    return (
      <Screen title={t('nav.dashboard')}>
        <DashboardSkeleton />
      </Screen>
    )
  }

  const {
    forecast,
    flexibleMoney,
    freshness,
    eventsSummary,
    goalTracks,
    earmarkedForGoals,
    goals,
    moneyLocation,
    confirmUnchanged,
  } = state

  /** Quick update confirms the stale sources are unchanged (§14.5). */
  const handleQuickUpdate = () => {
    const staleIds = freshness ? buildCoverage(freshness).staleIds : []
    if (staleIds.length > 0) confirmUnchanged.mutate(staleIds)
  }

  return (
    <Screen
      title={t('nav.dashboard')}
      right={
        <Text className="font-mono text-[11px] text-ink3">
          {formatToday(forecast?.asOfDate)}
        </Text>
      }
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <Sections>
        <FinancialPictureSection
          flexibleMoney={flexibleMoney}
          freshness={freshness}
          onQuickUpdate={handleQuickUpdate}
          isConfirming={confirmUnchanged.isPending}
          // SEAM — what-if. The sheet belongs to the what-if feature and
          // another agent owns it. Pass `onSimulate` here once it exports one;
          // until then the entry is not offered rather than opening a stub, so
          // nothing promises a consequence the app cannot yet show (§2.9).
        />

        {forecast ? (
          <UpcomingSection
            forecast={forecast}
            eventsSummary={eventsSummary}
            cashflowEvents={cashflowEvents}
            onViewTimeline={() => navigate('/upcoming')}
            onAddSource={() => navigate('/networth')}
            // SEAM — completing an overdue occurrence. Confirming MOVES MONEY,
            // so it cannot fire from the row: without a wallet the API has
            // nothing to debit or credit (§18). The web opens
            // `CompleteCashflowDialog` to pick one, and the mobile equivalent
            // is a cashflow sheet the forecast+cashflow agent owns. Until it
            // exports one, the overdue block states what is waiting and links
            // to Sắp tới, where the action lives — `onCompleteOverdue` is left
            // unpassed so no button appears that cannot finish the job.
          />
        ) : null}

        {goalTracks.length > 0 ? (
          <GoalsSection
            tracks={goalTracks}
            goalCount={goals.length}
            earmarkedForGoals={earmarkedForGoals}
            onViewAll={() => navigate('/goals')}
            onOpenGoal={(goalId) => navigate(`/goals/${goalId}`)}
          />
        ) : null}

        <MoneySourcesSection map={moneyLocation} onViewAll={() => navigate('/networth')} />
      </Sections>
    </Screen>
  )
}
