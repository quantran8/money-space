import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview'
import {
  buildAssetRows,
  buildDebtRows,
  buildMoneyLocationRows,
} from '@/features/dashboard/model/home-derivations'
import { useDebts } from '@/features/debts/hooks/use-debts'
import {
  useFinancialState,
  useFlexibleMoney,
  useForecast,
} from '@/features/forecast/hooks/use-forecast'
import { useFreshness } from '@/features/freshness/hooks/use-freshness'

/**
 * Home's page state (design.md §12).
 *
 * Composition only — every figure comes from the slice that owns it: the
 * forecast trio from `features/forecast`, coverage from `features/freshness`,
 * goals from `features/goals`, sources from `features/assets`.
 *
 * The skeleton is gated on the whole fan-out rather than on any single query,
 * because Home's sections are not independent: the hero, the low point and the
 * coverage strip are three readings of the same inputs, and showing them as
 * they trickle in would let the household read a number before the strip that
 * qualifies it has arrived (§2.15).
 */
export function useDashboardPage() {
  const { snapshot, goals, assets, isLoading: overviewLoading } = useDashboardOverview()

  const { forecast, isLoading: forecastLoading } = useForecast()
  const { flexibleMoney, isLoading: flexibleLoading } = useFlexibleMoney()
  const { financialState, isLoading: stateLoading } = useFinancialState()
  const { freshness, isLoading: freshnessLoading, confirmUnchanged } = useFreshness()
  const { debts, isLoading: debtsLoading } = useDebts()

  const isLoading =
    overviewLoading ||
    forecastLoading ||
    flexibleLoading ||
    stateLoading ||
    freshnessLoading ||
    debtsLoading

  if (isLoading || !snapshot || !flexibleMoney) {
    return { isReady: false as const }
  }

  const { rows: sourceRows, totalCash } = buildMoneyLocationRows(assets, freshness)

  // The Tài sản | Nợ pair is read together (§9.1), so both halves are derived
  // here rather than each section reaching for its own slice.
  const assetSummary = buildAssetRows(assets)
  const debtSummary = buildDebtRows(debts, forecast)

  return {
    isReady: true as const,
    goals,
    mainGoal: goals[0],
    forecast,
    flexibleMoney,
    financialState,
    freshness,
    sourceRows,
    totalCash,
    assetSummary,
    debtSummary,
    /** Quick update = confirm the stale sources are unchanged (§14.5). */
    confirmUnchanged,
  }
}
