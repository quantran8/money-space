/**
 * Pure derivations behind the v4.0 Home (design.md §12).
 *
 * Kept out of the components so the sections stay presentational and these
 * rules stay testable. Nothing here formats money or picks copy — that is the
 * component's job via i18n.
 *
 * The one invariant worth restating: flexible money and the low point MAY BE
 * NEGATIVE and are never clamped (forecast.types.ts). A negative number is the
 * signal the product exists to show.
 */
import type { CoverageSource, CoverageState } from '@/components/ui/source-coverage-strip'
import type { CompositionSegment } from '@/components/ui/money-composition-bar'
import type { Asset } from '@/features/assets/model/assets.types'
import type { DebtItem } from '@/features/debts/model/debts.types'
import type { DataFreshnessResult, FreshnessItem } from '@/features/freshness/model/freshness.types'
import type {
  ForecastOccurrence,
  ForecastResult,
  FlexibleMoneyResult,
} from '@/features/forecast/model/forecast.types'

// --- §12.1 money composition -------------------------------------------------

export type MoneyComposition = {
  segments: CompositionSegment[]
  /** Total liquid money the three parts add up to. */
  totalLiquid: number
}

/**
 * Split current liquid money into committed → protected → flexible (§5.4).
 *
 * "Committed" is derived, not reported: it is whatever liquid money is neither
 * protected nor flexible, i.e. the near-term obligations already spoken for.
 * Deriving it keeps the three parts summing to the total by construction, so
 * the bar can never show a misleading gap.
 */
export function buildMoneyComposition(
  flexibleMoney: FlexibleMoneyResult,
  labels: { committed: string; protect: string; flexible: string },
): MoneyComposition {
  const totalLiquid = flexibleMoney.currentSharedLiquidMoney
  const protectedReserve = Math.max(flexibleMoney.protectedReserveAmount, 0)
  const flexible = flexibleMoney.flexibleMoneyHorizon

  // Never let a negative flexible figure inflate the committed slice.
  const committed = Math.max(totalLiquid - protectedReserve - Math.max(flexible, 0), 0)

  const percent = (value: number) =>
    totalLiquid > 0 ? Math.round((Math.max(value, 0) / totalLiquid) * 100) : 0

  return {
    totalLiquid,
    segments: [
      {
        key: 'committed',
        label: labels.committed,
        amount: committed,
        percent: percent(committed),
        tone: 'committed',
      },
      {
        key: 'protect',
        label: labels.protect,
        amount: protectedReserve,
        percent: percent(protectedReserve),
        tone: 'protect',
      },
      {
        key: 'flexible',
        label: labels.flexible,
        amount: flexible,
        percent: percent(flexible),
        tone: 'flexible',
      },
    ],
  }
}

// --- §11.5 / §2.15 coverage --------------------------------------------------

export type CoverageSummary = {
  sources: CoverageSource[]
  total: number
  freshCount: number
  staleCount: number
  hasStale: boolean
  /** Names of the stale sources, for the "chưa gồm …" caveat. Max 2 + overflow. */
  staleNames: string[]
  oldestDays: number | null
}

const COVERAGE_STATE: Record<FreshnessItem['state'], CoverageState> = {
  fresh: 'fresh',
  // Aging has not crossed the household's own threshold, so it still counts as
  // covered — flagging it would cry wolf on data the household considers current.
  aging: 'fresh',
  stale: 'stale',
  unknown: 'never',
}

/**
 * One strip segment per money source, in the source list's own order — never
 * sorted by state, so the strip stays positionally stable between visits
 * (§11.5).
 */
export function buildCoverage(freshness: DataFreshnessResult): CoverageSummary {
  const sources = freshness.items.map((item) => ({
    id: item.assetId,
    state: COVERAGE_STATE[item.state],
  }))

  const staleItems = freshness.items.filter((item) => COVERAGE_STATE[item.state] !== 'fresh')

  return {
    sources,
    total: freshness.items.length,
    freshCount: sources.filter((source) => source.state === 'fresh').length,
    staleCount: staleItems.length,
    hasStale: staleItems.length > 0,
    staleNames: staleItems.map((item) => item.name),
    oldestDays: freshness.oldestDaysSinceUpdate,
  }
}

// --- §12.2 thirty days ahead -------------------------------------------------

export type TimelineRow = {
  key: string
  date: string
  name: string
  amount: number
  /** Signed for display: outgoing is negative. */
  signedAmount: number
  /** True when the row is shown but NOT counted in the running balance. */
  unconfirmed: boolean
  /** Running balance after this occurrence. Undefined when not counted. */
  runningBalance?: number
}

/**
 * The §11.3 cash-flow table: events plus a RUNNING BALANCE column.
 *
 * That column is the whole point (§2.7) — it turns a list of events into a
 * sequence, so the household reads "where does this leave us" without adding
 * anything up mentally.
 *
 * Occurrences that the forecast does not bank (estimated incoming, planned
 * outgoing, postponed) are still listed, but they do not move the running
 * balance and are marked `unconfirmed` — silently folding them in would claim
 * more certainty than the data has (§2.16).
 */
export function buildTimelineRows(
  forecast: ForecastResult,
  limit = 4,
): { rows: TimelineRow[]; totalCount: number } {
  let balance = forecast.startingLiquidBalance

  const rows = forecast.timeline.map((occurrence) => {
    const signedAmount =
      occurrence.direction === 'outgoing' ? -occurrence.amount : occurrence.amount

    if (occurrence.countedInBalance) balance += signedAmount

    return {
      key: occurrence.occurrenceKey,
      date: occurrence.date,
      name: occurrence.name,
      amount: occurrence.amount,
      signedAmount,
      unconfirmed: !occurrence.countedInBalance || isUnconfirmed(occurrence),
      runningBalance: occurrence.countedInBalance ? balance : undefined,
    }
  })

  return { rows: rows.slice(0, limit), totalCount: rows.length }
}

function isUnconfirmed(occurrence: ForecastOccurrence): boolean {
  return (
    occurrence.status === 'pending_confirmation' ||
    (occurrence.direction === 'incoming' && occurrence.certainty === 'estimated')
  )
}

/**
 * Sparkline points for the cash-flow line (§12.2). Closing balance per day —
 * a single series, because the household only needs to see the low point
 * (§2.8).
 */
export function buildBalanceLine(forecast: ForecastResult): {
  points: { x: number; y: number }[]
  lowestIndex: number
} {
  const balances = forecast.days.map((day) => day.closingBalance)
  if (balances.length === 0) return { points: [], lowestIndex: -1 }

  const min = Math.min(...balances)
  const max = Math.max(...balances)
  const span = max - min || 1

  const points = balances.map((balance, index) => ({
    x: balances.length > 1 ? (index / (balances.length - 1)) * 100 : 0,
    // SVG y grows downward; invert so a higher balance sits higher.
    y: 100 - ((balance - min) / span) * 100,
  }))

  return { points, lowestIndex: balances.indexOf(min) }
}

// --- §9.1 assets | debts -----------------------------------------------------

export type AssetHoldingRow = {
  id: string
  name: string
  type: Asset['type']
  value: number
}

/**
 * The `Tài sản` half of the paired block (§9.1).
 *
 * Long-term holdings first — this table exists to show what the household OWNS,
 * which is the opposite emphasis from `Tiền đang ở đâu` (§12.4) where liquidity
 * is what matters. Sorting by value alone would make the two tables read as the
 * same list twice.
 *
 * `totalAssets` deliberately counts every active asset INCLUDING cash, so the
 * figure pairs with total debt into a net worth the household can verify by
 * subtraction. Net worth itself stays off Home (§5.3) — the two totals are
 * shown, the difference is not, because it is not today's decision (§2.6).
 */
export function buildAssetRows(
  assets: Asset[],
  limit = 4,
): { rows: AssetHoldingRow[]; totalAssets: number; totalCount: number } {
  const active = assets.filter((asset) => !asset.status || asset.status === 'active')

  const rows = active
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      value: asset.currentValue ?? 0,
    }))
    .sort((a, b) => b.value - a.value)

  const totalAssets = active.reduce((sum, asset) => sum + (asset.currentValue ?? 0), 0)

  return { rows: rows.slice(0, limit), totalAssets, totalCount: rows.length }
}

export type DebtRow = {
  id: string
  name: string
  lenderName: string
  outstanding: number
  /** The next repayment inside the forecast horizon, when the forecast knows one. */
  nextPayment?: { date: string; amount: number }
}

export type DebtSummary = {
  rows: DebtRow[]
  totalOutstanding: number
  totalCount: number
  /** The largest debt, whose repayment progress the section shows. */
  largest?: {
    name: string
    repaidPercent: number
    expectedFinalDueDate?: string
  }
}

/**
 * The `Nợ` half (§9.1).
 *
 * `Kỳ tới` is joined from the FORECAST timeline rather than computed from the
 * debt's own schedule, so the date and amount shown here are the same ones the
 * 30-day section counted. A second, independently derived schedule would let
 * the two sections disagree about the same payment, and the household has no
 * way to tell which one is right (§2.7).
 *
 * A debt whose next payment falls outside the horizon simply has no `Kỳ tới` —
 * it is not backfilled with a guess.
 */
export function buildDebtRows(
  debts: DebtItem[],
  forecast?: ForecastResult,
  limit = 4,
): DebtSummary {
  const open = debts.filter((debt) => debt.status === 'active' || debt.status === 'overdue')

  /** First occurrence per debt — the timeline is already date-sorted. */
  const nextByDebtId = new Map<string, { date: string; amount: number }>()
  for (const occurrence of forecast?.timeline ?? []) {
    if (!occurrence.debtId || occurrence.direction !== 'outgoing') continue
    if (nextByDebtId.has(occurrence.debtId)) continue
    nextByDebtId.set(occurrence.debtId, {
      date: occurrence.date,
      amount: occurrence.amount,
    })
  }

  const rows = open
    .map((debt) => ({
      id: debt.id,
      name: debt.name,
      lenderName: debt.lenderName,
      outstanding: debt.outstandingAmountValue,
      nextPayment: nextByDebtId.get(debt.id),
    }))
    .sort((a, b) => b.outstanding - a.outstanding)

  const totalOutstanding = open.reduce((sum, debt) => sum + debt.outstandingAmountValue, 0)

  const biggest = [...open].sort((a, b) => b.outstandingAmountValue - a.outstandingAmountValue)[0]

  return {
    rows: rows.slice(0, limit),
    totalOutstanding,
    totalCount: open.length,
    largest: biggest
      ? {
          name: biggest.name,
          repaidPercent:
            biggest.originalAmountValue > 0
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round(
                      ((biggest.originalAmountValue - biggest.outstandingAmountValue) /
                        biggest.originalAmountValue) *
                        100,
                    ),
                  ),
                )
              : 0,
          expectedFinalDueDate: biggest.expectedFinalDueDate,
        }
      : undefined,
  }
}

// --- §12.4 money location ----------------------------------------------------

export type MoneyLocationRow = {
  id: string
  name: string
  /** Undefined until the API exposes a holder — the column renders empty. */
  holder?: string
  role: Asset['liquidity']
  valueUpdatedAt?: string
  daysSinceUpdate: number | null
  isStale: boolean
  value: number
}

/**
 * Money-location rows, richest source first.
 *
 * The `Cập nhật` column is joined from the freshness result rather than read
 * off the asset, because staleness is defined by the household's own update
 * frequency — the same 20-day-old value is fine for one household and stale for
 * another.
 */
export function buildMoneyLocationRows(
  assets: Asset[],
  freshness?: DataFreshnessResult,
  limit = 5,
): { rows: MoneyLocationRow[]; totalCash: number; totalCount: number } {
  const freshnessById = new Map(freshness?.items.map((item) => [item.assetId, item]) ?? [])

  const active = assets.filter((asset) => !asset.status || asset.status === 'active')

  const rows = active
    .map((asset) => {
      const item = freshnessById.get(asset.id)
      return {
        id: asset.id,
        name: asset.name,
        role: asset.liquidity,
        valueUpdatedAt: asset.valueUpdatedAt,
        daysSinceUpdate: item?.daysSinceUpdate ?? null,
        isStale: item ? item.state === 'stale' || item.state === 'unknown' : false,
        value: asset.currentValue ?? 0,
      }
    })
    .sort((a, b) => b.value - a.value)

  // "Tổng tiền mặt" is liquid money only — long-term holdings are not cash and
  // must not inflate this line (§12.4).
  const totalCash = active
    .filter((asset) => asset.liquidity !== 'long_term')
    .reduce((sum, asset) => sum + (asset.currentValue ?? 0), 0)

  return { rows: rows.slice(0, limit), totalCash, totalCount: rows.length }
}
