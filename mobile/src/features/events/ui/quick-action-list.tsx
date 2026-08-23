import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { QuickAction } from '@money-space/core/features/events/model/events-form'

import { TOUCH_TARGET } from '@/theme/tokens'

/** The real quick actions, plus the three that hand over to another feature. */
type PickerKey = QuickAction | 'buy_asset' | 'sell_asset'

const ACTIONS: PickerKey[] = [
  'upcoming',
  'expense',
  'income',
  'transfer',
  'debt_borrow',
  'buy_asset',
  'sell_asset',
]

/**
 * "Bạn muốn cập nhật gì?" — the first step of the record sheet.
 *
 * A plain list of labels on `--sunk`, no icons and no helper line under each
 * entry: §18 keeps icons out of list rows and §22.0 counts a subtitle per row
 * as an admin-form signal. The label alone says what each one does.
 *
 * Four of these seven do not write a money event at all. Buying and selling an
 * asset move a holding, borrowing creates a debt, and an expected payment is a
 * cashflow event that `/upcoming` owns end to end — so each hands over to the
 * feature that owns the write rather than faking the row here.
 */
export function QuickActionList({
  onSelect,
  onBorrowMoney,
  onBuyAsset,
  onSellAsset,
  onPlanUpcoming,
}: {
  onSelect: (action: QuickAction) => void
  onBorrowMoney: () => void
  onBuyAsset: () => void
  onSellAsset: () => void
  onPlanUpcoming: () => void
}) {
  const { t } = useTranslation()

  function handlePress(action: PickerKey) {
    if (action === 'debt_borrow') return onBorrowMoney()
    if (action === 'buy_asset') return onBuyAsset()
    if (action === 'sell_asset') return onSellAsset()
    if (action === 'upcoming') return onPlanUpcoming()
    return onSelect(action)
  }

  return (
    <View className="gap-1.5">
      {ACTIONS.map((action) => (
        <Pressable
          key={action}
          onPress={() => handlePress(action)}
          accessibilityRole="button"
          style={{ minHeight: TOUCH_TARGET + 2 }}
          className="justify-center rounded-sunk bg-sunk px-4 active:bg-interactive-soft"
        >
          <Text className="text-[15px] text-ink">{t(`events.form.action.${action}`)}</Text>
        </Pressable>
      ))}
    </View>
  )
}
