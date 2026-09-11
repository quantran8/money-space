import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@money-space/core/shared/lib/utils'
import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

/**
 * What plan the space is on, as one word. Opens the paywall sheet — the plan
 * picker already exists there and is reachable from every screen, so this is
 * one more door into it rather than a second copy of the same list.
 */
export function PlanPill() {
  const { t } = useTranslation()
  const { entitlement, isPremium, isLoading } = useEntitlement()
  const openPaywall = usePaywallStore((store) => store.openPaywall)

  if (isLoading) return <Skeleton className="h-9 w-24 rounded-pill" />
  if (!entitlement) return null

  // A lapsed plan gets the sheet's "hết hạn ngày X" headline instead of the
  // generic one.
  const hasLapsed = entitlement.tier === 'premium' && entitlement.status === 'expired'

  // Lifetime has nothing to buy, so the pill states the fact and stops being a
  // control — the sheet would offer plans to someone who already owns forever.
  const isStatic = entitlement.isLifetime

  // Whether the household already has Premium. The crown is on the pill either
  // way — what changes is the tone: amber offers it, neutral states it.
  const hasPremium = isPremium || entitlement.isLifetime || entitlement.isTrial

  const label = entitlement.isLifetime
    ? t('settings.billing.lifetime')
    : entitlement.isTrial
      ? t('settings.billing.trial')
      : isPremium
        ? t('settings.billing.premium')
        : t('settings.billing.free')

  if (isStatic) {
    return (
      <p className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-pill bg-wash px-3 t-caption text-ink2">
        <Crown className="size-3.5 shrink-0" strokeWidth={1.75} />
        {label}
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={() =>
        openPaywall({
          reason: hasLapsed ? 'expired' : isPremium ? 'manage' : 'general',
        })
      }
      aria-label={t('settings.billing.viewPlan', { plan: label })}
      className={cn(
        's-tap inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-pill px-3 t-caption transition-colors focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
        // A plan that needs buying wears the amber; one already paid for is a
        // neutral status label, not an offer.
        // Amber ink on the card surface, not on `attention-soft`: that pairing
        // is 4.4:1, just under AA, and this is 12px text.
        hasPremium
          ? 'bg-wash text-ink2 hover:bg-committed hover:text-ink'
          : 'bg-card text-attention-ink ring-1 ring-attention hover:bg-attention-soft',
      )}
    >
      <Crown className="size-3.5 shrink-0" strokeWidth={1.75} />
      {label}
    </button>
  )
}
