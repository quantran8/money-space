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
import { formatVndShort } from '@/shared/lib/format-money'

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
    isLoading,
  } = useDashboardOverview()

  // Keep the skeleton up until EVERY underlying query has resolved — not just
  // the dashboard snapshot. The snapshot query can finish before assets /
  // payments / goals / etc., and rendering on `!snapshot` alone would flash the
  // page with empty breakdown/lists before those fill in.
  if (isLoading || !snapshot) {
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

  const upcomingTotalVnd = payments.reduce(
    (sum, payment) =>
      sum + (payment.amountValue ?? parseCompactMillions(payment.amount) * 1_000_000),
    0,
  )
  const attentionTotal = formatCompactMillions(upcomingTotalVnd / 1_000_000)
  const upcomingCount = payments.length
  const upcomingTotalLabel = formatVndShort(upcomingTotalVnd)

  // "Cần bàn" (needs discussion) has no dedicated feature yet, so we surface the
  // single most material open item to talk about: the largest open debt if one
  // exists, otherwise the main long-term goal. Wired to real data per product.
  const openDebts = debts.filter((debt) => debt.status !== 'paid_off')
  const largestOpenDebt = [...openDebts].sort(
    (a, b) => b.outstandingAmountValue - a.outstandingAmountValue,
  )[0]
  const discussItem = largestOpenDebt
    ? {
        to: '/debts',
        title: largestOpenDebt.name,
        line: t('dashboard.sections.discuss.debtLine', {
          amount: formatVndShort(largestOpenDebt.outstandingAmountValue),
        }),
      }
    : mainGoal
      ? {
          to: '/goals',
          title: mainGoal.name,
          line: t('dashboard.sections.discuss.goalLine'),
        }
      : null
  const discussCount = discussItem ? 1 : 0

  // Long-term goal supporting numbers for the plan section.
  const mainGoalTarget = mainGoal?.targetAmount ?? 0
  const mainGoalCurrent = mainGoal?.currentAmount ?? 0
  const mainGoalRemaining = Math.max(0, mainGoalTarget - mainGoalCurrent)

  // Money section: total assets = net worth + debt; long-term bucket from the
  // asset groups; count of currently open debts.
  const totalAssets = snapshot.netWorth + snapshot.debt
  const longTermValue = assetGroups[2]?.value ?? 0
  const debtCount = openDebts.length

  // The hero breaks the total down into the three liquidity buckets so the user
  // sees not just how much, but where the money sits. Sourced from the same
  // asset groups the assets page uses; each row links into the assets detail.
  const breakdown: NetWorthBreakdownItem[] = [
    { label: t('dashboard.sections.money.liquid'), value: formatVndShort(assetGroups[0]?.value ?? 0) },
    { label: t('dashboard.sections.money.reserve'), value: formatVndShort(assetGroups[1]?.value ?? 0) },
    { label: t('assets.strip.longTerm'), value: formatVndShort(assetGroups[2]?.value ?? 0) },
  ]

  const recentSubtitle = moneyEvents[0]
    ? `${
        moneyEvents[0].note?.trim() ||
        t(`options.eventCategory.${moneyEvents[0].category}`, {
          defaultValue: moneyEvents[0].category,
        })
      } · ${moneyEvents[0].date}`
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
    // New layout fields
    statusVariant,
    upcomingCount,
    upcomingTotalLabel,
    discussItem,
    discussCount,
    mainGoalRemaining,
    totalAssets,
    longTermValue,
    debtCount,
  } as const
}
