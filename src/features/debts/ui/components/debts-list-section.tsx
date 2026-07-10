import { Card } from '@/components/ui/card'
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
}

export function DebtsListSection({
  debts,
  members,
  assets,
  isLoading,
  isUpdating,
  onEdit,
  onMarkPaidOff,
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
              />
            )
          })}
      </div>
    </Card>
  )
}
