import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { QuickAction } from '@money-space/core/features/events/model/events-form'

/** Picker entries include the real quick actions plus secondary navigations. */
type PickerKey = QuickAction | 'buy_asset' | 'sell_asset' | 'upcoming'

type QuickActionPickerProps = {
  onSelect: (action: QuickAction) => void
  onBorrowMoney: () => void
  /** Opens the asset form already set to "just bought" — coming in from here
   *  means a purchase is being recorded, not a holding declared. */
  onBuyAsset: () => void
  onSellAsset: () => void
  /** Leaves for `/upcoming` — an expected movement is a cashflow event, which
   *  this ledger page does not own. */
  onPlanUpcoming: () => void
}

const ACTION_GROUPS: Array<{
  labelKey: string
  actions: Array<{ key: PickerKey; icon: LucideIcon }>
}> = [
  {
    labelKey: 'events.form.actionGroup.cashflow',
    actions: [
      // Temporarily hidden from this picker:
      // { key: 'upcoming', icon: CalendarClock },
      { key: 'expense', icon: ArrowUpRight },
      { key: 'income', icon: ArrowDownLeft },
      { key: 'transfer', icon: ArrowLeftRight },
    ],
  },
  // Temporarily hidden from this picker:
  // {
  //   labelKey: 'events.form.actionGroup.assetsDebts',
  //   actions: [
  //     { key: 'debt_borrow', icon: Landmark },
  //     { key: 'buy_asset', icon: PackagePlus },
  //     { key: 'sell_asset', icon: PackageMinus },
  //   ],
  // },
]

/**
 * Two short action groups: cash flow first, then balance-sheet changes. Each
 * row is a button, so its icon and chevron communicate the kind of update and
 * that choosing it advances to the next step without adding helper copy.
 */
export function QuickActionPicker({
  onSelect,
  onBorrowMoney,
  onBuyAsset,
  onSellAsset,
  onPlanUpcoming,
}: QuickActionPickerProps) {
  const { t } = useTranslation()

  function handleAction(action: PickerKey) {
    if (action === 'debt_borrow') {
      onBorrowMoney()
      return
    }
    if (action === 'sell_asset') {
      onSellAsset()
      return
    }
    if (action === 'buy_asset') {
      onBuyAsset()
      return
    }
    if (action === 'upcoming') {
      onPlanUpcoming()
      return
    }
    onSelect(action)
  }

  return (
    <div>
      {ACTION_GROUPS.map((group, groupIndex) => (
        <section key={group.labelKey} aria-labelledby={`event-action-group-${groupIndex}`}>
          {groupIndex > 0 ? <div className="mx-3 my-2 h-px bg-divider" /> : null}
          <h3
            id={`event-action-group-${groupIndex}`}
            className="px-3 pb-2 pt-1 t-caption font-medium text-ink3"
          >
            {t(group.labelKey)}
          </h3>

          {group.actions.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleAction(key)}
              className="group flex h-12 w-full items-center gap-3 rounded-control px-3 text-left t-body font-normal text-ink outline-none transition-colors hover:bg-wash focus-visible:bg-wash focus-visible:shadow-[0_0_0_3px_rgba(115,164,215,0.16)]"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-canvas text-ink2">
                <Icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 truncate">{t(`events.form.action.${key}`)}</span>
              <ChevronRight
                className="size-4 shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.75}
              />
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}
