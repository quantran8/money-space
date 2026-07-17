import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DebtListItem } from '@/features/debts/ui/components/debt-list-item'
import type { Asset } from '@/features/assets/model/assets.types'
import type { DebtItem, DebtStatus } from '@/features/debts/model/debts.types'
import type { MemberItem } from '@/features/members/model/members.types'
import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'

type DebtsListSectionProps = {
  debts: DebtItem[]
  members: MemberItem[]
  assets: Asset[]
  payments: UpcomingPaymentItem[]
  isLoading: boolean
  isUpdating: boolean
  onEdit: (id: string) => void
  onMarkPaidOff: (id: string) => void
  onViewDetail: (id: string) => void
  onDelete: (id: string) => void
}

type StatusFilter = 'all' | DebtStatus

export function DebtsListSection({
  debts,
  members,
  payments,
  isLoading,
  isUpdating,
  onEdit,
  onMarkPaidOff,
  onViewDetail,
  onDelete,
}: DebtsListSectionProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const visibleDebts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('vi')
    return debts.filter((debt) => {
      if (status !== 'all' && debt.status !== status) return false
      if (!needle) return true
      return `${debt.name} ${debt.lenderName}`.toLocaleLowerCase('vi').includes(needle)
    })
  }, [debts, query, status])

  function nextPaymentFor(debtId: string) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return payments
      .filter((payment) => payment.debtId === debtId)
      .filter((payment) => new Date(`${payment.dueDate ?? payment.due}T00:00:00`) >= now)
      .sort((a, b) => (a.dueDate ?? a.due).localeCompare(b.dueDate ?? b.due))[0]
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Các khoản đang phải trả</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm khoản nợ..."
              className="rounded-xl bg-muted/40 pl-11"
            />
          </label>
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <SelectTrigger className="rounded-xl sm:w-48" aria-label="Lọc trạng thái">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang trả</SelectItem>
              <SelectItem value="overdue">Quá hạn</SelectItem>
              <SelectItem value="paused">Tạm dừng</SelectItem>
              <SelectItem value="paid_off">Đã xong</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 divide-y divide-border">
        {isLoading ? Array.from({ length: 3 }).map((_, index) => <DebtListItemSkeleton key={index} />) : null}
        {!isLoading && visibleDebts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {debts.length === 0 ? 'Chưa có khoản nợ nào.' : 'Không tìm thấy khoản nợ phù hợp.'}
          </div>
        ) : null}
        {!isLoading && visibleDebts.map((debt) => (
          <DebtListItem
            key={debt.id}
            debt={debt}
            ownerName={members.find((member) => member.id === debt.ownerMemberId)?.name}
            nextPayment={nextPaymentFor(debt.id)}
            isUpdating={isUpdating}
            onEdit={onEdit}
            onMarkPaidOff={onMarkPaidOff}
            onViewDetail={onViewDetail}
            onDelete={onDelete}
          />
        ))}
      </div>
    </Card>
  )
}

function DebtListItemSkeleton() {
  return (
    <div className="grid gap-5 py-6 first:pt-0 xl:grid-cols-[1.3fr_.8fr_.7fr_110px] xl:items-center">
      <div className="space-y-2"><Skeleton className="h-5 w-44" /><Skeleton className="h-4 w-64" /></div>
      <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-2 w-full" /></div>
      <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-32" /></div>
      <Skeleton className="h-9 w-24" />
    </div>
  )
}
