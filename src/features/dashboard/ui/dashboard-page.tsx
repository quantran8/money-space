import { useTranslation } from 'react-i18next'

import { AppearGroup, AppearItem } from '@/components/ui/motion'
import { useDashboardPage } from '@/features/dashboard/hooks/use-dashboard-page'
import { AssetsBreakdownSection } from '@/features/dashboard/ui/components/assets-breakdown-section'
import { DashboardSkeleton } from '@/features/dashboard/ui/components/dashboard-skeleton'
import { DiscussSection } from '@/features/dashboard/ui/components/discuss-section'
import { LongTermGoalSection } from '@/features/dashboard/ui/components/long-term-goal-section'
import { NetWorthHero } from '@/features/dashboard/ui/components/net-worth-hero'
import { RecentEventsSection } from '@/features/dashboard/ui/components/recent-events-section'
import { ResponsibilitySection } from '@/features/dashboard/ui/components/responsibility-section'
import { UpcomingPaymentsSection } from '@/features/dashboard/ui/components/upcoming-payments-section'

export function DashboardPage() {
  const { t } = useTranslation()
  const {
    snapshot,
    payments,
    goals,
    moneyEvents,
    statusVariant,
    updatedAtLabel,
    recentSubtitle,
    upcomingCount,
    totalAssets,
    availableNow,
    availableRemaining,
    availableUsedRatio,
    upcomingTotalVnd,
    reserveMonthsLabel,
    reserveGood,
    assetBuckets,
    responsibility,
    unassignedPayments,
    discussTopics,
  } = useDashboardPage()

  if (!snapshot) {
    return <DashboardSkeleton />
  }

  return (
    <AppearGroup className="space-y-5">
      {/* Page title (mockup page header). */}
      <AppearItem>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm text-[hsl(var(--muted-foreground))]">
              {t('dashboard.redesign.eyebrow')}
            </p>
            <h1 className="page-title text-3xl font-semibold sm:text-4xl">
              {t(`dashboard.redesign.pageTitle.${statusVariant}`)}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="size-2 rounded-full bg-[hsl(var(--status-green))]" />
            {updatedAtLabel}
          </div>
        </div>
      </AppearItem>

      {/* Net worth + Tiền sẵn có (mockup summary). */}
      <AppearItem>
        <NetWorthHero
          snapshot={snapshot}
          statusVariant={statusVariant}
          totalAssets={totalAssets}
          availableNow={availableNow}
          availableRemaining={availableRemaining}
          availableUsedRatio={availableUsedRatio}
          upcomingTotalVnd={upcomingTotalVnd}
          reserveMonthsLabel={reserveMonthsLabel}
          reserveGood={reserveGood}
        />
      </AppearItem>

      {/* Assets breakdown + upcoming payments (mockup content grid). */}
      <AppearItem>
        <section className="grid gap-4 xl:grid-cols-12">
          <AssetsBreakdownSection buckets={assetBuckets} />
          <UpcomingPaymentsSection payments={payments} upcomingCount={upcomingCount} />
        </section>
      </AppearItem>

      {/* Discuss + goals + responsibility (mockup lower grid). */}
      <AppearItem>
        <section className="grid gap-4 xl:grid-cols-12">
          <DiscussSection topics={discussTopics} />
          <LongTermGoalSection goals={goals} />
          <ResponsibilitySection rows={responsibility} unassigned={unassignedPayments} />
        </section>
      </AppearItem>

      {/* Recent money events table (mockup #recent). */}
      <AppearItem>
        <RecentEventsSection
          moneyEvents={moneyEvents}
          subtitle={recentSubtitle || t('dashboard.redesign.events.subtitle')}
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
