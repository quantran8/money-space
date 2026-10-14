import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, Plus, RotateCcw } from 'lucide-react'

import { useCashflowEvents } from '@money-space/core/features/cashflow/hooks/use-cashflow-events'
import { useCashflowForm } from '@money-space/core/features/cashflow/hooks/use-cashflow-form'
import { useCategoryVisuals } from '@money-space/core/features/events/hooks/use-category-visuals'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DashboardWidgetGrid } from '@/features/dashboard/ui/components/dashboard-widget-grid'
import {
  DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardWidgetId,
  type DashboardWidgetItem,
} from '@money-space/core/features/dashboard/model/dashboard-layout'
import { useDashboardLayout } from '@money-space/core/features/dashboard/hooks/use-dashboard-layout'
import { AppearGroup, AppearItem } from '@/components/ui/motion'
import { CashflowEventFormDialog } from '@/features/cashflow/ui/components/cashflow-event-form-dialog'
import { CompleteCashflowDialog } from '@/features/cashflow/ui/components/complete-cashflow-dialog'
import { useDashboardPage } from '@money-space/core/features/dashboard/hooks/use-dashboard-page'
import {
  buildCoverage,
  buildOverdue,
} from '@money-space/core/features/dashboard/model/home-derivations'
import { BankReviewSection } from '@/features/dashboard/ui/components/bank-review-section'
import { DashboardSkeleton } from '@/features/dashboard/ui/components/dashboard-skeleton'
import { FinancialPictureSection } from '@/features/dashboard/ui/components/financial-picture-section'
import { GoalsSection } from '@/features/dashboard/ui/components/goals-section'
import { MoneySourcesSection } from '@/features/dashboard/ui/components/money-sources-section'
import { OverdueSection } from '@/features/forecast/ui/components/overdue-section'
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
 *   1b. Khoản quá hạn    — only when something is waiting on the household
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
  // Home shows the overdue card, so it needs the same ⋯ menu the timeline has:
  // an overdue row is more often wrong (sai ngày, sai số) than simply unpaid,
  // and sending the reader to /upcoming to fix it is a detour.
  const cashflowForm = useCashflowForm()
  const categoryVisualById = useCategoryVisuals()
  const layoutState = useDashboardLayout()
  // A draft exists only while arranging; nothing persists until Done picks a scope.
  const [draft, setDraft] = useState<DashboardWidgetItem[] | null>(null)
  const editing = draft !== null
  const layout = draft ?? layoutState.layout
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

  const renderWidget = (id: DashboardWidgetId): ReactNode => {
    switch (id) {
      case 'picture':
        return (
          <FinancialPictureSection
            flexibleMoney={flexibleMoney}
            freshness={freshness}
            onQuickUpdate={handleQuickUpdate}
          />
        )
      case 'overdue':
        // The one section allowed to disappear: it is a call to act.
        return forecast ? (
          <OverdueSection
            overdue={buildOverdue(forecast, cashflowEvents)}
            pendingId={completeCashflowEvent.isPending ? completing?.eventId : null}
            onComplete={(eventId, occurrenceDate) => {
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
            onEdit={cashflowForm.openEdit}
            onDelete={cashflowForm.handleDelete}
          />
        ) : null
      case 'bankReview':
        return <BankReviewSection cashflowEvents={cashflowEvents} />
      case 'upcoming':
        return <UpcomingSection forecast={forecast} categoryVisualById={categoryVisualById} />
      case 'spending':
        return (
          <SpendingSection
            summary={eventsSummary}
            recentEvents={recentEvents}
            categoryVisualById={categoryVisualById}
            asOfDate={forecast?.asOfDate ?? ''}
          />
        )
      case 'goals':
        return (
          <GoalsSection
            tracks={goalTracks}
            goalCount={goals.length}
            earmarkedForGoals={earmarkedForGoals}
          />
        )
      case 'moneySources':
        return <MoneySourcesSection map={moneyLocation} holderGroups={holderGroups} />
    }
  }

  const hiddenIds = DASHBOARD_WIDGET_IDS.filter((id) => !layout.some((w) => w.id === id))

  return (
    <AppearGroup className="space-y-3">
      <AppearItem className="flex flex-wrap items-center justify-end gap-2">
        {editing ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" disabled={hiddenIds.length === 0}>
                  <Plus />
                  {t('home.layout.add')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hiddenIds.map((id) => (
                  <DropdownMenuItem key={id} onSelect={() => setDraft([...layout, { id, size: 'full' }])}>
                    {t(`home.layout.widget.${id}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {layoutState.hasLocal ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  layoutState.clearLocal()
                  setDraft(null)
                }}
              >
                {t('home.layout.useShared')}
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => setDraft(DEFAULT_DASHBOARD_LAYOUT)}>
              <RotateCcw />
              {t('home.layout.reset')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
              {t('home.layout.cancel')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">{t('home.layout.done')}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    layoutState.saveLocal(draft)
                    setDraft(null)
                  }}
                >
                  {t('home.layout.applyMe')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    layoutState.saveShared(draft)
                    setDraft(null)
                  }}
                >
                  {t('home.layout.applyAll')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setDraft(layout)}>
            <LayoutGrid />
            {t('home.layout.edit')}
          </Button>
        )}
      </AppearItem>

      <AppearItem>
        <DashboardWidgetGrid
          layout={layout}
          editing={editing}
          render={renderWidget}
          onReorder={(next) => setDraft(next)}
          onResize={(id, size) => setDraft(layout.map((w) => (w.id === id ? { ...w, size } : w)))}
          onRemove={(id) => setDraft(layout.filter((w) => w.id !== id))}
        />
      </AppearItem>

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

      <CashflowEventFormDialog
        open={cashflowForm.formOpen}
        onOpenChange={cashflowForm.handleFormOpenChange}
        form={cashflowForm.form}
        categoryOptions={cashflowForm.categoryOptions}
        isEditing={cashflowForm.isEditing}
        editingId={cashflowForm.editingId}
        isSubmitting={cashflowForm.isSubmitting}
        onSubmit={cashflowForm.submit}
      />
    </AppearGroup>
  )
}
