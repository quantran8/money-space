import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

import { BottomSheet } from '@/components/ui'
import { RedeemCodeForm } from '@/features/billing/ui/redeem-code-form'

/**
 * The activation-code field, in its own sheet.
 *
 * A SIBLING of `PaywallSheet`, never nested: `openRedeem` closes the paywall as
 * it opens this, so the two are never stacked.
 */
export function RedeemSheet() {
  const { t } = useTranslation()
  const open = usePaywallStore((store) => store.redeemOpen)
  const closeRedeem = usePaywallStore((store) => store.closeRedeem)
  const openPaywall = usePaywallStore((store) => store.openPaywall)
  const { isPremium } = useEntitlement()

  /* Backing out without a code returns to the plans they were reading; a code
     that worked has made them Premium, so there is no wall left to go back to.
     Read at close rather than remembered from mount — this sheet lives in the
     tab layout for the whole session, so state captured at mount is stale. */
  function handleClose() {
    closeRedeem()
    if (!isPremium) openPaywall({ reason: 'general' })
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title={t('billing.redeem.title')}>
      <Text className="t-body-sm leading-5 text-ink2">{t('billing.redeem.description')}</Text>

      {/* No auto-close on success: the form switches to the screen that says
          what the code granted. */}
      <RedeemCodeForm withHeading={false} />
    </BottomSheet>
  )
}
