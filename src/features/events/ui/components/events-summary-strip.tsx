import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import { formatVndShort } from '@/shared/lib/format-money'

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
  return (
    <SummaryStrip>
      <SummaryTile
        label="Sắp tới 7 ngày"
        value={`${summary.upcomingIn7DaysCount} khoản · ${formatVndShort(summary.upcomingIn7DaysAmount)}`}
        dotColor="hsl(var(--status-blue))"
      />
      <SummaryTile
        label="Đã ghi nhận tháng này"
        value={`${summary.recordedThisMonth} record`}
        dotColor="hsl(var(--status-green))"
      />
      <SummaryTile
        label="Tổng thu tháng này"
        value={`+${formatVndShort(summary.totalIncome)}`}
        dotColor="hsl(var(--status-green))"
      />
      <SummaryTile
        label="Tổng chi tháng này"
        value={`-${formatVndShort(summary.totalOutcome)}`}
        dotColor="hsl(var(--status-red))"
      />
      <SummaryTile
        label="Cần chú ý"
        value={`${summary.attentionCount} mục`}
        dotColor="hsl(var(--status-orange))"
      />
      <SummaryTile
        label="Net change tháng này"
        value={`${summary.netChange >= 0 ? '+' : '-'}${formatVndShort(Math.abs(summary.netChange))}`}
        inverted
      />
    </SummaryStrip>
  )
}
