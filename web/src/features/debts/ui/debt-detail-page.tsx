import { Check, ChevronLeft, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDebtDetail, type DebtHistoryEntry } from '@money-space/core/features/debts/hooks/use-debt-detail'
import { useDebtsPage } from '@money-space/core/features/debts/hooks/use-debts-page'
import { formatDate } from '@money-space/core/features/debts/model/debts-form'
import { calcFromBackendEnum } from '@money-space/core/features/debts/model/debts-interest'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtUpdateModeDialog } from '@/features/debts/ui/components/debt-update-mode-dialog'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

type RepaymentCalendarItem = {
  id: string
  isoDate: string
  amount: number
  paid: boolean
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

function monthsUntil(value?: string) {
  if (!value) return null
  const today = new Date()
  const target = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  return Math.max(
    0,
    (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth(),
  )
}

function MoneyValue({ value }: { value: number }) {
  const formatted = formatVndShort(value)
  const match = formatted.match(/^(.+)\s+(triệu|tỷ)$/)

  return (
    <div className="mt-4 flex items-end gap-2">
      <span className="money-number text-[48px] leading-[.9] sm:text-[54px]">
        {match?.[1] ?? formatted}
      </span>
      {match?.[2] ? <span className="pb-1 text-[20px] font-medium">{match[2]}</span> : null}
    </div>
  )
}

function LoanInfo({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[12px] text-ink3">{label}</p>
      <p className={mono ? 'money-number mt-1.5 font-mono text-[13px]' : 'mt-1.5 text-[14px] font-medium'}>
        {value}
      </p>
    </div>
  )
}

function buildCalendar(
  repayments: DebtHistoryEntry[],
  upcomingPayments: CashflowEvent[],
): RepaymentCalendarItem[] {
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

  return [...paid, ...upcoming].sort((left, right) =>
    left.isoDate.localeCompare(right.isoDate),
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
    return <div className="h-[520px] animate-pulse rounded-panel bg-panel" />
  }

  if (!debt) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/networth')}>
          <ChevronLeft className="size-4" /> {t('debts.detail.back')}
        </Button>
        <Card className="py-10 text-center">
          <p className="text-lg font-medium">{t('debts.detail.notFoundTitle')}</p>
          <p className="mt-1 text-sm text-ink2">{t('debts.detail.notFoundBody')}</p>
        </Card>
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
  const calendarItems = buildCalendar(repayments, upcomingPayments)
  const latestRepayment = repayments[0]
  const remainingMonths = monthsUntil(debt.expectedFinalDueDate)
  const progressLabel = progress.toLocaleString(locale, { maximumFractionDigits: 1 })
  // "Hàng tháng · dư nợ giảm dần" — the calculation half only means something
  // once the debt actually has interest stages.
  const frequencyLabel = t(`debts.form.frequency.${debt.paymentFrequency ?? 'none'}`)
  const repaymentMethod = stages.length
    ? `${frequencyLabel} · ${t(`debts.detail.calc.${calc}`, { defaultValue: calc })}`
    : frequencyLabel
  const paymentDay = nextDate
    ? new Date(`${nextDate}T00:00:00`).getDate()
    : debt.firstPaymentDate
      ? new Date(`${debt.firstPaymentDate}T00:00:00`).getDate()
      : null

  return (
    <div className="space-y-4 pb-3">
      <header className="px-0.5 pb-1">
        <button
          type="button"
          className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 text-[13px] text-accent hover:bg-accent-soft"
          onClick={() => navigate('/networth')}
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
          {t('debts.detail.back')}
        </button>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink2">
              <span className="rounded-full bg-panel px-2.5 py-1 text-[11px] text-ink2">
                {t(`options.debtStatus.${debt.status}`)}
              </span>
            </div>
            <h1 className="page-title mt-2 truncate text-[27px] leading-tight sm:text-[30px]">
              {debt.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="h-10 px-4 text-[13px]" onClick={() => openEdit(debt.id)}>
              <Pencil className="size-4" strokeWidth={1.75} />
              {t('common.edit')}
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="section-title text-[16px]">{t('debts.detail.overview.title')}</h2>
          <p className="text-[12px] text-ink3">
            {t('debts.detail.overview.updatedAt')}{' '}
            <span className="money-number font-mono">
              {displayUpdatedAt(latestUpdate, locale)}
            </span>
          </p>
        </div>

        <div className="mt-7 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <div>
            <p className="label">{t('debts.detail.overview.outstanding')}</p>
            <MoneyValue value={debt.outstandingAmountValue} />
          </div>

          <div className="lg:pb-0.5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="label">{t('debts.detail.overview.progress')}</p>
              <p className="money-number text-[17px]">{progressLabel}%</p>
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-sunk"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={t('debts.detail.overview.progressAria', { percent: progressLabel })}
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2.5 text-[12px] text-ink2">
              {t('debts.detail.overview.repaid')}{' '}
              <span className="money-number font-medium text-ink">{formatVndShort(repaid)}</span>
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="section-title text-[16px]">{t('debts.detail.loan.title')}</h2>

        <div className="mt-7 grid gap-7 sm:grid-cols-3 sm:gap-0">
          <div className="pr-0 sm:pr-7">
            <p className="label">{t('debts.detail.loan.payoff')}</p>
            <p className="money-number mt-3 font-mono text-[24px]">
              {displayMonth(debt.expectedFinalDueDate, locale, t('debts.detail.noMonth'))}
            </p>
            <p className="mt-2 text-[12px] text-ink2">{t('debts.detail.loan.payoffNote')}</p>
          </div>

          <div className="px-0 sm:border-l sm:border-hair sm:px-7">
            <p className="label">{t('debts.detail.loan.paid')}</p>
            <p className="money-number mt-3 text-[24px]">
              {t('debts.detail.loan.installments', { count: repayments.length })}
            </p>
            <p className="mt-2 text-[12px] text-ink2">
              {latestRepayment
                ? t('debts.detail.loan.latestInstallment', {
                    date: displayDate(latestRepayment.isoDate, locale, t('debts.detail.noValue')),
                  })
                : t('debts.detail.loan.noInstallment')}
            </p>
          </div>

          <div className="px-0 sm:border-l sm:border-hair sm:px-7">
            <p className="label">{t('debts.detail.loan.remaining')}</p>
            <p className="money-number mt-3 text-[24px]">
              {t('debts.detail.loan.installments', { count: upcomingPayments.length })}
            </p>
            <p className="mt-2 text-[12px] text-ink2">
              {remainingMonths !== null
                ? t('debts.detail.loan.remainingMonths', { count: remainingMonths })
                : t('debts.detail.loan.noTerm')}
            </p>
          </div>
        </div>

        <div className="sunk mt-8 p-5 sm:p-6">
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <LoanInfo
              label={t('debts.detail.loan.lender')}
              value={debt.lenderName || t('debts.detail.loan.notUpdated')}
            />
            {/* Moved here from the list row, which now shows the name alone.
                The fact is worth keeping — a loan from a relative is not the
                same kind of obligation as one from a bank — it just does not
                need a line in a table that is one click away from this. */}
            <LoanInfo
              label={t('debts.detail.loan.lenderType')}
              value={t(`debts.form.lenderType.${debt.lenderType}`)}
            />
            <LoanInfo
              label={t('debts.detail.loan.originalAmount')}
              value={formatVndShort(debt.originalAmountValue)}
            />
            <LoanInfo
              label={t('debts.detail.loan.interest')}
              value={debt.interestSummary || t('debts.detail.loan.noInterest')}
            />
            <LoanInfo label={t('debts.detail.loan.method')} value={repaymentMethod} />
            {paymentDay ? (
              <LoanInfo
                label={t('debts.detail.loan.paymentDay')}
                value={t('debts.detail.loan.paymentDayValue', { day: paymentDay })}
                mono
              />
            ) : null}
            <LoanInfo
              label={t('debts.detail.loan.owner')}
              value={ownerName || t('debts.detail.loan.unassigned')}
            />
            <LoanInfo
              label={t('debts.detail.loan.receivedInto')}
              value={receivedToAssetName || t('debts.detail.loan.notUpdated')}
            />
            <LoanInfo
              label={t('debts.detail.loan.disbursedAt')}
              value={displayDate(debt.borrowedAt, locale, t('debts.detail.noValue'))}
              mono
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title text-[16px]">{t('debts.detail.schedule.title')}</h2>
          <button
            type="button"
            className="min-h-10 text-[13px] text-accent hover:underline"
            onClick={() => navigate('/events')}
          >
            {t('debts.detail.schedule.viewJournal')}
          </button>
        </div>

        {calendarItems.length > 0 ? (
          <div className="sunk mt-7 p-2.5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {calendarItems.map((item, index) => {
                const isNext = !item.paid && !calendarItems.slice(0, index).some((entry) => !entry.paid)
                return (
                  <div
                    key={item.id}
                    className={
                      item.paid
                        ? 'relative min-h-[96px] rounded-[9px] bg-accent p-3.5 text-white'
                        : 'relative min-h-[96px] rounded-[9px] bg-panel p-3.5'
                    }
                  >
                    {item.paid ? (
                      <Check
                        className="absolute right-3 top-3 size-4 text-white/80"
                        strokeWidth={1.75}
                        aria-label={t('debts.detail.schedule.paid')}
                      />
                    ) : isNext ? (
                      <span
                        className="absolute right-3 top-3 size-2 rounded-full bg-attention"
                        aria-label={t('debts.detail.schedule.next')}
                      />
                    ) : null}
                    <p
                      className={
                        item.paid
                          ? 'money-number font-mono text-[12px] text-white/80'
                          : 'money-number font-mono text-[12px] text-ink2'
                      }
                    >
                      {displayDate(item.isoDate, locale, t('debts.detail.noValue'))}
                    </p>
                    <p className="money-number mt-7 text-[17px]">
                      {formatVndShort(item.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="sunk mt-7 px-4 py-8 text-center text-[13px] text-ink2">
            {t('debts.detail.schedule.empty')}
          </p>
        )}
      </Card>

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
