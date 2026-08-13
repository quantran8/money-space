import { useTranslation } from 'react-i18next'

import { useDashboardPage } from '@/features/dashboard/hooks/use-dashboard-page'
import { ActivityLogSection } from '@/features/dashboard/ui/components/activity-log-section'
import { AssetsSection } from '@/features/dashboard/ui/components/assets-section'
import { DashboardSkeleton } from '@/features/dashboard/ui/components/dashboard-skeleton'
import { DebtsSection } from '@/features/dashboard/ui/components/debts-section'
import { FinancialPictureSection } from '@/features/dashboard/ui/components/financial-picture-section'
import { MainGoalSection } from '@/features/dashboard/ui/components/main-goal-section'
import { MoneySourcesSection } from '@/features/dashboard/ui/components/money-sources-section'
import { UpcomingSection } from '@/features/dashboard/ui/components/upcoming-section'
import { useWhatIfStore } from '@/shared/stores/whatif-store'

/**
 * Home (design.md §9.1, §12, §13).
 *
 * A single vertical column of full-width sections — NOT a two-column page grid
 * and not a card wall. Each section has a different internal shape (a huge
 * number, a chart plus a table, a table, a list), and that difference is itself
 * the scanning cue that lets the household read the page in 3–5 seconds (§7.2).
 *
 * The order is fixed by priority (§1.1, §9.1):
 *   1. Bức tranh hôm nay — state, flexible money, coverage, what-if
 *   2. Ba mươi ngày tới  — low point and the event sequence
 *   3. Mục tiêu chính    — one goal, projected date over progress
 *   4. Tài sản | Nợ      — the ONE paired block (§9.2)
 *   5. Tiền đang ở đâu   — sources and who is responsible
 *   6. Nhật ký           — what changed in the picture
 *
 * Assets and debts are the only side-by-side pair on the page, because each is
 * misleading without the other (§13). They are a BALANCE READING, not the hero:
 * the totals are shown, their difference is not — net worth belongs on the Tài
 * sản page (§5.3), and as a hero it would answer a question today's decision
 * never asks (§2.6).
 *
 * Deliberately absent, each for a stated reason:
 *  - **Net worth as hero** — does not help today's decision (§2.6, §5.3).
 *  - **A what-if section** — it is an action, and consequence must never render
 *    before the household asks for it (§2.9).
 *  - **A freshness section at the bottom** — coverage belongs beside the number
 *    it qualifies, not after the reader has already decided (§1.1, §2.15).
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const state = useDashboardPage()
  const openWhatIf = useWhatIfStore((store) => store.openWhatIf)

  if (!state.isReady) {
    return <DashboardSkeleton />
  }

  const {
    forecast,
    flexibleMoney,
    financialState,
    freshness,
    mainGoal,
    goals,
    sourceRows,
    totalCash,
    assetSummary,
    debtSummary,
    confirmUnchanged,
  } = state

  /** Quick update confirms the stale sources are unchanged (§14.5). */
  const handleQuickUpdate = () => {
    const staleIds =
      freshness?.items.filter((item) => item.state === 'stale').map((item) => item.assetId) ?? []
    if (staleIds.length > 0) confirmUnchanged.mutate(staleIds)
  }

  return (
    <div className="max-w-[1220px] space-y-4">
      <div className="flex items-center justify-between gap-4 px-1 pb-1">
        <div>
          <h1 className="page-title text-[19px]">{t('nav.dashboard')}</h1>
          <p className="mt-0.5 font-mono text-[11px] text-ink3">{formatToday(forecast?.asOfDate)}</p>
        </div>
      </div>

      <FinancialPictureSection
        flexibleMoney={flexibleMoney}
        financialState={financialState}
        freshness={freshness}
        onSimulate={() => openWhatIf({ source: 'home' })}
        onQuickUpdate={handleQuickUpdate}
      />

      {forecast ? <UpcomingSection forecast={forecast} /> : null}

      {mainGoal ? <MainGoalSection goal={mainGoal} goalCount={goals.length} /> : null}

      {/* The only two-column split at PAGE level (§9.2). Not equal-height: the
          two panels are read as a pair, not compared row by row (§13). */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <AssetsSection
          rows={assetSummary.rows}
          totalAssets={assetSummary.totalAssets}
          totalCount={assetSummary.totalCount}
        />
        <DebtsSection summary={debtSummary} />
      </div>

      <MoneySourcesSection rows={sourceRows} totalCash={totalCash} />

      {/* No API feeds the log yet — the section renders its empty state. */}
      <ActivityLogSection entries={[]} />
    </div>
  )
}

/** "13/08/2026" — ASCII only, so it is safe in the mono face (§10.1). */
function formatToday(isoDate?: string): string {
  const source = isoDate ?? new Date().toISOString()
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}
