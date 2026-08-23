import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'
import type { CashflowDirection } from '@money-space/core/features/cashflow/model/cashflow.types'
import { formatMoney } from '@money-space/core/shared/lib/format-money'

import { BottomSheet, Button, CaveatNote, Select } from '@/components/ui'
import { settlementWalletOptions } from '@/features/cashflow/lib/wallet-options'
import { formatFullDate } from '@/features/forecast/lib/forecast-dates'

export type CompleteCashflowSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventName: string
  amount: number
  direction: CashflowDirection
  /** The occurrence being confirmed — the idempotency key, shown so the household knows which one. */
  occurrenceDate?: string
  /** The wallet stored on the event, when it has one. Pre-selected. */
  defaultAssetId?: string | null
  isSubmitting?: boolean
  onConfirm: (assetId: string) => void
}

/**
 * "Which wallet did this money move through?" — asked when confirming a
 * cashflow event.
 *
 * This exists because confirming without a wallet was silently a no-op: the
 * money event got written, but the debit and credit both had nothing to act on,
 * so the household confirmed "lương 20tr" and every balance stayed exactly
 * where it was. The backend now rejects that, and this is where the answer is
 * collected (memory/cashflow-events.md).
 *
 * Only assets that can actually settle are offered — `canSettleCashflow`, via
 * `settlementWalletOptions`. Offering a gold bar here would surface a 400 the
 * household cannot act on. Each option carries its balance, because *which
 * wallet can carry this* is the decision being made.
 *
 * The event may already name a wallet from when it was created — pre-selected,
 * so the common case is one tap.
 *
 * The primary button is NEVER disabled (§22.10). With no wallet chosen it says
 * what is missing rather than sitting dead with the reason invisible.
 */
export function CompleteCashflowSheet({
  open,
  onOpenChange,
  eventName,
  amount,
  direction,
  occurrenceDate,
  defaultAssetId,
  isSubmitting = false,
  onConfirm,
}: CompleteCashflowSheetProps) {
  const { t } = useTranslation()
  const { assets, asOf } = useAssets()

  const options = settlementWalletOptions(assets, asOf || AS_OF, (params) =>
    t('upcoming.complete.walletOption', params),
  )

  // Seeded once per mount rather than synced in an effect. The caller renders
  // this only while an occurrence is being confirmed, so a new occurrence is a
  // new mount — there is no stale selection to carry over.
  const [assetId, setAssetId] = useState<string>(() => {
    const stored = defaultAssetId ?? ''
    return options.some((option) => option.value === stored) ? stored : ''
  })
  const [missing, setMissing] = useState(false)

  function handleConfirm() {
    if (!assetId) {
      setMissing(true)
      return
    }
    onConfirm(assetId)
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={t('upcoming.complete.title')}
      footer={
        <View className="gap-2">
          <Button onPress={handleConfirm} loading={isSubmitting}>
            {t('upcoming.complete.submit')}
          </Button>
          <Button variant="secondary" onPress={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        <View>
          <Text className="text-[14px] leading-5 text-ink">
            {t('upcoming.complete.description', {
              name: eventName,
              amount: formatMoney(amount),
            })}
          </Text>
          {/* Which occurrence. A recurring event has many, and completing the
              wrong one advances the series past a month nobody paid. */}
          {occurrenceDate ? (
            <Text className="mt-1 font-mono text-[12px] text-ink3">
              {formatFullDate(occurrenceDate)}
            </Text>
          ) : null}
        </View>

        {options.length > 0 ? (
          <Select
            label={t(
              direction === 'incoming'
                ? 'upcoming.complete.walletIn'
                : 'upcoming.complete.walletOut',
            )}
            placeholder={t('upcoming.complete.walletPlaceholder')}
            value={assetId || null}
            options={options}
            onChange={(next) => {
              setAssetId(next)
              setMissing(false)
            }}
            error={missing ? t('upcoming.complete.walletRequired') : undefined}
          />
        ) : (
          // Nothing can settle this. Say why rather than showing an empty
          // picker the household would read as a bug.
          <CaveatNote>{t('upcoming.complete.noWallet')}</CaveatNote>
        )}
      </View>
    </BottomSheet>
  )
}
