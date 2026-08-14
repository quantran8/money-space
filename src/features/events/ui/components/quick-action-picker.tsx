import { useTranslation } from 'react-i18next'

import type { QuickAction } from '@/features/events/model/events-form'

/** Picker entries include the real quick actions plus secondary navigations. */
type PickerKey = QuickAction | 'sell_asset'

type QuickActionPickerProps = {
  onSelect: (action: QuickAction) => void
  onBorrowMoney: () => void
  onSellAsset: () => void
}

const ACTIONS: PickerKey[] = [
  'upcoming',
  'expense',
  'income',
  'transfer',
  'debt_borrow',
  'sell_asset',
  'goal_contribution',
]

/**
 * A plain list of labels on `--sunk`.
 *
 * This was a seven-card grid, each card carrying an icon tile and a subtitle.
 * Two rules ruled that out: §18 allows icons only in the sidebar and on
 * buttons — never in list rows — and §22.0 counts a helper line under every
 * entry as an admin-form signal. The label alone says what each one does.
 */
export function QuickActionPicker({
  onSelect,
  onBorrowMoney,
  onSellAsset,
}: QuickActionPickerProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1.5">
      {ACTIONS.map((action) => (
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
          className="flex min-h-[46px] items-center rounded-[10px] bg-sunk px-4 text-left text-[15px] text-ink transition-colors hover:bg-accent-soft"
        >
          {t(`events.form.action.${action}`)}
        </button>
      ))}
    </div>
  )
}
