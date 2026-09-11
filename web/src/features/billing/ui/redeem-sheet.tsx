import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { RedeemCodeForm } from '@/features/billing/ui/redeem-code-form'

/**
 * The activation-code field, in its own dialog.
 *
 * A sibling of `PaywallSheet` rather than something inside it: stacking two
 * dialogs traps focus, so `openRedeem` closes the paywall as it opens this.
 */
export function RedeemSheet() {
  const { t } = useTranslation()
  const open = usePaywallStore((store) => store.redeemOpen)
  const closeRedeem = usePaywallStore((store) => store.closeRedeem)
  const openPaywall = usePaywallStore((store) => store.openPaywall)
  const { isPremium } = useEntitlement()

  // Backing out without a code returns to the plans they were reading; a code
  // that worked has made them Premium, so there is no wall left to go back to.
  // Read at close rather than remembered from mount — this sheet lives in the
  // shell for the whole session, so any state captured at mount is stale.
  function handleClose() {
    closeRedeem()
    if (!isPremium) openPaywall({ reason: 'general' })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <ResponsiveDialogContent className="sm:max-w-[460px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="t-title">
            {t('billing.redeem.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t('billing.redeem.description')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* No auto-close on success: `onRedeemed` fires as the form switches to
            the screen that says what the code granted. */}
        <RedeemCodeForm withHeading={false} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
