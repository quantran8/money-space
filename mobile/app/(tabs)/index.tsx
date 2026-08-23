import { useCallback, useState } from 'react'
import { Text } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useCashflowEvents } from '@money-space/core/features/cashflow/hooks/use-cashflow-events'
import { useDashboardPage } from '@money-space/core/features/dashboard/hooks/use-dashboard-page'
import { buildCoverage } from '@money-space/core/features/dashboard/model/home-derivations'
import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'
import { useNavigate } from '@money-space/core/shared/navigation'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { notify } from '@money-space/core/shared/notify'
import { queryKeys } from '@money-space/core/shared/api/query-keys'
import { useWhatIfStore } from '@money-space/core/shared/stores/whatif-store'

import { Screen, Sections } from '@/components/ui'
import { CompleteCashflowSheet } from '@/features/cashflow'
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
  // The sheet is mounted once in `(tabs)/_layout`; Home only opens it.
  const openWhatIf = useWhatIfStore((store) => store.openWhatIf)

  const state = useDashboardPage()
  // Before the early return — hooks cannot be called conditionally.
  const { cashflowEvents, completeCashflowEvent } = useCashflowEvents()
  const [refreshing, setRefreshing] = useState(false)
  /** The overdue occurrence being confirmed, if any. */
  const [completing, setCompleting] = useState<{
    sourceEventId: string
    occurrenceDate: string
  } | null>(null)

  const completingEvent = completing
    ? cashflowEvents.find((event) => event.id === completing.sourceEventId)
    : undefined

  async function handleComplete(assetId: string) {
    if (!completing) return
    try {
      await completeCashflowEvent.mutateAsync({
        eventId: completing.sourceEventId,
        // `occurrenceDate` is the idempotency key — without it a double-tap
        // advances a recurring series twice and drops a month from the
        // forecast.
        payload: { occurrenceDate: completing.occurrenceDate, assetId },
      })
      setCompleting(null)
    } catch (caught) {
      notify.error(getErrorMessage(caught, t('upcoming.complete.failed')))
    }
  }

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
          // What-if is an ACTION inside this section, never a sixth one: a
          // consequence must not render before the household asks for it
          // (§2.9). No capability check — running one is a READ.
          onSimulate={() => openWhatIf({ source: 'home' })}
        />

        {forecast ? (
          <UpcomingSection
            forecast={forecast}
            eventsSummary={eventsSummary}
            cashflowEvents={cashflowEvents}
            onViewTimeline={() => navigate('/upcoming')}
            onAddSource={() => navigate('/networth')}
            // Confirming MOVES MONEY, so the row cannot fire it directly:
            // without a wallet the API has nothing to debit or credit. The tap
            // opens the wallet picker, and only that sheet completes.
            onCompleteOverdue={(sourceEventId, occurrenceDate) =>
              setCompleting({ sourceEventId, occurrenceDate })
            }
            completingEventId={completeCashflowEvent.isPending ? completing?.sourceEventId : null}
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

      {/* Keyed on the occurrence so a new one is a NEW mount: the wallet
          selection is seeded once from the event and must not carry over from
          whichever row was confirmed last. */}
      {completing ? (
        <CompleteCashflowSheet
          key={`${completing.sourceEventId}:${completing.occurrenceDate}`}
          open
          onOpenChange={(open) => !open && setCompleting(null)}
          eventName={completingEvent?.name ?? ''}
          amount={completingEvent?.amount ?? 0}
          direction={completingEvent?.direction ?? 'outgoing'}
          occurrenceDate={completing.occurrenceDate}
          defaultAssetId={completingEvent?.settlementAssetId}
          isSubmitting={completeCashflowEvent.isPending}
          onConfirm={(assetId) => void handleComplete(assetId)}
        />
      ) : null}
    </Screen>
  )
}
