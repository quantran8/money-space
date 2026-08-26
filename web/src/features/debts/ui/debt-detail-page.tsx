import { CalendarClock, ChevronLeft, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Progress } from '@/components/ui/progress'
import { useDebtDetail, type DebtHistoryEntry } from '@money-space/core/features/debts/hooks/use-debt-detail'
import { useDebtsPage } from '@money-space/core/features/debts/hooks/use-debts-page'
import { formatDate } from '@money-space/core/features/debts/model/debts-form'
import { calcFromBackendEnum } from '@money-space/core/features/debts/model/debts-interest'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtUpdateModeDialog } from '@/features/debts/ui/components/debt-update-mode-dialog'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/** Where one instalment sits in the run: settled, the one due next, or later. */
type PeriodState = 'paid' | 'next' | 'upcoming'

type RepaymentPeriod = {
  id: string
  /** 1-based position in the whole schedule, paid and unpaid together. */
  index: number
  isoDate: string
  amount: number
  state: PeriodState
}

/**
 * The dot beside each state.
 *
 * Green for settled is the one thing v5 §4 still lets green mean — a good
 * consequence, not "this is clickable". Blue marks the instalment the household
 * is actually looking for; amber marks the rest as scheduled money that has yet
 * to leave.
 */
const PERIOD_DOT: Record<PeriodState, string> = {
  paid: 'bg-positive',
  next: 'bg-data-primary',
  upcoming: 'bg-attention',
}

/** Only the two states worth marking take a fill; "later" is the default. */
const PERIOD_FILL: Record<PeriodState, string> = {
  paid: 'bg-positive-tint',
  next: 'bg-wash',
  upcoming: '',
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-data-primary',
  paid_off: 'bg-positive',
  overdue: 'bg-alert',
  paused: 'bg-attention',
  cancelled: 'bg-committed',
}

function displayDate(value: string | undefined, locale: string, fallback: string) {
  if (!value) return fallback
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(locale)
}

function displayMonth(value: string | undefined, locale: string, fallback: string) {
  if (!value) return fallback
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(locale, {
    month: '2-digit',
    year: 'numeric',
  })
}

function displayUpdatedAt(value: string, locale: string) {
  const hasTime = value.includes('T')
  const date = new Date(hasTime ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return formatDate(value)

  const day = date.toLocaleDateString(locale)
  if (!hasTime) return day
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

/**
 * The whole run of instalments, settled and scheduled, in date order.
 *
 * They are numbered ACROSS both halves — "kỳ 3" is the third payment of the
 * loan, not the first of the upcoming ones — which is the only numbering that
 * still means something once the groups are shown apart.
 */
function buildSchedule(
  repayments: DebtHistoryEntry[],
  upcomingPayments: CashflowEvent[],
): RepaymentPeriod[] {
  const paid = repayments.map((entry) => ({
    id: `paid-${entry.id}`,
    isoDate: entry.isoDate.slice(0, 10),
    amount: entry.amount,
    paid: true,
  }))
  const upcoming = upcomingPayments.map((payment) => ({
    id: `upcoming-${payment.id}`,
    isoDate: payment.expectedDate.slice(0, 10),
    amount: payment.amount,
    paid: false,
  }))

  let seenUnpaid = false
  return [...paid, ...upcoming]
    .sort((left, right) => left.isoDate.localeCompare(right.isoDate))
    .map((item, index) => {
      const isNext = !item.paid && !seenUnpaid
      if (!item.paid) seenUnpaid = true
      return {
        id: item.id,
        index: index + 1,
        isoDate: item.isoDate,
        amount: item.amount,
        state: item.paid ? 'paid' : isNext ? 'next' : 'upcoming',
      } satisfies RepaymentPeriod
    })
}

/** One figure in the "Điều khoản vay" row: label, value, and what it rests on. */
function Term({
  label,
  value,
  note,
  className,
}: {
  label: string
  value: string
  note?: string | null
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="t-body-sm text-ink2">{label}</p>
      <p className="money-number mt-1 t-metric">{value}</p>
      {note ? <p className="mt-1 t-caption text-ink3">{note}</p> : null}
    </div>
  )
}

/** One reference fact under the terms row. */
function Detail({ label, value, num = false }: { label: string; value: ReactNode; num?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="t-caption text-ink3">{label}</dt>
      <dd className={cn('mt-1 t-body-sm', num && 'num')}>{value}</dd>
    </div>
  )
}

export function DebtDetailPage() {
  const { debtId } = useParams<{ debtId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const {
    debt,
    ownerName,
    receivedToAssetName,
    history,
    repayments,
    totalRepaid,
    upcomingPayments,
    isLoading,
  } = useDebtDetail(debtId)
  const {
    receiveAssetOptions,
    memberOptions,
    control,
    register,
    errors,
    isValid,
    setValue,
    trigger,
    submit,
    selectedLenderType,
    isSavingDebt,
    repaymentEstimate,
    termMonths,
    dialogOpen,
    editingId,
    showMoreDetails,
    setShowMoreDetails,
    onOpenChange,
    openEdit,
    pasteAmountFromClipboard,
    updateModeOpen,
    updateModeOriginalChanged,
    updateModeBefore,
    updateModeAfter,
    updateModeTotalRepaid,
    isSavingUpdateMode,
    confirmUpdateMode,
    cancelUpdateMode,
  } = useDebtsPage()

  if (isLoading && !debt) {
    return <div className="h-[520px] animate-pulse rounded-card bg-card" />
  }

  if (!debt) {
    return (
      <div className="s-section-gap flex flex-col">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/networth')}>
          <ChevronLeft className="size-4" /> {t('debts.detail.back')}
        </Button>
        <Panel className="py-8 text-center">
          <p className="t-subhead font-medium">{t('debts.detail.notFoundTitle')}</p>
          <p className="mt-1 t-body-sm text-ink2">{t('debts.detail.notFoundBody')}</p>
        </Panel>
      </div>
    )
  }

  const repaid = Math.max(totalRepaid, debt.originalAmountValue - debt.outstandingAmountValue)
  const progress =
    debt.originalAmountValue > 0
      ? Math.min(100, (repaid / debt.originalAmountValue) * 100)
      : 0
  const nextPayment = upcomingPayments[0]
  const nextDate = nextPayment?.expectedDate
  const latestUpdate = history[0]?.isoDate ?? debt.borrowedAt
  const stages = debt.interestPeriods ?? []
  const calc = calcFromBackendEnum(debt.interestCalculation)
  const schedule = buildSchedule(repayments, upcomingPayments)
  const paidPeriods = schedule.filter((period) => period.state === 'paid')
  const openPeriods = schedule.filter((period) => period.state !== 'paid')
  const progressLabel = progress.toLocaleString(locale, { maximumFractionDigits: 1 })
  const frequencyLabel = t(`debts.form.frequency.${debt.paymentFrequency ?? 'none'}`)
  // The calculation half only means something once the debt actually has
  // interest stages — "số tiền cố định" under a 0% loan says nothing.
  const methodNote = stages.length
    ? t(calc === 'fixed' ? 'debts.detail.loan.methodFixed' : 'debts.detail.loan.methodReducing')
    : null
  const paymentDay = nextDate
    ? new Date(`${nextDate}T00:00:00`).getDate()
    : debt.firstPaymentDate
      ? new Date(`${debt.firstPaymentDate}T00:00:00`).getDate()
      : null

  return (
    <div className="flex flex-col pb-3">
      <header>
        <button
          type="button"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-control px-2 t-body-sm text-ink2 transition-colors hover:text-ink"
          onClick={() => navigate('/networth')}
        >
          <ChevronLeft className="size-[17px]" strokeWidth={1.75} />
          {t('debts.detail.back')}
        </button>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {/* A dot and a word, not a chip. The status is context for the
                title under it; a filled pill gave it the weight of a control. */}
            <p className="flex items-center gap-2 t-body-sm text-ink2">
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  STATUS_DOT[debt.status] ?? 'bg-committed',
                )}
              />
              {t(`options.debtStatus.${debt.status}`)}
            </p>
            <h1 className="t-page-tracking mt-2 truncate t-metric leading-tight">{debt.name}</h1>
          </div>

          <Button onClick={() => openEdit(debt.id)}>
            <Pencil className="size-[17px]" strokeWidth={1.75} />
            {t('common.edit')}
          </Button>
        </div>
      </header>

      <div className="s-card-gap mt-5 flex flex-col">
        {/* What is still owed, and how far through the run that puts them. Two
            readings of one thing, so they share a row: the figure states the
            amount, the bar states the share. */}
        <Panel>
          <PanelHeader
            title={t('debts.detail.overview.balanceTitle')}
            meta={displayUpdatedAt(latestUpdate, locale)}
          />

          <div className="s-head-body grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="t-body-sm text-ink2">{t('debts.detail.overview.outstanding')}</p>
              <p className="money-number mt-1 t-figure lg:t-hero">
                {formatVndShort(debt.outstandingAmountValue)}
              </p>
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-4">
                <p className="t-body-sm text-ink2">{t('debts.detail.overview.progress')}</p>
                <p className="num t-body-sm text-ink2">{progressLabel}%</p>
              </div>
              {/* The shared tick bar, at the compact height: the same scale the
                  goals use, so a share reads the same everywhere. */}
              <Progress
                value={progress}
                className="mt-2.5 h-2"
                aria-label={t('debts.detail.overview.progressAria', { percent: progressLabel })}
              />
              {/* Instalments, not money: the percentage above already says the
                  money, and "2 / 5 kỳ" is the half a household counts. */}
              <p className="num mt-2.5 t-caption text-ink3">
                {schedule.length > 0
                  ? t('debts.detail.overview.periodsDone', {
                      done: paidPeriods.length,
                      total: schedule.length,
                    })
                  : `${t('debts.detail.overview.repaid')} ${formatVndShort(repaid)}`}
              </p>
            </div>
          </div>
        </Panel>

        {/* The run of instalments. Settled and scheduled are shown APART rather
            than as one strip of tiles: they answer different questions — what
            has gone out, and what is still coming — and a single strip made the
            reader find the boundary for themselves. */}
        <Panel>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="t-title">{t('debts.detail.schedule.title')}</h2>
            <button
              type="button"
              className="min-h-11 t-caption text-ink2 transition-colors hover:text-ink"
              onClick={() => navigate('/events')}
            >
              {t('debts.detail.schedule.viewJournal')}
            </button>
          </div>

          {schedule.length > 0 ? (
            <>
              <div className="s-head-body grid grid-cols-2">
                <div className="min-w-0 pr-5 sm:pr-8">
                  <p className="t-body-sm text-ink2">{t('debts.detail.schedule.paid')}</p>
                  <p className="money-number mt-1 t-metric lg:t-figure">
                    {t('debts.detail.loan.installments', { count: paidPeriods.length })}
                  </p>
                </div>
                <div className="min-w-0 border-l border-divider pl-5 sm:pl-8">
                  <p className="t-body-sm text-ink2">{t('debts.detail.loan.remaining')}</p>
                  <p className="money-number mt-1 t-metric lg:t-figure">
                    {t('debts.detail.loan.installments', { count: openPeriods.length })}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-8">
                {paidPeriods.length > 0 ? (
                  <PeriodGroup
                    title={t('debts.detail.schedule.paid')}
                    periods={paidPeriods}
                    locale={locale}
                  />
                ) : null}
                {openPeriods.length > 0 ? (
                  <PeriodGroup
                    title={t('debts.detail.schedule.upcoming')}
                    periods={openPeriods}
                    locale={locale}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <EmptyState icon={CalendarClock} className="mt-7">
              {t('debts.detail.schedule.empty')}
            </EmptyState>
          )}
        </Panel>

        {/* The terms: three figures that decide what the schedule above looks
            like, then the reference facts underneath. */}
        <Panel>
          <PanelHeader title={t('debts.detail.loan.termsTitle')} />

          <div className="s-head-body grid gap-7 sm:grid-cols-3 sm:gap-0">
            <Term
              label={t('debts.detail.loan.payoff')}
              value={displayMonth(debt.expectedFinalDueDate, locale, t('debts.detail.noMonth'))}
              note={t('debts.detail.loan.payoffNote')}
              className="sm:pr-6"
            />
            <Term
              label={t('debts.detail.loan.interest')}
              value={debt.interestSummary || t('debts.detail.loan.noInterest')}
              note={t('debts.detail.loan.interestNote')}
              className="sm:border-l sm:border-divider sm:px-6"
            />
            <Term
              label={t('debts.detail.loan.method')}
              value={frequencyLabel}
              note={methodNote}
              className="sm:border-l sm:border-divider sm:pl-6"
            />
          </div>

          <p className="mt-7 t-caption font-medium text-ink3">
            {t('debts.detail.loan.detailsTitle')}
          </p>
          {/* Interest and repayment method are NOT repeated here — they are two
              of the three figures above, and §9 keeps one fact in one place. */}
          <dl className="mt-4 grid gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label={t('debts.detail.loan.lender')}
              value={debt.lenderName || t('debts.detail.loan.notUpdated')}
            />
            {/* Kept off the list row, which shows the name alone. The fact is
                worth having — a loan from a relative is not the same kind of
                obligation as one from a bank — it just does not need a column
                in a table that is one click from here. */}
            <Detail
              label={t('debts.detail.loan.lenderType')}
              value={t(`debts.form.lenderType.${debt.lenderType}`)}
            />
            <Detail
              label={t('debts.detail.loan.originalAmount')}
              value={formatVndShort(debt.originalAmountValue)}
              num
            />
            {paymentDay ? (
              <Detail
                label={t('debts.detail.loan.paymentDay')}
                value={t('debts.detail.loan.paymentDayValue', { day: paymentDay })}
                num
              />
            ) : null}
            <Detail
              label={t('debts.detail.loan.owner')}
              value={ownerName || t('debts.detail.loan.unassigned')}
            />
            <Detail
              label={t('debts.detail.loan.receivedInto')}
              value={receivedToAssetName || t('debts.detail.loan.notUpdated')}
            />
            <Detail
              label={t('debts.detail.loan.disbursedAt')}
              value={displayDate(debt.borrowedAt, locale, t('debts.detail.noValue'))}
              num
            />
          </dl>
        </Panel>
      </div>

      <DebtFormDialog
        open={dialogOpen}
        onOpenChange={onOpenChange}
        editingId={editingId}
        control={control}
        register={register}
        errors={errors}
        isValid={isValid}
        isSavingDebt={isSavingDebt}
        setValue={setValue}
        trigger={trigger}
        selectedLenderType={selectedLenderType}
        showMoreDetails={showMoreDetails}
        setShowMoreDetails={setShowMoreDetails}
        receiveAssetOptions={receiveAssetOptions}
        memberOptions={memberOptions}
        repaymentEstimate={repaymentEstimate}
        termMonths={termMonths}
        onSubmit={submit}
        pasteAmountFromClipboard={pasteAmountFromClipboard}
      />

      {updateModeOpen ? (
        <DebtUpdateModeDialog
          open
          onOpenChange={(open) => {
            if (!open) cancelUpdateMode()
          }}
          originalAmountChanged={updateModeOriginalChanged}
          before={updateModeBefore}
          after={updateModeAfter}
          totalRepaid={updateModeTotalRepaid}
          isSubmitting={isSavingUpdateMode}
          onConfirm={confirmUpdateMode}
        />
      ) : null}
    </div>
  )
}

function PeriodGroup({
  title,
  periods,
  locale,
}: {
  title: string
  periods: RepaymentPeriod[]
  locale: string
}) {
  const { t } = useTranslation()

  return (
    <div className="min-w-0">
      <p className="t-caption font-medium text-ink3">{title}</p>
      <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {periods.map((period) => (
          <li
            key={period.id}
            // Uniform padding across every tile, including the unfilled ones:
            // the mockup pads only the highlighted tiles, which steps their
            // text 16px away from their neighbours' in the same grid row.
            className={cn(
              'flex min-w-0 flex-col gap-2 rounded-control px-4 py-3.5',
              PERIOD_FILL[period.state],
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="t-caption text-ink3">
                {t('debts.detail.schedule.periodIndex', { index: period.index })}
              </span>
              <span className="num t-body-sm">
                {displayDate(period.isoDate, locale, t('debts.detail.noValue'))}
              </span>
            </div>
            <span className="money-number t-subhead">{formatVndShort(period.amount)}</span>
            <span
              className={cn(
                'inline-flex items-center gap-2 t-caption font-medium',
                period.state === 'paid' ? 'text-positive-ink' : 'text-ink2',
              )}
            >
              <span className={cn('size-1.5 shrink-0 rounded-full', PERIOD_DOT[period.state])} />
              {t(`debts.detail.schedule.${period.state}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
