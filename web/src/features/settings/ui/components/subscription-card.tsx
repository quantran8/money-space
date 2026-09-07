import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip } from '@/components/ui/status-chip'

/** `2027-12-31T00:00:00Z` → `31/12/2027`. */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * What plan the household is on. Read-only for now — the screen that changes it
 * arrives with redeem codes.
 *
 * Every figure comes from the server's `limits`, never a literal: "2 mục tiêu"
 * is `limits.goals`, so moving the ceiling is a backend edit and this card
 * follows without a release.
 */
export function SubscriptionCard() {
  const { t } = useTranslation()
  const { entitlement, isPremium, isLoading } = useEntitlement()

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader title={t('settings.billing.eyebrow')} />
        <Skeleton className="s-head-body h-6 w-48" />
      </Panel>
    )
  }
  if (!entitlement) return null

  const { isLifetime, isTrial, status, expiresAt, daysRemaining, limits } = entitlement

  const title = isLifetime
    ? t('settings.billing.lifetime')
    : isTrial
      ? t('settings.billing.trial')
      : isPremium
        ? t('settings.billing.premium')
        : t('settings.billing.free')

  // A lapsed plan says so with its date rather than reporting "Free": the
  // household had Premium, and naming the day it ended is what makes renewing
  // an obvious next step.
  const hasLapsed = entitlement.tier === 'premium' && status === 'expired'

  return (
    <Panel>
      <PanelHeader
        title={t('settings.billing.eyebrow')}
        meta={t('settings.billing.forBothOfYou')}
      />

      <div className="s-head-body">
        <p className="t-subtitle">{title}</p>

        {isLifetime ? null : hasLapsed && expiresAt ? (
          <StatusChip tone="attention" className="mt-2">
            {t('settings.billing.expiredOn', { date: formatDate(expiresAt) })}
          </StatusChip>
        ) : isPremium && expiresAt ? (
          <p className="mt-2 t-body-sm text-ink2">
            {t('settings.billing.activeUntil', { date: formatDate(expiresAt) })}
            {daysRemaining !== null
              ? ` · ${t('settings.billing.daysRemaining', { count: daysRemaining })}`
              : ''}
          </p>
        ) : null}

        {!isPremium ? (
          <p className="mt-2 t-body-sm leading-5 text-ink2">
            {limits && limits.goals !== null && limits.whatIfPerMonth !== null
              ? t('settings.billing.freeDescription', {
                  goals: limits.goals,
                  whatIf: limits.whatIfPerMonth,
                })
              : t('settings.billing.freeDescriptionUnlimited')}
          </p>
        ) : null}
      </div>
    </Panel>
  )
}
