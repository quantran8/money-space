import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import { formatVndShortLocal, type DebtSummary } from '@/features/debts/model/debts-form'

type DebtsSummaryStripProps = {
  summary: DebtSummary
}

export function DebtsSummaryStrip({ summary }: DebtsSummaryStripProps) {
  return (
    <SummaryStrip>
      <SummaryTile
        label="Đang nợ"
        value={`${formatVndShortLocal(summary.outstanding)} đ`}
        dotColor="hsl(var(--status-red))"
      />
      <SummaryTile
        label="Khoản đang mở"
        value={`${summary.activeCount} khoản`}
        dotColor="hsl(var(--status-orange))"
      />
      <SummaryTile
        label="Trả định kỳ"
        value={`${formatVndShortLocal(summary.monthlyPlanned)} đ`}
        dotColor="hsl(var(--status-blue))"
      />
      <SummaryTile label="Cần xem lại" value={`${summary.overdueCount} khoản`} inverted />
    </SummaryStrip>
  )
}
