import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { PurchaseState } from '@money-space/core/features/billing/hooks/use-store-purchase'

/**
 * What an in-app purchase is doing, in words. `slow` is not `failed` — the
 * money arrived and the grant is coming. See memory/billing.md.
 */
export function PurchaseStatus({ state }: { state: PurchaseState }) {
  const { t } = useTranslation()

  if (state.status === 'idle' || state.status === 'purchasing') return null

  // Anything that must be READ takes an `*-ink` token; the bare tones are fills.
  const tone = {
    confirming: 'text-ink2',
    pending: 'text-attention-ink',
    restoreEmpty: 'text-ink2',
    done: 'text-positive-ink',
    slow: 'text-attention-ink',
    failed: 'text-alert-ink',
  }[state.status]

  return (
    <Text className={`mt-4 t-body-sm ${tone}`}>
      {t(`billing.paywall.store.${state.status}`)}
    </Text>
  )
}
