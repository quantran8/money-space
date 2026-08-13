import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Card } from '@/components/ui/card'
import { FilterChip } from '@/features/assets/ui/components/filter-chip'
import { useUpcomingPage } from '@/features/forecast/hooks/use-upcoming-page'
import { ALLOWED_HORIZONS, type HorizonDays } from '@/features/forecast/model/forecast.types'
import { ForecastTimeline } from '@/features/forecast/ui/components/forecast-timeline'
import { SummaryStrip } from '@/features/forecast/ui/components/summary-strip'
import { AssumptionsNote } from '@/features/forecast/ui/components/assumptions-note'
import { WhatIfTrigger } from '@/features/whatif/ui/components/whatif-trigger'
import { Button } from '@/components/ui/button'
import { CashflowEventFormDialog } from '@/features/cashflow/ui/components/cashflow-event-form-dialog'
import { useCashflowForm } from '@/features/cashflow/hooks/use-cashflow-form'
import { useCashflowEvents } from '@/features/cashflow/hooks/use-cashflow-events'

export function UpcomingPage() {
  const { t } = useTranslation()
  const { horizonDays, setHorizonDays, forecast, days, isLoading, isEmpty } =
    useUpcomingPage()
  const cashflowForm = useCashflowForm()
  const { completeCashflowEvent } = useCashflowEvents()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('upcoming.eyebrow')}
        title={t('upcoming.title')}
        description={t('upcoming.description')}
        actions={
          <>
            <WhatIfTrigger prefill={{ source: 'upcoming' }} />
            <Button onClick={() => cashflowForm.openCreate('outgoing')}>
              <Plus className="mr-2 size-4" />
              {t('upcoming.form.submit')}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {ALLOWED_HORIZONS.map((horizon) => (
          <FilterChip
            key={horizon}
            label={t('upcoming.horizon.days', { count: horizon })}
            active={horizon === horizonDays}
            onClick={() => setHorizonDays(horizon as HorizonDays)}
          />
        ))}
      </div>

      {forecast ? <SummaryStrip forecast={forecast} /> : null}

      <ForecastTimeline
        days={days}
        protectedReserveAmount={forecast?.protectedReserveAmount ?? 0}
        isLoading={isLoading}
        isEmpty={isEmpty}
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

      {forecast ? <AssumptionsNote assumptions={forecast.assumptions} /> : null}

      {forecast && forecast.excludedPrivateRecordCount > 0 ? (
        <Card>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('upcoming.privateExcluded', {
              count: forecast.excludedPrivateRecordCount,
            })}
          </p>
        </Card>
      ) : null}

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
