import { useTranslation } from 'react-i18next'

import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview'
import {
  formatCompactMillions,
  parseCompactMillions,
  shortDate,
  statusVariantFor,
  type NetWorthBreakdownItem,
} from '@/features/dashboard/model/dashboard'
import { useMembers } from '@/features/members/hooks/use-members'

export function useDashboardPage() {
  const { t } = useTranslation()
  const { members } = useMembers()
  const {
    snapshot,
    payments,
    debts,
    goals,
    assetGroups,
    recentEvents: moneyEvents,
    assetTrend,
  } = useDashboardOverview()

  if (!snapshot) {
    return { snapshot: undefined } as const
  }

  const mainGoal = goals[0]

  const statusVariant = statusVariantFor(snapshot.attentionCount)
  const statusKey = `dashboard.status.${statusVariant}`
  const statusLineKey = `dashboard.hero.statusLine.${statusVariant}`
  const statusLabel = t(statusKey)
  const updatedAtLabel = t('dashboard.updatedAt', { date: shortDate(snapshot.updatedAt) })

  const activeMembers = members.filter((member) => member.status === 'active')
  const invitedMembers = members.filter((member) => member.status === 'invited')
  const membersSubtitle = t('members.list.title', {
    active: activeMembers.length,
    invited: invitedMembers.length,
  })

  const attentionTotal = formatCompactMillions(
    payments.reduce(
      (sum, payment) => sum + (payment.amountValue ?? parseCompactMillions(payment.amount)),
      0,
    ) / 1_000_000,
  )

  // The hero breaks the total down into the three liquidity buckets so the user
  // sees not just how much, but where the money sits. Sourced from the same
  // asset groups the assets page uses; each row links into the assets detail.
  const breakdown: NetWorthBreakdownItem[] = [
    { label: t('dashboard.sections.money.liquid'), value: assetGroups[0]?.valueDisplay ?? '0M' },
    { label: t('dashboard.sections.money.reserve'), value: assetGroups[1]?.valueDisplay ?? '0M' },
    { label: t('assets.strip.longTerm'), value: assetGroups[2]?.valueDisplay ?? '0M' },
  ]

  const recentSubtitle = moneyEvents[0]
    ? `${moneyEvents[0].title} · ${moneyEvents[0].date}`
    : ''

  return {
    snapshot,
    members,
    payments,
    debts,
    mainGoal,
    moneyEvents,
    assetTrend,
    statusKey,
    statusLineKey,
    statusLabel,
    updatedAtLabel,
    membersSubtitle,
    recentSubtitle,
    attentionTotal,
    breakdown,
  } as const
}
