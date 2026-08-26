import { useTranslation } from 'react-i18next'

import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import type { DebtSummary } from '@money-space/core/features/debts/model/debts-form'
import type { DebtItem } from '@money-space/core/features/debts/model/debts.types'
import { formatMonthYear, formatVndScale } from '@money-space/core/shared/lib/format-money'

type DebtsSummaryStripProps = {
  summary: DebtSummary
  debts: DebtItem[]
  payments: CashflowEvent[]
}

function daysFromNow(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${date}T00:00:00`)
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
}

export function DebtsSummaryStrip({ summary, debts, payments }: DebtsSummaryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const activeDebts = debts.filter((debt) => debt.status === 'active' || debt.status === 'overdue')
  const upcoming = payments.filter((payment) => {
    const days = daysFromNow(payment.expectedDate)
    return Boolean(payment.debtId) && days >= 0 && days <= 30
  })
  const upcomingAmount = upcoming.reduce((sum, payment) => sum + payment.amount, 0)
  const farthestDate = activeDebts
    .map((debt) => debt.expectedFinalDueDate)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1)

  return (
    <Panel>
      <PanelHeader
        title={t('debts.demo.overview')}
        meta={t('debts.demo.count', { count: activeDebts.length })}
      />
      <div className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-0">
        <Metric
          label={t('debts.demo.outstanding')}
          value={formatVndScale(summary.outstanding)}
          note={t('debts.demo.outstandingNote')}
          className="sm:pr-7"
        />
        <Metric
          label={t('debts.demo.next30Days')}
          value={formatVndScale(upcomingAmount)}
          note={
            upcoming.length > 0
              ? t('debts.demo.confirmedPayments', { count: upcoming.length })
              : t('debts.demo.noConfirmedPayment')
          }
          noteClassName={upcoming.length === 0 ? 'text-attention' : undefined}
          className="sm:border-l sm:border-divider sm:px-7"
        />
        <Metric
          label={t('debts.demo.farthestPayoff')}
          value={farthestDate ? formatMonthYear(farthestDate, locale) : t('debts.demo.unknown')}
          note={
            farthestDate
              ? t('debts.demo.farthestPayoffNote')
              : t('debts.demo.missingSchedule')
          }
          compact={!farthestDate}
          className="sm:border-l sm:border-divider sm:pl-7"
        />
      </div>
    </Panel>
  )
}

function Metric({
  label,
  value,
  note,
  className,
  noteClassName,
  compact = false,
}: {
  label: string
  value: string
  note: string
  className?: string
  noteClassName?: string
  compact?: boolean
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <p className={compact ? 'mt-2 t-subhead font-medium' : 'money-number mt-2 t-metric'}>
        {value}
      </p>
      <p className={`mt-2 t-caption leading-5 ${noteClassName ?? 'text-ink2'}`}>{note}</p>
    </div>
  )
}
