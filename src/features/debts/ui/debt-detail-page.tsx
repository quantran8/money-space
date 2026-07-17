import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, Pencil } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDebtDetail, type DebtHistoryEntry } from '@/features/debts/hooks/use-debt-detail'
import { useDebtsPage } from '@/features/debts/hooks/use-debts-page'
import { formatDate, getStatusLabel, getStatusTone } from '@/features/debts/model/debts-form'
import { calcFromBackendEnum } from '@/features/debts/model/debts-interest'
import type { DebtItem } from '@/features/debts/model/debts.types'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtUpdateModeDialog } from '@/features/debts/ui/components/debt-update-mode-dialog'
import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type TrendRange = 6 | 12 | 'all'

const FREQUENCY_LABELS: Record<string, string> = {
  none: 'Linh hoạt',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
}

const LENDER_LABELS: Record<DebtItem['lenderType'], string> = {
  bank_institution: 'Vay ngân hàng',
  relative: 'Người thân',
  other: 'Khoản vay khác',
}

const CALC_LABELS: Record<string, string> = {
  fixed: 'Trả cố định',
  reducing: 'Dư nợ giảm dần',
}

function paymentDate(payment?: UpcomingPaymentItem) {
  if (!payment) return undefined
  return payment.dueDate ?? payment.due
}

function daysUntil(dateValue: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${dateValue}T00:00:00`)
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000)
}

function dueMeta(dateValue: string) {
  const days = daysUntil(dateValue)
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  if (days <= 30) return `Còn ${days} ngày`
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('vi-VN', { month: 'long' })
}

function TermRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-semibold">{value}</span>
    </div>
  )
}

function DebtTrendChart({ debt, history }: { debt: DebtItem; history: DebtHistoryEntry[] }) {
  const [range, setRange] = useState<TrendRange>(6)
  const data = useMemo(() => {
    const now = new Date()
    const borrowed = new Date(`${debt.borrowedAt}T00:00:00`)
    const allMonths = Math.max(
      1,
      (now.getFullYear() - borrowed.getFullYear()) * 12 + now.getMonth() - borrowed.getMonth() + 1,
    )
    const count = range === 'all' ? allMonths : range
    return Array.from({ length: count }, (_, index) => {
      const monthsAgo = count - 1 - index
      const pointDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59)
      if (index === count - 1) pointDate.setTime(now.getTime())
      const value = history.reduce((balance, entry) => {
        if (new Date(`${entry.isoDate}T00:00:00`) <= pointDate) return balance
        if (entry.kind === 'repayment') return balance + entry.amount
        if (entry.kind === 'borrow') return balance - entry.amount
        return balance
      }, debt.outstandingAmountValue)
      return {
        label: index === count - 1 ? 'Hiện tại' : `T${pointDate.getMonth() + 1}`,
        value: Math.max(0, value),
      }
    })
  }, [debt, history, range])

  const first = data[0]?.value ?? debt.outstandingAmountValue
  const change = debt.outstandingAmountValue - first

  return (
    <Card className="xl:col-span-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dư nợ còn lại</h2>
          <p className="mt-2 text-sm text-muted-foreground">Số tiền còn phải trả sau mỗi lần ghi nhận thanh toán.</p>
        </div>
        <div className="inline-flex w-fit rounded-xl bg-muted p-1">
          {([{ value: 6, label: '6 tháng' }, { value: 12, label: '1 năm' }, { value: 'all', label: 'Toàn bộ' }] as const).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition', range === item.value ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Hiện tại</p>
          <p className="money-number mt-1 text-2xl font-semibold">{formatVndShort(debt.outstandingAmountValue)}</p>
        </div>
        <p className={cn('text-sm font-medium', change <= 0 ? 'text-[hsl(var(--status-green))]' : 'text-[hsl(var(--status-red))]')}>
          {change > 0 ? '+' : change < 0 ? '−' : ''}{formatVndShort(Math.abs(change))}
          {range !== 'all' ? ` trong ${range} tháng` : ''}
        </p>
      </div>

      <div className="mt-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="debt-detail-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.16} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={7} minTickGap={20} />
            <YAxis width={48} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatVndShort} />
            <Tooltip formatter={(value) => [formatVndShort(Number(value)), 'Dư nợ']} contentStyle={{ borderRadius: 14, borderColor: 'hsl(var(--border))' }} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={3} fill="url(#debt-detail-fill)" isAnimationActive={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function DebtDetailPage() {
  const { debtId } = useParams<{ debtId: string }>()
  const navigate = useNavigate()
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const {
    debt,
    ownerName,
    receivedToAssetName,
    history,
    borrows,
    repayments,
    adjustments,
    totalBorrowed,
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
    return <div className="h-[520px] animate-pulse rounded-[28px] bg-muted" />
  }

  if (!debt) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/debts')}>
          <ChevronLeft className="size-4" /> Danh sách khoản nợ
        </Button>
        <Card className="py-10 text-center">
          <p className="text-lg font-semibold">Không tìm thấy khoản nợ</p>
          <p className="mt-1 text-sm text-muted-foreground">Khoản nợ này có thể đã bị xóa hoặc không tồn tại.</p>
        </Card>
      </div>
    )
  }

  const repaid = Math.max(totalRepaid, debt.originalAmountValue - debt.outstandingAmountValue)
  const progress = debt.originalAmountValue > 0 ? Math.min(100, Math.round((repaid / debt.originalAmountValue) * 100)) : 0
  const nextPayment = upcomingPayments[0]
  const nextDate = paymentDate(nextPayment)
  const latestUpdate = history[0]?.isoDate ?? debt.borrowedAt
  const stages = debt.interestPeriods ?? []
  const calc = calcFromBackendEnum(debt.interestCalculation)
  const visibleUpcoming = showAllUpcoming ? upcomingPayments : upcomingPayments.slice(0, 3)
  const visibleRepayments = showAllHistory ? repayments : repayments.slice(0, 4)

  function recordPayment() {
    navigate('/events')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" className="-ml-2 w-fit gap-1" onClick={() => navigate('/debts')}>
          <ChevronLeft className="size-4" /> Danh sách khoản nợ
        </Button>
        <div className="flex flex-wrap gap-2">
          {debt.status !== 'paid_off' ? <Button variant="secondary" onClick={recordPayment}>Ghi nhận đã trả</Button> : null}
          <Button onClick={() => openEdit(debt.id)}><Pencil className="mr-2 size-4" /> Chỉnh sửa</Button>
        </div>
      </div>

      <section className="py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">Khoản nợ · {LENDER_LABELS[debt.lenderType]}</p>
          <Badge className={getStatusTone(debt.status)}>{getStatusLabel(debt.status)}</Badge>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[42px]">{debt.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {debt.lenderName || 'Chưa rõ bên cho vay'}{ownerName ? ` · ${ownerName} phụ trách` : ''}{debt.expectedFinalDueDate ? ` · Kết thúc ${formatDate(debt.expectedFinalDueDate)}` : ''}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Cập nhật gần nhất: {formatDate(latestUpdate)}</p>
        </div>
      </section>

      <section className="rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr] xl:items-end">
          <div>
            <p className="text-sm font-medium text-white/45">Dư nợ còn lại</p>
            <p className="money-number mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">{formatVndShort(debt.outstandingAmountValue)}</p>
            <p className="mt-5 text-sm text-white/45">Đã trả <span className="font-medium text-white">{formatVndShort(repaid)}</span> trên tổng tiền vay ban đầu {formatVndShort(debt.originalAmountValue)}.</p>
            <div className="mt-6 h-2.5 max-w-2xl overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex max-w-2xl justify-between text-xs text-white/35"><span>Đã trả {progress}%</span><span>Còn lại {100 - progress}%</span></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <HeroMetric label="Tiền vay ban đầu" value={formatVndShort(debt.originalAmountValue)} hint={`Nhận ngày ${formatDate(debt.borrowedAt)}`} />
            <HeroMetric label="Kỳ trả định kỳ" value={formatVndShort(debt.fixedPaymentAmountValue ?? 0)} hint={FREQUENCY_LABELS[debt.paymentFrequency ?? 'none']} />
            <HeroMetric label="Kỳ tiếp theo" value={nextDate ? new Date(`${nextDate}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'Chưa có'} hint={nextPayment?.status === 'normal' ? 'Đã chuẩn bị nguồn' : nextPayment ? 'Chờ xác nhận' : 'Chưa lên lịch'} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <DebtTrendChart debt={debt} history={history} />
        <Card className="xl:col-span-4">
          <h2 className="text-xl font-semibold tracking-tight">Điều khoản hiện tại</h2>
          <div className="mt-5 divide-y divide-border">
            <TermRow label="Bên cho vay" value={debt.lenderName || 'Chưa cập nhật'} />
            <TermRow label="Lãi suất" value={debt.interestSummary || 'Không tính lãi'} />
            <TermRow label="Cách trả" value={`${FREQUENCY_LABELS[debt.paymentFrequency ?? 'none']}${stages.length ? ` · ${CALC_LABELS[calc] ?? calc}` : ''}`} />
            {nextDate ? <TermRow label="Ngày thanh toán" value={`Ngày ${new Date(`${nextDate}T00:00:00`).getDate()}`} /> : null}
            <TermRow label="Ngày bắt đầu" value={formatDate(debt.borrowedAt)} />
            <TermRow label="Ngày kết thúc" value={formatDate(debt.expectedFinalDueDate)} />
            <TermRow label="Người phụ trách" value={ownerName || 'Chưa phân công'} />
            <TermRow label="Tiền nhận vào" value={receivedToAssetName || 'Chưa cập nhật'} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Các kỳ sắp tới</h2>
            {upcomingPayments.length > 3 ? <button type="button" onClick={() => setShowAllUpcoming((value) => !value)} className="text-sm font-medium text-muted-foreground hover:text-foreground">{showAllUpcoming ? 'Thu gọn' : 'Xem toàn bộ'}</button> : null}
          </div>
          <div className="mt-5 divide-y divide-border">
            {visibleUpcoming.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Chưa có kỳ trả nợ sắp tới.</p> : null}
            {visibleUpcoming.map((payment) => {
              const date = paymentDate(payment)!
              return <div key={payment.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[76px_1fr_110px] sm:items-center">
                <div><p className="text-sm font-semibold">{new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p><p className="mt-1 text-xs text-muted-foreground">{dueMeta(date)}</p></div>
                <div className="min-w-0"><p className="truncate text-sm font-medium">{payment.name}</p><p className={cn('mt-1 text-xs', payment.status === 'normal' ? 'text-[hsl(var(--status-green))]' : 'text-muted-foreground')}>{payment.status === 'normal' ? 'Đã chuẩn bị nguồn' : payment.status === 'important' ? 'Cần ưu tiên' : 'Chờ xác nhận'}</p></div>
                <p className="money-number text-sm font-semibold sm:text-right">{formatVndShort(payment.amountValue ?? 0)}</p>
              </div>
            })}
          </div>
        </Card>

        <Card className="xl:col-span-7">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Các khoản đã thanh toán</h2>
            {repayments.length > 4 ? <button type="button" onClick={() => setShowAllHistory((value) => !value)} className="text-sm font-medium text-muted-foreground hover:text-foreground">{showAllHistory ? 'Thu gọn' : 'Xem tất cả'}</button> : null}
          </div>
          <div className="mt-5 divide-y divide-border">
            {visibleRepayments.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Chưa ghi nhận khoản thanh toán nào.</p> : null}
            {visibleRepayments.map((entry) => <HistoryPaymentRow key={entry.id} entry={entry} ownerName={ownerName} sourceName={receivedToAssetName} />)}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Đã nhận {formatVndShort(totalBorrowed || debt.originalAmountValue)}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Nhận vào {receivedToAssetName || 'nguồn tiền chưa xác định'} ngày {formatDate(debt.borrowedAt)}. Đây là sự kiện nhận tiền, không phải nguồn cố định của khoản nợ.</p>
            {debt.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">Ghi chú: {debt.note}</p> : null}
          </div>
          <div className="sm:text-right"><p className="money-number text-sm font-semibold">{formatVndShort(totalBorrowed || debt.originalAmountValue)}</p><p className="mt-1 text-xs text-muted-foreground">{ownerName ? `Phụ trách: ${ownerName}` : `${borrows.length} lần nhận`}</p></div>
        </div>
        {adjustments.length > 0 ? <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">Có {adjustments.length} lần điều chỉnh số dư được lưu trong lịch sử khoản nợ.</p> : null}
      </Card>

      <DebtFormDialog open={dialogOpen} onOpenChange={onOpenChange} editingId={editingId} control={control} register={register} errors={errors} isValid={isValid} isSavingDebt={isSavingDebt} setValue={setValue} selectedLenderType={selectedLenderType} showMoreDetails={showMoreDetails} setShowMoreDetails={setShowMoreDetails} receiveAssetOptions={receiveAssetOptions} memberOptions={memberOptions} repaymentEstimate={repaymentEstimate} termMonths={termMonths} onSubmit={submit} pasteAmountFromClipboard={pasteAmountFromClipboard} />

      {updateModeOpen ? <DebtUpdateModeDialog open onOpenChange={(open) => { if (!open) cancelUpdateMode() }} originalAmountChanged={updateModeOriginalChanged} before={updateModeBefore} after={updateModeAfter} totalRepaid={updateModeTotalRepaid} isSubmitting={isSavingUpdateMode} onConfirm={confirmUpdateMode} /> : null}
    </div>
  )
}

function HeroMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="border-l border-white/10 pl-4"><p className="text-xs text-white/40">{label}</p><p className="money-number mt-3 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-white/30">{hint}</p></div>
}

function HistoryPaymentRow({ entry, ownerName, sourceName }: { entry: DebtHistoryEntry; ownerName?: string; sourceName?: string }) {
  return <div className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[110px_1fr_150px_120px] md:items-center">
    <p className="text-xs text-muted-foreground">{formatDate(entry.isoDate)}</p>
    <div className="min-w-0"><p className="truncate text-sm font-medium">{entry.title}</p><p className="mt-1 text-xs text-muted-foreground">{ownerName ? `${ownerName} ghi nhận` : 'Đã ghi nhận'}</p></div>
    <p className="truncate text-sm text-muted-foreground">{sourceName || 'Nguồn thanh toán'}</p>
    <p className="money-number text-sm font-semibold md:text-right">−{formatVndShort(entry.amount)}</p>
  </div>
}
