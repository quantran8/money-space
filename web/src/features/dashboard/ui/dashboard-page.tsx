import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCashflowEvents } from '@money-space/core/features/cashflow/hooks/use-cashflow-events'
import { CompleteCashflowDialog } from '@/features/cashflow/ui/components/complete-cashflow-dialog'
import { useDashboardPage } from '@money-space/core/features/dashboard/hooks/use-dashboard-page'
import { buildCoverage } from '@money-space/core/features/dashboard/model/home-derivations'
import { DashboardSkeleton } from '@/features/dashboard/ui/components/dashboard-skeleton'
import { FinancialPictureSection } from '@/features/dashboard/ui/components/financial-picture-section'
import { GoalsSection } from '@/features/dashboard/ui/components/goals-section'
import { MoneySourcesSection } from '@/features/dashboard/ui/components/money-sources-section'
import { SpendingSection } from '@/features/dashboard/ui/components/spending-section'
import { UpcomingSection } from '@/features/dashboard/ui/components/upcoming-section'

/**
 * Home (v5 04-recipes §2–§4).
 *
 * Page identity sits on the page ground; the canvas sheet below holds the
 * cards. Flexible Money is the dominant card — the canonical financial answer —
 * and the 30-day low point and main goal sit beside it only because each
 * answers a DIFFERENT question (03-patterns §5). Money location follows at full
 * width because it is a table, not an answer.
 *
 * Card inventory is deliberately short (04-recipes §16): no Total, no Committed,
 * no source count, no freshness card. Those are metadata of the answers above,
 * and splitting them out would repeat facts to manufacture hierarchy (§9).
 *
 * The order is fixed by priority (§1.1, §9.1):
 *   1. Bức tranh hôm nay — flexible money, where it came from, how it splits
 *   2. Ba mươi ngày tới  — the low point and the event sequence
 *   3. Mục tiêu          — every goal against the pace it needs
 *   4. Tiền đang ở đâu   — where the money sits, and how concentrated it is
 *
 * Deliberately absent, each for a stated reason:
 *  - **Net worth as hero** — does not help today's decision (§2.6, §5.3).
 *  - **A what-if section** — it is an action, and consequence must never render
 *    before the household asks for it (§2.9).
 *  - **A Tài sản | Nợ pair** — §12.4 now shows long-term holdings alongside
 *    cash, so the assets half was the same list twice; debt belongs to the
 *    Tài sản page, where the two are read against each other properly (§5.3).
 *  - **A journal at the bottom** — what changed is a page, not a tail on Home;
 *    it answered a question nobody arrives with (§2.10, §2.14).
 */
export function DashboardPage() {
  const { t } = useTranslation()
  // Copy stays here, in the UI: core groups the sources, i18n names them.
  const state = useDashboardPage({ sharedHolderLabel: t('home.location.sharedHolder') })
  // Before the early return — hooks cannot be called conditionally.
  const { cashflowEvents, completeCashflowEvent } = useCashflowEvents()
  /**
   * The occurrence awaiting a wallet choice. Confirming MOVES MONEY, so it
   * cannot fire straight from the row — without a wallet the API has nothing
   * to debit or credit and the balance would not change (§18).
   */
  const [completing, setCompleting] = useState<{
    eventId: string
    occurrenceDate: string
    name: string
    amount: number
    direction: 'incoming' | 'outgoing'
    settlementAssetId?: string | null
  } | null>(null)

  if (!state.isReady) {
    return <DashboardSkeleton />
  }

  const {
    forecast,
    flexibleMoney,
    freshness,
    eventsSummary,
    recentEvents,
    holderGroups,
    goalTracks,
    earmarkedForGoals,
    goals,
    moneyLocation,
    assets,
    confirmUnchanged,
  } = state

  /** Quick update confirms the stale CASH sources are unchanged (§14.5). */
  const handleQuickUpdate = () => {
    const staleIds = freshness ? buildCoverage(freshness).staleIds : []
    if (staleIds.length > 0) confirmUnchanged.mutate(staleIds)
  }

  return (
    <div className="space-y-3">
      {/* No hero card. It carried the household name and "Tình hình hiện tại"
          over a coverage line that §12.1 already states beside the figure it
          qualifies — a full-width blue band to say what the first card says
          better, and it pushed the one number the page exists for below the
          fold. The page now opens on the answer. */}
      <FinancialPictureSection
        flexibleMoney={flexibleMoney}
        freshness={freshness}
        onQuickUpdate={handleQuickUpdate}
      />

      {forecast ? (
        <UpcomingSection
          forecast={forecast}
          cashflowEvents={cashflowEvents}
          completingEventId={
            completeCashflowEvent.isPending ? completing?.eventId : null
          }
          onCompleteOverdue={(eventId, occurrenceDate) => {
            const source = cashflowEvents.find((event) => event.id === eventId)
            if (!source) return
            setCompleting({
              eventId,
              occurrenceDate,
              name: source.name,
              amount: source.amount,
              direction: source.direction,
              settlementAssetId: source.settlementAssetId,
            })
          }}
        />
      ) : null}

      {/* Spending and goals share one row: the month that happened beside the
          money already pointed somewhere. Both are narrower than a full-width
          section needs, and neither is the page's primary answer. */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] xl:items-stretch">
        <SpendingSection
          summary={eventsSummary}
          recentEvents={recentEvents}
          asOfDate={forecast?.asOfDate ?? ''}
        />

        {goalTracks.length > 0 ? (
          <GoalsSection
            tracks={goalTracks}
            goalCount={goals.length}
            earmarkedForGoals={earmarkedForGoals}
          />
        ) : null}
      </div>

      {/* Full width, and last: this is a table of where money sits, not an
          answer to today's question — the ranking only reads as a comparison
          when every bar has the same full width to run in (§12.4). */}
      <MoneySourcesSection map={moneyLocation} holderGroups={holderGroups} />

      {completing ? (
        <CompleteCashflowDialog
          open
          onOpenChange={(next) => {
            if (!next) setCompleting(null)
          }}
          eventName={completing.name}
          amount={completing.amount}
          direction={completing.direction}
          defaultAssetId={completing.settlementAssetId}
          assets={assets}
          isSubmitting={completeCashflowEvent.isPending}
          onConfirm={(assetId) => {
            completeCashflowEvent.mutate(
              {
                eventId: completing.eventId,
                // `occurrenceDate` is the idempotency key — a double-tap must
                // not advance a recurring series twice (§18).
                payload: { occurrenceDate: completing.occurrenceDate, assetId },
              },
              { onSuccess: () => setCompleting(null) },
            )
          }}
        />
      ) : null}
    </div>
  )
}
