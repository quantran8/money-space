import { useTranslation } from 'react-i18next'

import { AppearGroup, AppearItem } from '@/components/ui/motion'
import { useDashboardPage } from '@/features/dashboard/hooks/use-dashboard-page'
import { DashboardSkeleton } from '@/features/dashboard/ui/components/dashboard-skeleton'
import { DaysAheadSection } from '@/features/dashboard/ui/components/days-ahead-section'
import { FinancialStateSection } from '@/features/dashboard/ui/components/financial-state-section'
import { FlexibleMoneySection } from '@/features/dashboard/ui/components/flexible-money-section'
import { MoneyLocationSection } from '@/features/dashboard/ui/components/money-location-section'
import { WhatIfCtaSection } from '@/features/dashboard/ui/components/whatif-cta-section'
import {
  useFinancialState,
  useFlexibleMoney,
  useForecast,
} from '@/features/forecast/hooks/use-forecast'
import { FreshnessSection } from '@/features/freshness/ui/components/freshness-section'
import { PrimaryGoalCard } from '@/features/goals/ui/components/primary-goal-card'
import { goalAmount, suggestedPace } from '@/features/goals/model/goals-form'

/**
 * Home (spec §26, design §12).
 *
 * The seven sections are in a **mandated order**:
 *   Financial State → Flexible Money → What-if CTA → 30 Days Ahead →
 *   Money Location → Main Goal → Freshness.
 *
 * Two things are deliberately absent (§19, §12):
 *  - **Total Assets is not the hero.** Net worth is a vanity number; what the
 *    household can act on is its state and its flexible money.
 *  - **Small transactions are banned from Home.** Recent-events and discuss
 *    lists belong on `/events`, not here.
 *
 * This is composition only — every number it shows comes from a slice built in
 * Phases 6–8.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const { snapshot, goals, assetBuckets } = useDashboardPage()

  const { forecast, isLoading: forecastLoading } = useForecast()
  const { flexibleMoney, isLoading: flexibleLoading } = useFlexibleMoney()
  const { financialState, isLoading: stateLoading } = useFinancialState()

  if (!snapshot) {
    return <DashboardSkeleton />
  }

  const mainGoal = goals[0]

  return (
    <AppearGroup className="space-y-5">
      <AppearItem>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm text-[hsl(var(--muted-foreground))]">
              {t('home.eyebrow')}
            </p>
            <h1 className="page-title text-3xl font-semibold sm:text-4xl">
              {t('home.title')}
            </h1>
          </div>
        </div>
      </AppearItem>

      {/* 1 — Financial State */}
      <AppearItem>
        <FinancialStateSection financialState={financialState} isLoading={stateLoading} />
      </AppearItem>

      {/* 2 — Flexible Money */}
      <AppearItem>
        <FlexibleMoneySection flexibleMoney={flexibleMoney} isLoading={flexibleLoading} />
      </AppearItem>

      {/* 3 — What-if CTA */}
      <AppearItem>
        <WhatIfCtaSection />
      </AppearItem>

      {/* 4 — 30 Days Ahead */}
      <AppearItem>
        <DaysAheadSection forecast={forecast} isLoading={forecastLoading} />
      </AppearItem>

      {/* 5 — Money Location */}
      <AppearItem>
        <MoneyLocationSection buckets={assetBuckets} holders={[]} />
      </AppearItem>

      {/* 6 — Main Goal. Reuses the extended card from Phase 8 directly. */}
      {mainGoal ? (
        <AppearItem>
          <PrimaryGoalCard
            goal={mainGoal}
            remaining={Math.max(
              goalAmount(mainGoal.targetAmount) - goalAmount(mainGoal.currentAmount),
              0,
            )}
            pace={suggestedPace(mainGoal)}
          />
        </AppearItem>
      ) : null}

      {/* 7 — Freshness */}
      <AppearItem>
        <FreshnessSection />
      </AppearItem>

      <AppearItem>
        <p className="px-1 pb-2 text-center text-xs leading-5 text-[hsl(var(--muted-foreground))]">
          {t('dashboard.footerNote')}
        </p>
      </AppearItem>
    </AppearGroup>
  )
}
