import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { CashflowEventFormDialog } from '@/features/cashflow/ui/components/cashflow-event-form-dialog'
import { useCashflowEvents } from '@money-space/core/features/cashflow/hooks/use-cashflow-events'
import { useCashflowForm } from '@money-space/core/features/cashflow/hooks/use-cashflow-form'
import { useUpcomingPage } from '@money-space/core/features/forecast/hooks/use-upcoming-page'
import { ForecastTimeline } from '@/features/forecast/ui/components/forecast-timeline'
import { OverdueSection } from '@/features/forecast/ui/components/overdue-section'
import { RangePicker } from '@/features/forecast/ui/components/range-picker'
import { SummaryStrip } from '@/features/forecast/ui/components/summary-strip'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'

export function UpcomingPage() {
  const { t } = useTranslation()
  const { range, setRange, bounds, forecast, summary, days, overdue, isLoading, isEmpty } =
    useUpcomingPage()
  const cashflowForm = useCashflowForm()
  const { cashflowEvents, completeCashflowEvent } = useCashflowEvents()
  const { members } = useMembers()

  const memberNameById = new Map(members.map((member) => [member.id, member.name]))
  const ownerNameByEventId = Object.fromEntries(
    cashflowEvents.map((event) => [
      event.id,
      event.ownerMemberId ? memberNameById.get(event.ownerMemberId) : undefined,
    ]),
  )
  const categoryVisualById = new Map(
    cashflowForm.categoryOptions.map((category) => [category.value, category]),
  )
  const categoryVisualByEventId = Object.fromEntries(
    cashflowEvents.map((event) => [event.id, categoryVisualById.get(event.categoryId)]),
  )

  return (
    <div className="space-y-3 pb-3">
      <CompactPageHeader
        title={t('upcoming.title')}
        scope={<RangePicker range={range} onChange={setRange} bounds={bounds} />}
        actions={
          <Button onClick={() => cashflowForm.openCreate('outgoing')}>
            <Plus className="size-4" />
            {t('upcoming.form.title')}
          </Button>
        }
      />

      {forecast && summary ? (
        <SummaryStrip forecast={forecast} summary={summary} />
      ) : null}

      {/* Above the timeline, and lifted out of it: these are the only rows on
          the page waiting on a person, and the backend clamps them onto today,
          so inside the timeline they read as "due today" among things that
          genuinely are. Renders nothing when nothing is overdue. */}
      {overdue ? (
        <OverdueSection
          overdue={overdue}
          showViewAll={false}
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
          onDelete={cashflowForm.handleDelete}
          ownerNameByEventId={ownerNameByEventId}
          categoryVisualByEventId={categoryVisualByEventId}
        />
      ) : null}

      <ForecastTimeline
        days={days}
        ownerNameByEventId={ownerNameByEventId}
        categoryVisualByEventId={categoryVisualByEventId}
        isLoading={isLoading}
        isEmpty={isEmpty}
        usableNowAssetCount={forecast?.usableNowAssetCount}
        onAdd={() => cashflowForm.openCreate('outgoing')}
        onComplete={(sourceEventId, occurrenceDate) =>
          // `occurrenceDate` is the idempotency key — passing it stops a
          // double-tap advancing a recurring series twice (§18).
          completeCashflowEvent.mutate({
            eventId: sourceEventId,
            payload: { occurrenceDate },
          })
        }
        onEdit={cashflowForm.openEdit}
        onDelete={cashflowForm.handleDelete}
      />

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
    </div>
  )
}
