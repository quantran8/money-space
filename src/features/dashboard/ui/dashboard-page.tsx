import { useTranslation } from 'react-i18next'

import { AppearGroup, AppearItem } from '@/components/ui/motion'
import { useDashboardPage } from '@/features/dashboard/hooks/use-dashboard-page'
import { AttentionSection } from '@/features/dashboard/ui/components/attention-section'
import { DebtsSection } from '@/features/dashboard/ui/components/debts-section'
import { LongTermGoalSection } from '@/features/dashboard/ui/components/long-term-goal-section'
import { MembersSection } from '@/features/dashboard/ui/components/members-section'
import { NetWorthHero } from '@/features/dashboard/ui/components/net-worth-hero'
import { RecentEventsSection } from '@/features/dashboard/ui/components/recent-events-section'

export function DashboardPage() {
  const { t } = useTranslation()
  const {
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
  } = useDashboardPage()

  if (!snapshot) {
    return <div className="px-1 text-sm text-muted-foreground">Loading dashboard...</div>
  }

  return (
    <AppearGroup className="space-y-4">
      <AppearItem>
        <div className="px-1">
          <h1 className="section-title text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            {t('dashboard.title')}
          </h1>
        </div>
      </AppearItem>

      <AppearItem>
        <NetWorthHero
          snapshot={snapshot}
          statusKey={statusKey}
          statusLineKey={statusLineKey}
          statusLabel={statusLabel}
          updatedAtLabel={updatedAtLabel}
          breakdown={breakdown}
          assetTrend={assetTrend}
        />
      </AppearItem>

      {/* Row 1 — this-week priority + most recent movement. */}
      <AppearItem>
        <div className="grid gap-4 lg:grid-cols-2">
          <AttentionSection payments={payments} attentionTotal={attentionTotal} />
          <RecentEventsSection moneyEvents={moneyEvents} subtitle={recentSubtitle} />
          <DebtsSection snapshot={snapshot} debts={debts} />
        </div>
      </AppearItem>

      {/* Row 2 — long-term plan + household members. */}
      <AppearItem>
        <div className="grid gap-4 lg:grid-cols-12">
          <LongTermGoalSection mainGoal={mainGoal} />
          <MembersSection members={members} subtitle={membersSubtitle} />
        </div>
      </AppearItem>
    </AppearGroup>
  )
}
