import { useTranslation } from 'react-i18next'

import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview'
import {
  buildAssetBuckets,
  buildResponsibility,
  formatMonths,
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
    assets,
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
  const attentionTotal = formatVndShort(upcomingTotalVnd)
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

  // Where the money sits, folded into the four dashboard buckets (mockup
  // "Tiền đang ở đâu?"). Only non-empty buckets are shown so the segmented bar
  // and legend stay honest when a household holds just one or two classes.
  const { buckets: assetBuckets, total: assetBucketTotal } = buildAssetBuckets(assets)
  const visibleAssetBuckets = assetBuckets.filter((bucket) => bucket.value > 0)

  // Who is on the hook for the upcoming payments (mockup "Ai đang phụ trách?").
  const { rows: responsibility, unassigned: unassignedPayments } = buildResponsibility(payments)

  // "Cần cùng xem" topics (mockup): payments still needing a funding source
  // (status `important`) surface first, then the single most material open item
  // (largest debt or the main goal) from `discussItem`. Capped at two.
  const discussTopics = [
    ...payments
      .filter((payment) => payment.status === 'important')
      .map((payment) => ({
        to: '/payments',
        title: t('dashboard.sections.discuss.title'),
        line: t('dashboard.redesign.upcoming.status.important') + ' · ' + payment.name,
      })),
    ...(discussItem ? [discussItem] : []),
  ].slice(0, 2)

  // "Tiền sẵn có" card (mockup): what's usable now, what's due in the window,
  // and what we expect to be left after those are paid.
  const availableNow = snapshot.liquid
  const availableRemaining = Math.max(0, availableNow - upcomingTotalVnd)
  const availableUsedRatio =
    availableNow > 0 ? Math.min(100, Math.round((availableRemaining / availableNow) * 100)) : 0

  // Emergency-fund runway: how many months of near-term obligations the reserve
  // covers. Derived from the reserve vs. the 30-day due total (our best proxy
  // for monthly essentials, since the MVP has no dedicated spend figure).
  const monthlyEssentials = upcomingTotalVnd > 0 ? upcomingTotalVnd : 0
  const reserveMonths = monthlyEssentials > 0 ? snapshot.savings / monthlyEssentials : 0
  const reserveMonthsLabel = reserveMonths > 0 ? formatMonths(reserveMonths) : null
  const reserveGood = reserveMonths >= 3

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
    // Redesign additions
    assetBuckets: visibleAssetBuckets,
    assetBucketTotal,
    responsibility,
    unassignedPayments,
    discussTopics,
    goals,
    upcomingTotalVnd,
    availableNow,
    availableRemaining,
    availableUsedRatio,
    reserveMonthsLabel,
    reserveGood,
  } as const
}
