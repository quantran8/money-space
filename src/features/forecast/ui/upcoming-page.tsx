import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { CashflowEventFormDialog } from '@/features/cashflow/ui/components/cashflow-event-form-dialog'
import { useCashflowEvents } from '@/features/cashflow/hooks/use-cashflow-events'
import { useCashflowForm } from '@/features/cashflow/hooks/use-cashflow-form'
import { useUpcomingPage } from '@/features/forecast/hooks/use-upcoming-page'
import { ALLOWED_HORIZONS, type HorizonDays } from '@/features/forecast/model/forecast.types'
import { ForecastTimeline } from '@/features/forecast/ui/components/forecast-timeline'
import { SummaryStrip } from '@/features/forecast/ui/components/summary-strip'
import { useMembers } from '@/features/members/hooks/use-members'
import { cn } from '@/shared/lib/utils'

export function UpcomingPage() {
  const { t } = useTranslation()
  const { horizonDays, setHorizonDays, forecast, days, isLoading, isEmpty } =
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

  return (
    <div className="space-y-4 pb-3">
      <CompactPageHeader
        title={t('upcoming.title')}
        actions={
          <Button
            className="h-10 px-4 text-[13px]"
            onClick={() => cashflowForm.openCreate('outgoing')}
          >
            <Plus className="size-4" />
            {t('upcoming.form.title')}
          </Button>
        }
      />

      <div
        className="flex items-center gap-1 rounded-sunk bg-sunk p-1 sm:w-fit"
        role="tablist"
        aria-label={t('upcoming.horizon.label')}
      >
        {ALLOWED_HORIZONS.slice(0, 3).map((horizon) => (
          <button
            key={horizon}
            type="button"
            role="tab"
            aria-selected={horizon === horizonDays}
            onClick={() => setHorizonDays(horizon as HorizonDays)}
            className={cn(
              'h-9 flex-1 rounded-control px-4 text-[13px] font-medium transition-colors sm:flex-none',
              horizon === horizonDays ? 'bg-panel text-ink' : 'text-ink2 hover:text-ink',
            )}
          >
            {t('upcoming.horizon.days', { count: horizon })}
          </button>
        ))}
      </div>

      {forecast ? <SummaryStrip forecast={forecast} /> : null}

      <ForecastTimeline
        days={days}
        ownerNameByEventId={ownerNameByEventId}
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
        isEditing={cashflowForm.isEditing}
        isSubmitting={cashflowForm.isSubmitting}
        onSubmit={cashflowForm.submit}
      />
    </div>
  )
}
