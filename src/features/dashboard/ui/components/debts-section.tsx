import { Link } from 'react-router-dom'

import type { DashboardOverview } from '@/features/dashboard/api/dashboard.repository'
import type { DebtItem } from '@/features/debts/model/debts.types'
import { SectionCard } from '@/features/dashboard/ui/components/section-card'

type DebtsSectionProps = {
  snapshot: DashboardOverview
  debts: DebtItem[]
}

export function DebtsSection({ snapshot, debts }: DebtsSectionProps) {
  return (
    <SectionCard
      title="Đang nợ"
      subtitle="Các khoản nên nhìn tách riêng khỏi tài sản"
      to="/debts"
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-[hsl(var(--muted))] px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
              Tổng còn nợ
            </p>
            <p className="money-number mt-1 text-lg">{snapshot.debt} đ</p>
          </div>

          <div className="rounded-[24px] bg-[hsl(var(--muted))] px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
              Khoản đang mở
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">
              {debts.length} khoản
            </p>
          </div>
        </div>

        <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]">
          {debts.slice(0, 3).map((debt) => (
            <Link
              key={debt.id}
              to="/debts"
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium tracking-[-0.01em]">{debt.name}</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {debt.lenderName} · {debt.expectedFinalDueDate ?? 'Linh hoạt'}
                </p>
              </div>
              <span className="money-number shrink-0 text-base text-[hsl(var(--status-red))]">
                {debt.outstandingAmount}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
