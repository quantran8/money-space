import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card } from '@/components/ui/card'
import type { DebtItem } from '@/features/debts/model/debts.types'
import type { MoneyEventItem } from '@/features/events/model/events.types'
import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type DebtsInsightsSectionProps = {
  debts: DebtItem[]
  events: MoneyEventItem[]
  payments: UpcomingPaymentItem[]
  isLoading: boolean
}

function parseDue(payment: UpcomingPaymentItem) {
  const value = payment.dueDate ?? payment.due
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function dueLabel(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((date.getTime() - today.getTime()) / 86_400_000)
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  if (days > 0 && days <= 30) return `Còn ${days} ngày`
  return date.toLocaleDateString('vi-VN', { month: 'long' })
}

export function DebtsInsightsSection({ debts, events, payments, isLoading }: DebtsInsightsSectionProps) {
  const [range, setRange] = useState<6 | 12>(6)
  const activeIds = useMemo(
    () => new Set(debts.filter((debt) => debt.status !== 'cancelled').map((debt) => debt.id)),
    [debts],
  )
  const current = debts
    .filter((debt) => debt.status === 'active' || debt.status === 'overdue')
    .reduce((sum, debt) => sum + debt.outstandingAmountValue, 0)

  const upcoming = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return payments
      .map((payment) => ({ payment, due: parseDue(payment) }))
      .filter((entry): entry is { payment: UpcomingPaymentItem; due: Date } =>
        Boolean(entry.payment.debtId && entry.due && entry.due >= today),
      )
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 3)
  }, [payments])

  const chartData = useMemo(() => {
    const now = new Date()
    const linkedEvents = events.filter((event) => event.debtId && activeIds.has(event.debtId))
    return Array.from({ length: range }, (_, index) => {
      const monthsAgo = range - 1 - index
      const pointDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59)
      if (index === range - 1) pointDate.setTime(now.getTime())
      const value = linkedEvents.reduce((balance, event) => {
        const eventDate = new Date(`${event.isoDate}T00:00:00`)
        if (eventDate <= pointDate) return balance
        if (event.direction === 'outflow') return balance + Math.abs(event.amount)
        if (event.direction === 'inflow') return balance - Math.abs(event.amount)
        return balance
      }, current)
      return {
        label: index === range - 1 ? 'Hiện tại' : `T${pointDate.getMonth() + 1}`,
        value: Math.max(0, value),
      }
    })
  }, [activeIds, current, events, range])

  const first = chartData[0]?.value ?? current
  const change = current - first

  return (
    <section className="grid gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Các kỳ sắp tới</h2>
          </div>
          <Link to="/events" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Xem lịch đầy đủ
          </Link>
        </div>
        <div className="mt-5 divide-y divide-border">
          {isLoading ? <p className="py-8 text-sm text-muted-foreground">Đang tải lịch trả nợ...</p> : null}
          {!isLoading && upcoming.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">Chưa có kỳ trả nợ sắp tới.</p>
          ) : null}
          {upcoming.map(({ payment, due }) => (
            <div key={payment.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[72px_1fr_110px] sm:items-center">
              <div>
                <p className="text-sm font-semibold">{due.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dueLabel(due)}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{payment.name}</p>
                <p className={cn('mt-1 text-xs', payment.status === 'normal' ? 'text-[hsl(var(--status-green))]' : 'text-muted-foreground')}>
                  {payment.status === 'normal' ? 'Đã chuẩn bị nguồn' : payment.status === 'important' ? 'Cần ưu tiên' : 'Chờ xác nhận'}
                </p>
              </div>
              <p className="money-number text-sm font-semibold sm:text-right">{formatVndShort(payment.amountValue ?? 0)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="xl:col-span-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Dư nợ qua các lần cập nhật</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tổng số còn phải trả, tính từ lịch sử vay và thanh toán.</p>
          </div>
          <div className="inline-flex w-fit rounded-xl bg-muted p-1">
            {([6, 12] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition', range === value ? 'bg-card shadow-sm' : 'text-muted-foreground')}
              >
                {value === 6 ? '6 tháng' : '1 năm'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Hiện tại</p>
            <p className="money-number mt-1 text-2xl font-semibold">{formatVndShort(current)}</p>
          </div>
          <p className={cn('text-sm font-medium', change <= 0 ? 'text-[hsl(var(--status-green))]' : 'text-[hsl(var(--status-red))]')}>
            {change > 0 ? '+' : change < 0 ? '−' : ''}{formatVndShort(Math.abs(change))}
          </p>
        </div>

        <div className="mt-4 h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="debt-total-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={7} />
              <YAxis width={48} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatVndShort} />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))' }}
                formatter={(value) => [formatVndShort(Number(value)), 'Dư nợ']}
                contentStyle={{ borderRadius: 14, borderColor: 'hsl(var(--border))', boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={3} fill="url(#debt-total-fill)" isAnimationActive={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  )
}
