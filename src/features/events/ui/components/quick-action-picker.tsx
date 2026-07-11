import {
  ArrowLeftRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarClock,
  Goal,
  HandCoins,
  Landmark,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { QuickAction } from '@/features/events/model/events-form'

/** Picker entries include the real quick actions plus secondary navigations. */
type PickerKey = QuickAction | 'sell_asset'

type QuickActionPickerProps = {
  onSelect: (action: QuickAction) => void
  onBorrowMoney: () => void
  onSellAsset: () => void
}

const ACTIONS: [PickerKey, string, string, LucideIcon][] = [
  ['upcoming', 'Khoản sắp tới', 'Có khoản cần chuẩn bị', CalendarClock],
  ['expense', 'Đã chi / đã trả', 'Ghi nhận một khoản tiền ra', BanknoteArrowDown],
  ['income', 'Nhận tiền', 'Lương, thưởng hoặc khoản tiền vào', BanknoteArrowUp],
  ['transfer', 'Chuyển tiền', 'Chuyển giữa tài khoản/quỹ', ArrowLeftRight],
  ['debt_borrow', 'Vay tiền', 'Tạo khoản vay và theo dõi trong mục đang nợ', Landmark],
  ['sell_asset', 'Bán tài sản', 'Bán tài sản trong mục tài sản', HandCoins],
  ['goal_contribution', 'Góp mục tiêu', 'Thêm tiền vào mục tiêu chung', Goal],
]

export function QuickActionPicker({ onSelect, onBorrowMoney, onSellAsset }: QuickActionPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ACTIONS.map(([action, title, subtitle, Icon]) => (
        <button
          key={action}
          type="button"
          onClick={() => {
            if (action === 'debt_borrow') {
              onBorrowMoney()
              return
            }
            if (action === 'sell_asset') {
              onSellAsset()
              return
            }
            onSelect(action)
          }}
          className="rounded-3xl border border-border bg-card p-4 text-left transition hover:bg-[hsl(var(--muted))]/40"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
            <Icon className="size-5" strokeWidth={1.8} />
          </div>
          <p className="mt-4 text-base font-semibold tracking-[-0.02em]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </button>
      ))}
    </div>
  )
}
