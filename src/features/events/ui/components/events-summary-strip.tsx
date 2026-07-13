import { ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, TriangleAlert } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type EventsSummary = {
  upcomingIn7DaysCount: number
  upcomingIn7DaysAmount: number
  recordedThisMonth: number
  attentionCount: number
  totalIncome: number
  totalOutcome: number
  netChange: number
}

type EventsSummaryStripProps = {
  summary: EventsSummary
}

export function EventsSummaryStrip({ summary }: EventsSummaryStripProps) {
  const { totalIncome, totalOutcome, netChange, recordedThisMonth } = summary
  const isNetPositive = netChange >= 0
  // Share of what came in that has already gone out this month. Clamp to
  // [0, 100] so an over-spend (chi > thu) still renders a full bar instead of
  // overflowing, and guard the divide-by-zero when nothing came in.
  const spentRatio =
    totalIncome > 0 ? Math.min(100, Math.round((totalOutcome / totalIncome) * 100)) : 0

  return (
    <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      {/* Primary financial summary */}
      <Card className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--status-green))' }}
            />
            <p className="text-sm font-medium text-muted-foreground">Tổng quan tháng này</p>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <p
              className={cn(
                'money-number text-4xl font-semibold tracking-[-0.04em] md:text-5xl',
                isNetPositive ? 'text-[hsl(var(--status-green))]' : 'text-[hsl(var(--status-red))]',
              )}
            >
              {isNetPositive ? '+' : '-'}
              {formatVndShort(Math.abs(netChange))}
            </p>
            <span
              className={cn(
                'mb-2 rounded-full px-3 py-1 text-xs font-semibold',
                isNetPositive
                  ? 'bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))]'
                  : 'bg-[hsla(var(--status-red),0.12)] text-[hsl(var(--status-red))]',
              )}
            >
              {isNetPositive ? 'Net dương' : 'Net âm'}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryAmountBox
            label="Tổng thu"
            value={`+${formatVndShort(totalIncome)}`}
            caption={`${recordedThisMonth} record đã ghi nhận`}
            tone="income"
          />
          <SummaryAmountBox
            label="Tổng chi"
            value={`-${formatVndShort(totalOutcome)}`}
            caption={totalIncome > 0 ? `Chiếm ${spentRatio}% tổng thu` : 'Chưa có khoản thu'}
            tone="outcome"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Tỷ lệ dòng tiền</span>
            <span>{spentRatio}% đã chi</span>
          </div>
          <Progress value={spentRatio} />
        </div>
      </Card>

      {/* Secondary operational metrics */}
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <MetricCard
          icon={CalendarClock}
          dotColor="hsl(var(--status-blue))"
          label="Sắp tới 7 ngày"
          value={`${summary.upcomingIn7DaysCount} khoản`}
          caption={`Tổng giá trị ${formatVndShort(summary.upcomingIn7DaysAmount)}`}
        />
        <MetricCard
          icon={CheckCircle2}
          dotColor="hsl(var(--status-green))"
          label="Đã ghi nhận"
          value={`${summary.recordedThisMonth} record`}
          caption="Trong tháng hiện tại"
        />
        <MetricCard
          icon={TriangleAlert}
          dotColor="hsl(var(--status-orange))"
          label="Cần chú ý"
          value={`${summary.attentionCount} mục`}
          caption="Cần kiểm tra hoặc cập nhật"
          dark
        />
      </div>
    </section>
  )
}

type SummaryAmountBoxProps = {
  label: string
  value: string
  caption: string
  tone: 'income' | 'outcome'
}

function SummaryAmountBox({ label, value, caption, tone }: SummaryAmountBoxProps) {
  const isIncome = tone === 'income'
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight
  const color = isIncome ? 'hsl(var(--status-green))' : 'hsl(var(--status-orange))'

  return (
    <div
      className="rounded-[22px] p-5"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 8%, hsl(var(--card)))` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color }}>
          {label}
        </p>
        <span
          className="grid size-9 place-items-center rounded-full bg-card/80"
          style={{ color }}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="money-number mt-4 text-3xl font-semibold tracking-[-0.04em]" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}

type MetricCardProps = {
  icon: typeof CalendarClock
  dotColor: string
  label: string
  value: string
  caption: string
  dark?: boolean
}

function MetricCard({ icon: Icon, dotColor, label, value, caption, dark = false }: MetricCardProps) {
  return (
    <Card
      className={cn(
        'group flex items-start justify-between transition hover:-translate-y-0.5',
        dark && 'border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--background))]',
      )}
    >
      <div>
        <div
          className={cn(
            'flex items-center gap-2 text-sm font-medium',
            dark ? 'text-[hsl(var(--background))]/60' : 'text-muted-foreground',
          )}
        >
          <span className="size-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
          {label}
        </div>
        <p className="money-number mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
        <p
          className={cn(
            'mt-1 text-sm',
            dark ? 'text-[hsl(var(--background))]/50' : 'text-muted-foreground',
          )}
        >
          {caption}
        </p>
      </div>
      <span
        className={cn(
          'grid size-10 place-items-center rounded-full transition group-hover:scale-105',
          dark ? 'bg-[hsl(var(--background))]/10' : 'bg-muted',
        )}
        style={{ color: dotColor }}
      >
        <Icon className="size-5" />
      </span>
    </Card>
  )
}
