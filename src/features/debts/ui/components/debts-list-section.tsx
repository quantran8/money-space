import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DebtListItem } from '@/features/debts/ui/components/debt-list-item'
import type { Asset } from '@/features/assets/model/assets.types'
import type { DebtItem } from '@/features/debts/model/debts.types'
import type { MemberItem } from '@/features/members/model/members.types'

type DebtsListSectionProps = {
  debts: DebtItem[]
  members: MemberItem[]
  assets: Asset[]
  isLoading: boolean
  isUpdating: boolean
  onEdit: (id: string) => void
  onMarkPaidOff: (id: string) => void
  onViewDetail: (id: string) => void
  onDelete: (id: string) => void
}

export function DebtsListSection({
  debts,
  members,
  assets,
  isLoading,
  isUpdating,
  onEdit,
  onMarkPaidOff,
  onViewDetail,
  onDelete,
}: DebtsListSectionProps) {
  return (
    <Card className="p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title text-xl font-semibold md:text-2xl">Danh sách khoản nợ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mỗi khoản cho biết đang nợ ai, còn bao nhiêu và tiền vay đã nhận vào đâu.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => <DebtListItemSkeleton key={index} />)
          : null}
        {!isLoading &&
          debts.map((debt) => {
            const ownerName = members.find((member) => member.id === debt.ownerMemberId)?.name
            const receivedToAssetName = assets.find(
              (asset) => asset.id === debt.receivedToAssetId,
            )?.name

            return (
              <DebtListItem
                key={debt.id}
                debt={debt}
                ownerName={ownerName}
                receivedToAssetName={receivedToAssetName}
                isUpdating={isUpdating}
                onEdit={onEdit}
                onMarkPaidOff={onMarkPaidOff}
                onViewDetail={onViewDetail}
                onDelete={onDelete}
              />
            )
          })}
      </div>
    </Card>
  )
}

function DebtListItemSkeleton() {
  return (
    <article className="rounded-[28px] border border-border/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="size-10 rounded-full" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-4 w-56 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>

          <Skeleton className="mt-3 h-4 w-3/4 rounded-full" />
        </div>

        <div className="lg:w-[220px]">
          <Skeleton className="h-8 w-32 rounded-full lg:ml-auto" />
          <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  )
}
