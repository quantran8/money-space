import { useTranslation } from 'react-i18next'

import { AppearGroup, AppearItem } from '@/components/ui/motion'
import { useDashboardPage } from '@/features/dashboard/hooks/use-dashboard-page'
import { AttentionSection } from '@/features/dashboard/ui/components/attention-section'
import { DashboardSkeleton } from '@/features/dashboard/ui/components/dashboard-skeleton'
import { LongTermGoalSection } from '@/features/dashboard/ui/components/long-term-goal-section'
import { MoneySection } from '@/features/dashboard/ui/components/money-section'
import { NetWorthHero } from '@/features/dashboard/ui/components/net-worth-hero'
import { RecentEventsSection } from '@/features/dashboard/ui/components/recent-events-section'

export function DashboardPage() {
  const { t } = useTranslation()
  const {
    snapshot,
    payments,
    mainGoal,
    moneyEvents,
    statusLabel,
    statusLineKey,
    updatedAtLabel,
    recentSubtitle,
    upcomingCount,
    upcomingTotalLabel,
    discussItem,
    discussCount,
    mainGoalRemaining,
    totalAssets,
    longTermValue,
    debtCount,
  } = useDashboardPage()

  if (!snapshot) {
    return <DashboardSkeleton />
  }

  return (
    <AppearGroup className="space-y-6">
      {/* 1. Hero — dark focal panel + supporting overview (mockup #overview). */}
      <AppearItem>
        <NetWorthHero
          snapshot={snapshot}
          statusLabel={statusLabel}
          statusLineKey={statusLineKey}
          updatedAtLabel={updatedAtLabel}
          upcomingCount={upcomingCount}
          discussCount={discussCount}
        />
      </AppearItem>

      {/* 2. Tiền nhà mình — liquidity + assets/debt (mockup #money). */}
      <AppearItem>
        <MoneySection
          snapshot={snapshot}
          totalAssets={totalAssets}
          longTermValue={longTermValue}
          debtCount={debtCount}
        />
      </AppearItem>

      {/* 3. Cần chú ý + Cần bàn (mockup #attention). */}
      <AppearItem>
        <AttentionSection
          payments={payments}
          upcomingCount={upcomingCount}
          upcomingTotalLabel={upcomingTotalLabel}
          discussItem={discussItem}
          discussCount={discussCount}
        />
      </AppearItem>

      {/* 4. Kế hoạch dài hạn (mockup #plan). */}
      <AppearItem>
        <LongTermGoalSection mainGoal={mainGoal} remaining={mainGoalRemaining} />
      </AppearItem>

      {/* 5. Gần đây (mockup #recent). */}
      <AppearItem>
        <RecentEventsSection
          moneyEvents={moneyEvents}
          subtitle={recentSubtitle || t('dashboard.sections.recent.subtitle')}
        />
      </AppearItem>

      {/* Footer note (mockup footer). */}
      <AppearItem>
        <p className="px-1 pb-2 text-center text-xs leading-5 text-[hsl(var(--muted-foreground))]">
          {t('dashboard.footerNote')}
        </p>
      </AppearItem>
    </AppearGroup>
  )
}
