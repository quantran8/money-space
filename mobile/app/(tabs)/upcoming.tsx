import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCashflowEvents } from '@money-space/core/features/cashflow/hooks/use-cashflow-events'
import { useCashflowForm } from '@money-space/core/features/cashflow/hooks/use-cashflow-form'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import { useUpcomingPage } from '@money-space/core/features/forecast/hooks/use-upcoming-page'
import type { ForecastOccurrence } from '@money-space/core/features/forecast/model/forecast.types'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { useNavigate } from '@money-space/core/shared/navigation'
import { notify } from '@money-space/core/shared/notify'

import { Button, ConfirmDialog, ErrorState, Screen, Sections } from '@/components/ui'
import {
  CashflowEventFormSheet,
  CompleteCashflowSheet,
  PostponeCashflowSheet,
} from '@/features/cashflow'
import {
  AssumptionsNote,
  ForecastSummary,
  ForecastTimeline,
  OverdueSection,
  RangePicker,
} from '@/features/forecast'

/**
 * Sắp tới — the forecast timeline, and every action on it.
 *
 * The screen IS the forecast: `useUpcomingPage` (core) owns the range, the
 * request and the day filtering, and it reads through `useForecastBundle`, so
 * forecast + flexible money + financial state arrive in ONE request rather than
 * three that each re-run the same engine server-side.
 *
 * Every action on a row is a cashflow write, and each is its own POST because
 * each runs a transaction server-side (memory/cashflow-events.md) — completing
 * is not "PATCH status". The sheets come from `@/features/cashflow` and are
 * shared with Home; the mutations stay here, where a failure has a screen to
 * report on.
 *
 * Order follows §7: summary answer → ordered events → how it was worked out.
 */
export default function UpcomingScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const {
    range,
    setRange,
    bounds,
    forecast,
    summary,
    days,
    overdue,
    isLoading,
    isError,
    error,
    isEmpty,
  } = useUpcomingPage()

  const cashflowForm = useCashflowForm()
  const {
    cashflowEvents,
    completeCashflowEvent,
    postponeCashflowEvent,
    cancelCashflowEvent,
    refetch,
  } = useCashflowEvents()
  const { members } = useMembers()

  /** Which occurrence each sheet is acting on. `null` = closed. */
  const [completing, setCompleting] = useState<ForecastOccurrence | null>(null)
  const [postponing, setPostponing] = useState<ForecastOccurrence | null>(null)
  const [cancelling, setCancelling] = useState<ForecastOccurrence | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const eventById = new Map(cashflowEvents.map((event) => [event.id, event]))
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  /**
   * An owner is shown only where it carries meaning (§5 conditional fields).
   * An event nobody was assigned belongs to the household, and a row saying
   * "Cả nhà" on every line is a column of noise — so it collapses instead.
   */
  const ownerNameByEventId = Object.fromEntries(
    cashflowEvents.map((event) => [
      event.id,
      event.ownerMemberId ? memberNameById.get(event.ownerMemberId) : undefined,
    ]),
  )

  function eventFor(occurrence: ForecastOccurrence): CashflowEvent | undefined {
    return eventById.get(occurrence.sourceEventId)
  }

  async function handleComplete(assetId: string) {
    if (!completing) return
    try {
      await completeCashflowEvent.mutateAsync({
        eventId: completing.sourceEventId,
        // `occurrenceDate` is the idempotency key — without it a double-tap
        // advances a recurring series twice and drops a month from the
        // forecast (§18).
        payload: { occurrenceDate: completing.date, assetId },
      })
      setCompleting(null)
    } catch (caught) {
      notify.error(getErrorMessage(caught, t('upcoming.complete.failed')))
    }
  }

  async function handlePostpone(newExpectedDate: string, note?: string) {
    if (!postponing) return
    try {
      await postponeCashflowEvent.mutateAsync({
        eventId: postponing.sourceEventId,
        newExpectedDate,
        note,
      })
      setPostponing(null)
    } catch (caught) {
      notify.error(getErrorMessage(caught, t('upcoming.postpone.failed')))
    }
  }

  async function handleCancel() {
    if (!cancelling) return
    try {
      await cancelCashflowEvent.mutateAsync({ eventId: cancelling.sourceEventId })
      setCancelling(null)
    } catch (caught) {
      notify.error(getErrorMessage(caught, t('upcoming.cancel.failed')))
    }
  }

  const completingEvent = completing ? eventFor(completing) : undefined
  const postponingEvent = postponing ? eventFor(postponing) : undefined
  const deletingEvent = deletingId ? eventById.get(deletingId) : undefined

  return (
    <Screen
      title={t('upcoming.title')}
      right={
        <Button className="px-4" onPress={() => cashflowForm.openCreate('outgoing')}>
          {t('common.add')}
        </Button>
      }
      onRefresh={() => void refetch()}
    >
      <Sections>
        <RangePicker range={range} onChange={setRange} bounds={bounds} />

        {/* The error is scoped to the section that failed (§6.5) — a network
            blip must not replace the whole screen, and the range picker
            above stays usable. */}
        {isError ? (
          <ErrorState
            message={getErrorMessage(error, t('upcoming.loadFailed'))}
            retryLabel={t('common.update')}
            onRetry={() => void refetch()}
          />
        ) : null}

        {forecast && summary ? (
          <ForecastSummary
            forecast={forecast}
            summary={summary}
            onAddSource={() => navigate('/networth')}
          />
        ) : null}

        {/* Above the timeline, and lifted out of it: these are the only rows on
            the screen waiting on a person, and the backend clamps them onto
            today, so inside the timeline they read as "due today" among things
            that genuinely are. Renders nothing when nothing is overdue. */}
        {overdue ? (
          <OverdueSection
            overdue={overdue}
            pendingId={
              completeCashflowEvent.isPending
                ? completeCashflowEvent.variables?.eventId
                : null
            }
            onComplete={(sourceEventId, occurrenceDate) =>
              completeCashflowEvent.mutate({
                eventId: sourceEventId,
                payload: { occurrenceDate },
              })
            }
            onEdit={cashflowForm.openEdit}
            onDelete={setDeletingId}
          />
        ) : null}

        <ForecastTimeline
          days={days}
          ownerNameByEventId={ownerNameByEventId}
          isLoading={isLoading}
          isEmpty={isEmpty}
          usableNowAssetCount={forecast?.usableNowAssetCount}
          onAdd={() => cashflowForm.openCreate('outgoing')}
          onComplete={setCompleting}
          onPostpone={setPostponing}
          onCancel={setCancelling}
          onEdit={cashflowForm.openEdit}
          onDelete={setDeletingId}
        />

        {/* Every derived number must be explainable. Last, and folded away —
            it qualifies the figures above rather than competing with them. */}
        {forecast ? <AssumptionsNote assumptions={forecast.assumptions} /> : null}
      </Sections>

      <CashflowEventFormSheet
        open={cashflowForm.formOpen}
        onOpenChange={cashflowForm.handleFormOpenChange}
        form={cashflowForm.form}
        isEditing={cashflowForm.isEditing}
        editingId={cashflowForm.editingId}
        isSubmitting={cashflowForm.isSubmitting}
        onSubmit={cashflowForm.submit}
      />

      {/* Keyed on the occurrence so a new one is a NEW mount: the wallet
          selection is seeded once from the event and must not carry over from
          whichever row was confirmed last. */}
      {completing ? (
        <CompleteCashflowSheet
          key={completing.occurrenceKey}
          open
          onOpenChange={(open) => !open && setCompleting(null)}
          eventName={completing.name}
          amount={completing.amount}
          direction={completing.direction}
          occurrenceDate={completing.date}
          defaultAssetId={completingEvent?.settlementAssetId}
          isSubmitting={completeCashflowEvent.isPending}
          onConfirm={(assetId) => void handleComplete(assetId)}
        />
      ) : null}

      {postponing ? (
        <PostponeCashflowSheet
          key={postponing.occurrenceKey}
          open
          onOpenChange={(open) => !open && setPostponing(null)}
          eventName={postponing.name}
          // The record's own date, not the clamped occurrence date: postponing
          // moves the EVENT, and an overdue item pulled onto today would
          // otherwise have its real due date silently rewritten to today.
          expectedDate={postponingEvent?.expectedDate ?? postponing.date}
          isSubmitting={postponeCashflowEvent.isPending}
          onConfirm={(date, note) => void handlePostpone(date, note)}
        />
      ) : null}

      {/* §22.11 — the honest verb, and the consequence in money. Cancelling
          closes the event and keeps the record; deleting removes it, which is
          why they are two different dialogs and not one. */}
      <ConfirmDialog
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title={t('upcoming.cancel.title')}
        consequence={t('upcoming.cancel.consequence', { name: cancelling?.name ?? '' })}
        confirmLabel={t('upcoming.cancel.confirm')}
        cancelLabel={t('common.cancel')}
        loading={cancelCashflowEvent.isPending}
        onConfirm={() => void handleCancel()}
      />

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title={t('common.confirmDelete.title')}
        consequence={t('common.confirmDelete.description', { name: deletingEvent?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={cashflowForm.isDeleting}
        onConfirm={() => {
          if (!deletingId) return
          // `handleDelete` toasts its own failure and swallows it, so the
          // dialog closes either way — the row simply stays if it failed.
          void cashflowForm.handleDelete(deletingId).finally(() => setDeletingId(null))
        }}
      />
    </Screen>
  )
}
