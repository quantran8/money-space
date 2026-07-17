import { Card } from '@/components/ui/card'
import { formatVndShortLocal, type DebtSummary } from '@/features/debts/model/debts-form'
import type { DebtItem } from '@/features/debts/model/debts.types'
import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'

type DebtsSummaryStripProps = {
  summary: DebtSummary
  debts: DebtItem[]
  payments: UpcomingPaymentItem[]
}

function money(value: number) {
  return formatVndShortLocal(value)
}

function daysFromNow(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${date}T00:00:00`)
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
}

export function DebtsSummaryStrip({ summary, debts, payments }: DebtsSummaryStripProps) {
  const activeDebts = debts.filter((debt) => debt.status === 'active' || debt.status === 'overdue')
  const original = activeDebts.reduce((sum, debt) => sum + debt.originalAmountValue, 0)
  const repaid = Math.max(0, original - summary.outstanding)
  const repaidPercent = original > 0 ? Math.round((repaid / original) * 100) : 0
  const linkedPayments = payments.filter((payment) => payment.debtId)
  const upcoming = linkedPayments.filter((payment) => {
    const days = daysFromNow(payment.dueDate ?? payment.due)
    return days >= 0 && days <= 30
  })
  const prepared = upcoming.filter((payment) => payment.status === 'normal')
  const needsUpdate = activeDebts.filter(
    (debt) => !debt.fixedPaymentAmountValue || !debt.expectedFinalDueDate,
  )

  return (
    <section className="grid gap-4 xl:grid-cols-12">
      <div className="rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:p-8 xl:col-span-8">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-white/45">Tổng dư nợ hiện tại</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/55">
                {summary.activeCount} khoản đang mở
              </span>
            </div>
            <p className="money-number mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {formatVndShortLocal(summary.outstanding)}
            </p>
            <p className="mt-5 text-sm leading-6 text-white/45">
              Đã thanh toán <span className="font-medium text-white">{money(repaid)}</span> trên
              tổng tiền vay ban đầu {money(original)}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-l border-white/10 pl-4">
              <p className="text-xs text-white/40">Đã trả</p>
              <p className="money-number mt-3 text-xl font-semibold">{money(repaid)}</p>
              <p className="mt-1 text-xs text-white/30">{repaidPercent}% tổng gốc</p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <p className="text-xs text-white/40">Trả định kỳ</p>
              <p className="money-number mt-3 text-xl font-semibold">{money(summary.monthlyPlanned)}</p>
              <p className="mt-1 text-xs text-white/30">Mỗi tháng</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="xl:col-span-4">
        <h2 className="text-xl font-semibold tracking-tight">Kỳ hạn hiện tại</h2>
        <div className="mt-5 divide-y divide-border">
          <StatusRow
            label="Sắp trả trong 30 ngày"
            description={`${upcoming.length} kỳ thanh toán`}
            value={money(upcoming.reduce((sum, item) => sum + (item.amountValue ?? 0), 0))}
          />
          <StatusRow
            label="Đã chuẩn bị nguồn"
            description={prepared[0]?.name ?? 'Chưa có kỳ được xác nhận'}
            value={money(prepared.reduce((sum, item) => sum + (item.amountValue ?? 0), 0))}
          />
          <StatusRow
            label="Cần cập nhật"
            description="Chưa đủ số tiền hoặc kỳ hạn"
            value={`${needsUpdate.length} khoản`}
          />
        </div>
      </Card>
    </section>
  )
}

function StatusRow({ label, description, value }: { label: string; description: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <p className="money-number shrink-0 text-lg font-semibold">{value}</p>
    </div>
  )
}
