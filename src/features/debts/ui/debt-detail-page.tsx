import { Calculator, Check, ChevronLeft, Pencil } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDebtDetail, type DebtHistoryEntry } from '@/features/debts/hooks/use-debt-detail'
import { useDebtsPage } from '@/features/debts/hooks/use-debts-page'
import { formatDate, getStatusLabel } from '@/features/debts/model/debts-form'
import { calcFromBackendEnum } from '@/features/debts/model/debts-interest'
import type { DebtItem } from '@/features/debts/model/debts.types'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtUpdateModeDialog } from '@/features/debts/ui/components/debt-update-mode-dialog'
import type { CashflowEvent } from '@/features/cashflow/model/cashflow.types'
import { formatVndShort } from '@/shared/lib/format-money'
import { useWhatIfStore } from '@/shared/stores/whatif-store'

const FREQUENCY_LABELS: Record<string, string> = {
  none: 'Linh hoạt',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
}

const LENDER_LABELS: Record<DebtItem['lenderType'], string> = {
  bank_institution: 'Vay ngân hàng',
  relative: 'Vay người thân',
  other: 'Khoản vay khác',
}

const CALC_LABELS: Record<string, string> = {
  fixed: 'cố định',
  reducing: 'dư nợ giảm dần',
}

type RepaymentCalendarItem = {
  id: string
  isoDate: string
  amount: number
  paid: boolean
}

function displayDate(value?: string) {
  if (!value) return 'Chưa có'
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN')
}

function displayMonth(value?: string) {
  if (!value) return 'Chưa chốt'
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN', {
    month: '2-digit',
    year: 'numeric',
  })
}

function displayUpdatedAt(value: string) {
  const hasTime = value.includes('T')
  const date = new Date(hasTime ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return formatDate(value)

  const day = date.toLocaleDateString('vi-VN')
  if (!hasTime) return day
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
  const openWhatIf = useWhatIfStore((store) => store.openWhatIf)
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
          <ChevronLeft className="size-4" /> Tài sản & Nợ
        </Button>
        <Card className="py-10 text-center">
          <p className="text-lg font-medium">Không tìm thấy khoản nợ</p>
          <p className="mt-1 text-sm text-ink2">
            Khoản nợ này có thể đã bị xóa hoặc không tồn tại.
          </p>
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
  const progressLabel = progress.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  const paymentDay = nextDate
    ? new Date(`${nextDate}T00:00:00`).getDate()
    : debt.firstPaymentDate
      ? new Date(`${debt.firstPaymentDate}T00:00:00`).getDate()
      : null

  function tryEarlyRepayment() {
    if (!debt) return
    openWhatIf({
      amount:
        debt.fixedPaymentAmountValue && debt.fixedPaymentAmountValue > 0
          ? debt.fixedPaymentAmountValue
          : undefined,
      plannedDate: nextDate,
      source: 'other',
    })
  }

  return (
    <div className="space-y-4 pb-3">
      <header className="px-0.5 pb-1">
        <button
          type="button"
          className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 text-[13px] text-accent hover:bg-accent-soft"
          onClick={() => navigate('/networth')}
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
          Tài sản & Nợ
        </button>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink2">
              <span>Nợ · {LENDER_LABELS[debt.lenderType]}</span>
              <span className="rounded-full bg-panel px-2.5 py-1 text-[11px] text-ink2">
                {getStatusLabel(debt.status)}
              </span>
            </div>
            <h1 className="page-title mt-2 truncate text-[27px] leading-tight sm:text-[30px]">
              {debt.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {debt.status !== 'paid_off' ? (
              <Button
                variant="secondary"
                className="h-10 px-4 text-[13px]"
                onClick={tryEarlyRepayment}
              >
                <Calculator className="size-4" strokeWidth={1.75} />
                Thử trả trước
              </Button>
            ) : null}
            <Button className="h-10 px-4 text-[13px]" onClick={() => openEdit(debt.id)}>
              <Pencil className="size-4" strokeWidth={1.75} />
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="section-title text-[16px]">Tổng quan</h2>
          <p className="text-[12px] text-ink3">
            Cập nhật gần nhất{' '}
            <span className="money-number font-mono">{displayUpdatedAt(latestUpdate)}</span>
          </p>
        </div>

        <div className="mt-7 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <div>
            <p className="label">Dư nợ còn lại</p>
            <MoneyValue value={debt.outstandingAmountValue} />
          </div>

          <div className="lg:pb-0.5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="label">Tiến độ trả</p>
              <p className="money-number text-[17px]">{progressLabel}%</p>
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-sunk"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={`Đã trả ${progressLabel}% khoản vay`}
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2.5 text-[12px] text-ink2">
              Đã trả <span className="money-number font-medium text-ink">{formatVndShort(repaid)}</span>
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="section-title text-[16px]">Thông tin khoản vay</h2>

        <div className="mt-7 grid gap-7 sm:grid-cols-3 sm:gap-0">
          <div className="pr-0 sm:pr-7">
            <p className="label">Tất toán dự kiến</p>
            <p className="money-number mt-3 font-mono text-[24px]">
              {displayMonth(debt.expectedFinalDueDate)}
            </p>
            <p className="mt-2 text-[12px] text-ink2">Theo lịch trả hiện tại</p>
          </div>

          <div className="px-0 sm:border-l sm:border-hair sm:px-7">
            <p className="label">Đã thanh toán</p>
            <p className="money-number mt-3 text-[24px]">{repayments.length} kỳ</p>
            <p className="mt-2 text-[12px] text-ink2">
              {latestRepayment
                ? `Kỳ gần nhất ${displayDate(latestRepayment.isoDate)}`
                : 'Chưa có kỳ nào'}
            </p>
          </div>

          <div className="px-0 sm:border-l sm:border-hair sm:px-7">
            <p className="label">Còn lại</p>
            <p className="money-number mt-3 text-[24px]">{upcomingPayments.length} kỳ</p>
            <p className="mt-2 text-[12px] text-ink2">
              {remainingMonths !== null ? `Khoảng ${remainingMonths} tháng` : 'Chưa chốt thời hạn'}
            </p>
          </div>
        </div>

        <div className="sunk mt-8 p-5 sm:p-6">
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <LoanInfo label="Bên cho vay" value={debt.lenderName || 'Chưa cập nhật'} />
            <LoanInfo label="Khoản vay ban đầu" value={formatVndShort(debt.originalAmountValue)} />
            <LoanInfo label="Lãi suất" value={debt.interestSummary || 'Không tính lãi'} />
            <LoanInfo
              label="Cách trả"
              value={`${FREQUENCY_LABELS[debt.paymentFrequency ?? 'none']}${
                stages.length ? ` · ${CALC_LABELS[calc] ?? calc}` : ''
              }`}
            />
            {paymentDay ? <LoanInfo label="Ngày thanh toán" value={`Ngày ${paymentDay}`} mono /> : null}
            <LoanInfo label="Người phụ trách" value={ownerName || 'Chưa phân công'} />
            <LoanInfo label="Nhận vào" value={receivedToAssetName || 'Chưa cập nhật'} />
            <LoanInfo label="Ngày giải ngân" value={displayDate(debt.borrowedAt)} mono />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title text-[16px]">Các kỳ thanh toán</h2>
          <button
            type="button"
            className="min-h-10 text-[13px] text-accent hover:underline"
            onClick={() => navigate('/events')}
          >
            Xem nhật ký
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
                        aria-label="Đã thanh toán"
                      />
                    ) : isNext ? (
                      <span
                        className="absolute right-3 top-3 size-2 rounded-full bg-attention"
                        aria-label="Kỳ tiếp theo"
                      />
                    ) : null}
                    <p
                      className={
                        item.paid
                          ? 'money-number font-mono text-[12px] text-white/80'
                          : 'money-number font-mono text-[12px] text-ink2'
                      }
                    >
                      {displayDate(item.isoDate)}
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
            Chưa có lịch thanh toán cho khoản nợ này.
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
