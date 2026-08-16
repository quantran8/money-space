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
import type { CompositionSegment } from '@/components/ui/money-composition-bar'
import type { SourceFreshnessRow } from '@/components/ui/source-freshness-list'
import type { Asset } from '@/features/assets/model/assets.types'
import type { DebtItem } from '@/features/debts/model/debts.types'
import type { GoalItem } from '@/features/goals/model/goals.types'
import { goalAmount } from '@/features/goals/model/goals-form'
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
 * Split current liquid money into committed → flexible (§5.4).
 *
 * "Committed" is derived, not reported: it is whatever liquid money is not
 * flexible, i.e. the near-term obligations already spoken for. Deriving it keeps
 * the two parts summing to the total by construction, so the bar can never show
 * a misleading gap.
 */
export function buildMoneyComposition(
  flexibleMoney: FlexibleMoneyResult,
  labels: { committed: string; flexible: string },
): MoneyComposition {
  const totalLiquid = flexibleMoney.currentSharedLiquidMoney
  const flexible = flexibleMoney.lowestProjectedBalance

  // Never let a negative flexible figure inflate the committed slice.
  const committed = Math.max(totalLiquid - Math.max(flexible, 0), 0)

  const percent = (value: number) =>
    totalLiquid > 0 ? Math.round((Math.max(value, 0) / totalLiquid) * 100) : 0

  /**
   * A share that rounds to 0% or 100% must not READ as none or all — a
   * household whose obligations are 0,17% of its money still has obligations,
   * and rounding them away is the one direction this figure must not err in.
   */
  const percentLabel = (value: number) => {
    const share = totalLiquid > 0 ? (Math.max(value, 0) / totalLiquid) * 100 : 0
    if (share > 0 && share < 1) return '<1%'
    if (share > 99 && share < 100) return '>99%'
    return `${Math.round(share)}%`
  }

  return {
    totalLiquid,
    segments: [
      {
        key: 'committed',
        label: labels.committed,
        amount: committed,
        percent: percent(committed),
        percentLabel: percentLabel(committed),
        tone: 'committed',
      },
      {
        key: 'flexible',
        label: labels.flexible,
        amount: flexible,
        percent: percent(flexible),
        percentLabel: percentLabel(flexible),
        tone: 'flexible',
      },
    ],
  }
}

// --- §11.5 / §2.15 coverage --------------------------------------------------

export type CoverageSummary = {
  /** Oldest first, capped — the rest live on the Tài sản page. */
  rows: SourceFreshnessRow[]
  /** Sources feeding the hero, INCLUDING the ones past the cap. */
  total: number
  staleCount: number
  hasStale: boolean
  /** Ids the "Cập nhật nhanh" action confirms as unchanged. All of them, not just the shown rows. */
  staleIds: string[]
  oldestDays: number | null
}

/** Aging has not crossed the household's own threshold, so it still counts as covered. */
function isStale(state: FreshnessItem['state']): boolean {
  return state === 'stale' || state === 'unknown'
}

/**
 * The v11 coverage block: the money sources the hero is computed FROM, named and
 * counted (§11.5, §2.15).
 *
 * Three deliberate narrowings from the v4.0 strip:
 *  - **`usable_now` only, and nothing else.** This is the exact set the forecast
 *    sums into its starting balance, so the block can name the sources AND show
 *    what each contributes. It is not "cash": the household decides per asset
 *    whether it counts (`countsAsFlexible` → the stored `liquidity` bucket), so
 *    a bank account they set aside drops out of this list and a gold bar they
 *    would sell appears in it. Filtering by type here — or by "not long-term",
 *    which is what this did before — would quietly contradict that decision.
 *  - **Amounts, not just names.** Each row's value comes from the same
 *    `computeCurrentValue` the forecast sums, so the rows add up to the total
 *    stated above them — which is what makes that number openable rather than
 *    asserted.
 *  - **Oldest first, capped at 4.** Sorting by age is what makes the block
 *    actionable; past four rows it stops being a caveat and becomes the Tài sản
 *    page, so the overflow links there instead of expanding in place.
 */
export function buildCoverage(freshness: DataFreshnessResult, limit = 4): CoverageSummary {
  const counted = freshness.items.filter((item) => item.liquidity === 'usable_now')

  const rows = counted
    .map((item) => ({
      id: item.assetId,
      name: item.name,
      value: item.currentValue,
      days: item.daysSinceUpdate,
      isStale: isStale(item.state),
    }))
    // Never-updated sources (null) are the oldest thing there is, so they lead.
    .sort((a, b) => (b.days ?? Number.MAX_SAFE_INTEGER) - (a.days ?? Number.MAX_SAFE_INTEGER))

  const staleIds = rows.filter((row) => row.isStale).map((row) => row.id)

  return {
    rows: rows.slice(0, limit),
    total: rows.length,
    staleCount: staleIds.length,
    hasStale: staleIds.length > 0,
    staleIds,
    oldestDays: rows[0]?.days ?? null,
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
  limit = 5,
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

export type DeltaPoint = {
  /** Position on the axis. Dates repeat (day 0 anchors on today), indices do not. */
  index: number
  date: string
  /** Closing balance MINUS today's balance, in VND. Negative = lower than today. */
  delta: number
}

/**
 * The thirty-day line, drawn as CHANGE SINCE TODAY rather than as a balance
 * (§12.2, §2.8).
 *
 * Plotting the balance itself gives a flat line pinned near the household's
 * total, where a month of real movement is a rounding error — and it makes the
 * chart's readability a function of how much money the household happens to
 * have. Plotting the delta puts the zero line at today, so the shape is the
 * same question every household is actually asking: does this month dip, and
 * how far.
 *
 * The series is anchored with an explicit zero point at `asOfDate`, so the line
 * starts on the baseline instead of starting at day 0's closing balance and
 * leaving the reader to infer where "today" was.
 */
export function buildDeltaSeries(forecast: ForecastResult): {
  points: DeltaPoint[]
  /** Index into `points` of the low point, or -1. */
  lowestIndex: number
} {
  if (forecast.days.length === 0) return { points: [], lowestIndex: -1 }

  const start = forecast.startingLiquidBalance

  const points: DeltaPoint[] = [
    { index: 0, date: forecast.asOfDate, delta: 0 },
    ...forecast.days.map((day, index) => ({
      index: index + 1,
      date: day.date,
      delta: day.closingBalance - start,
    })),
  ]

  const lowest = points.reduce(
    (low, point) => (point.delta < points[low].delta ? point.index : low),
    0,
  )

  // A month that never dips below today has no low point worth marking.
  return { points, lowestIndex: points[lowest].delta < 0 ? lowest : -1 }
}

// --- §12.3 goals -------------------------------------------------------------

export type GoalTrack = {
  id: string
  name: string
  current: number
  target: number
  /** 0–100, clamped. */
  percent: number
  /**
   * Where progress must stand TODAY for the goal to land on its target date at
   * the declared monthly contribution. Undefined when that cannot be derived.
   */
  requiredPercent?: number
  /** The household's first goal — the one Home used to show on its own. */
  isMain: boolean
  /** Far enough behind the milestone to be worth a colour (§5.2). */
  behind: boolean
}

/** Behind by less than this reads as normal month-to-month drift, not a signal. */
const BEHIND_THRESHOLD_POINTS = 10

/**
 * Goal tracks with the "where we need to be today" milestone (§12.3).
 *
 * The milestone is derived ONLY from figures the household itself declared: the
 * target, the target date, and the monthly contribution they set. Required today
 * = target − (contribution × months left). Without a declared contribution or a
 * target date there is no honest milestone, so the track simply has none —
 * inferring a pace from past behaviour would present a guess as a fact (§2.16,
 * goal-projection.types.ts).
 *
 * This replaces the single-goal block: one goal answered "how is that one
 * going", but the household's real question at this altitude is which goal is
 * off pace, and that only reads as a comparison.
 */
export function buildGoalTracks(goals: GoalItem[], limit = 3): GoalTrack[] {
  return goals.slice(0, limit).map((goal, index) => {
    const current = goalAmount(goal.currentAmount)
    const target = goalAmount(goal.targetAmount)
    const percent = target > 0 ? clampPercent((current / target) * 100) : 0

    const projection = goal.projection
    const monthly = projection?.plannedMonthlyContribution ?? goal.plannedMonthlyContribution ?? 0
    const monthsLeft = projection?.monthsUntilTargetDate ?? null

    const requiredPercent =
      target > 0 && monthly > 0 && monthsLeft !== null && monthsLeft >= 0
        ? clampPercent(((target - monthly * monthsLeft) / target) * 100)
        : undefined

    return {
      id: goal.id,
      name: goal.name,
      current,
      target,
      percent,
      requiredPercent,
      isMain: index === 0,
      behind:
        requiredPercent !== undefined && percent < requiredPercent - BEHIND_THRESHOLD_POINTS,
    }
  })
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
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

/**
 * The split is "counted towards money we can use today" vs "held" — the same
 * line §12.1 draws, so a source the household set aside cannot appear as cash
 * here while being absent from the block that explains the hero. It is NOT a
 * split by asset type: `usable_now` is the household's own decision per asset
 * (see `countsAsFlexible` in features/assets).
 */
export type MoneyLocationGroupKey = 'usable_now' | 'held'

export type MoneyLocationBar = {
  id: string
  name: string
  value: number
  group: MoneyLocationGroupKey
  /** Who is RESPONSIBLE for the source — never who spent from it (§0.2, §16.4). */
  holder?: string
}

export type MoneyLocationGroup = {
  key: MoneyLocationGroupKey
  value: number
  count: number
}

export type MoneyLocationMap = {
  /** Counted first, held second — bars read top to bottom by usefulness today. */
  groups: MoneyLocationGroup[]
  /** The bars actually drawn: counted descending, then held descending. */
  bars: MoneyLocationBar[]
  total: number
  /** Sources counted towards money usable today — the §12.1 figure. */
  totalUsable: number
  totalHeld: number
  totalCount: number
  /** Sources beyond the row cap. They live on the Tài sản page. */
  hiddenCount: number
}

/** Past this many rows the section stops being a glance and becomes a page. */
const MAX_BARS = 6

/**
 * `Tiền đang ở đâu` as ranked horizontal bars (§12.4).
 *
 * Bar length is the same proportional encoding an area map gives, so
 * CONCENTRATION still reads at a glance — but every source keeps a full row, so
 * its name and amount stay legible however small its share is. That is what an
 * area map cannot do: below a couple of percent a cell has no room for its own
 * label, which is exactly the case a household with one main account hits.
 *
 * The counted sources sort first and the held ones second, each descending, so
 * liquidity is never inferred from a fill alone — the reader can stop at the
 * first block and have the whole answer about money usable today. That claim
 * only holds because the first group is exactly the `usable_now` set §12.1
 * names; grouping by type (as "cash vs long-term" did) put a savings book the
 * forecast never counts in the same block as the current account.
 *
 * Only positive values are drawn: a zero-value source has no length, and a
 * negative one is not a place money is being held.
 */
export function buildMoneyLocationMap(
  assets: Asset[],
  holderNameById?: Map<string, string>,
): MoneyLocationMap {
  const active = assets.filter((asset) => !asset.status || asset.status === 'active')

  const leaves = active
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      value: asset.currentValue ?? 0,
      group: (asset.liquidity === 'usable_now' ? 'usable_now' : 'held') as MoneyLocationGroupKey,
      holder: asset.holderMemberId
        ? holderNameById?.get(asset.holderMemberId)
        : undefined,
    }))
    .filter((leaf) => leaf.value > 0)
    .sort((a, b) => b.value - a.value)

  const ordered = (['usable_now', 'held'] as const).flatMap((key) =>
    leaves.filter((leaf) => leaf.group === key),
  )

  const groups: MoneyLocationGroup[] = (['usable_now', 'held'] as const)
    .map((key) => {
      const children = leaves.filter((leaf) => leaf.group === key)
      return {
        key,
        value: children.reduce((sum, leaf) => sum + leaf.value, 0),
        count: children.length,
      }
    })
    .filter((group) => group.count > 0)

  const totalUsable = groups.find((group) => group.key === 'usable_now')?.value ?? 0
  const totalHeld = groups.find((group) => group.key === 'held')?.value ?? 0

  return {
    groups,
    // Truncating by rank keeps the largest sources, which is what the totals
    // beside the bars are made of — the group totals above always cover ALL
    // sources, drawn or not, so the two never disagree.
    bars: ordered.slice(0, MAX_BARS),
    total: totalUsable + totalHeld,
    totalUsable,
    totalHeld,
    totalCount: leaves.length,
    hiddenCount: Math.max(ordered.length - MAX_BARS, 0),
  }
}
