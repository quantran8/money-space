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
import type { CompositionSegment, SourceFreshnessRow } from '#/shared/presentation.types'
import type { Asset } from '#/features/assets/model/assets.types'
import type { DebtItem } from '#/features/debts/model/debts.types'
import type { GoalItem, GoalPriority } from '#/features/goals/model/goals.types'
import { goalAmount } from '#/features/goals/model/goals-form'
import type { DataFreshnessResult, FreshnessItem } from '#/features/freshness/model/freshness.types'
import type {
  ForecastOccurrence,
  ForecastResult,
  FlexibleMoneyResult,
} from '#/features/forecast/model/forecast.types'
import { canProjectBalance } from '#/features/forecast/model/forecast-presentation'

// --- §12.1 money composition -------------------------------------------------

export type MoneyComposition = {
  segments: CompositionSegment[]
  /** Total liquid money the three parts add up to. */
  totalLiquid: number
}

/**
 * Split current liquid money into committed → flexible (§5.4).
 *
 * "Committed" is money that already has a job, and that is TWO things:
 *
 *  - **Near-term obligations** — bills due before more money arrives, which the
 *    forecast subtracts to reach `lowestProjectedBalance`.
 *  - **Goal money** — what the household set aside behind a goal, plus what this
 *    month's pace can still draw from what is left (`goalCommitments`).
 *
 * Only the first used to count, so a household with 20tr of a 22tr wallet behind
 * the car was told it had 22tr flexible. Promising money to a goal and then
 * seeing it offered back as free money is the overstatement this screen exists
 * to prevent.
 *
 * The two never double-count: the server computes goal money against the same
 * liquid sources, and its second half is capped at what is still free after the
 * first (see `resolveGoalCommittedAmount`). Those sources have the horizon's
 * outflows already taken out, because an outflow outranks the goals sharing its
 * wallet — so a bill is charged to the balance walk OR to a goal's backing, and
 * never to both.
 */
export function buildMoneyComposition(
  flexibleMoney: FlexibleMoneyResult,
  labels: { committed: string; flexible: string },
): MoneyComposition {
  const totalLiquid = flexibleMoney.currentSharedLiquidMoney
  const goalCommitments = flexibleMoney.goalCommitments ?? 0

  // Goal money is not free money. Floored at 0 rather than allowed negative:
  // this bar is a split of what exists, and the negative-is-the-signal rule
  // belongs to the hero, which reports the same subtraction unclamped.
  //
  // The floor is a display rule for a bar of positive widths, NOT a fix for a
  // negative figure. It used to hide one: while goal money was measured against
  // wallets the outflows had not been taken out of, this clamp quietly rendered
  // the double-subtraction as a full committed bar while the hero showed the
  // negative number. Both read from the same corrected figure now.
  const flexible = Math.max(flexibleMoney.lowestProjectedBalance - goalCommitments, 0)

  // Never let a negative flexible figure inflate the committed slice.
  const committed = Math.max(totalLiquid - flexible, 0)

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
  /** Every source feeding the hero, oldest first. */
  rows: SourceFreshnessRow[]
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
 *  - **Oldest first, uncapped.** Sorting by age is what makes the block
 *    actionable. The rows used to stop at four and link to the Tài sản page for
 *    the rest, because the list was always open and pushed §12.2 down; now that
 *    it opens on demand (§11.5) every source is named here, so the rows visibly
 *    add up to the total stated above them.
 */
export function buildCoverage(freshness: DataFreshnessResult): CoverageSummary {
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
    rows,
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
  /**
   * When the event actually happens. For an overdue occurrence the forecast
   * clamps `occurrence.date` onto today so it still weighs on today's cash;
   * this stays the real date, since the column states when it happens.
   */
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
  // With no wallet there is no balance to run down, so the column states
  // nothing rather than showing the outflows as a deficit — see
  // `canProjectBalance`. Same "—" the table already renders for an occurrence
  // the forecast does not bank.
  const canProject = canProjectBalance(forecast.usableNowAssetCount)

  const rows = forecast.timeline.map((occurrence) => {
    const signedAmount =
      occurrence.direction === 'outgoing' ? -occurrence.amount : occurrence.amount

    if (occurrence.countedInBalance) balance += signedAmount

    return {
      key: occurrence.occurrenceKey,
      date: occurrence.originalDate ?? occurrence.date,
      name: occurrence.name,
      amount: occurrence.amount,
      signedAmount,
      unconfirmed: !occurrence.countedInBalance || isUnconfirmed(occurrence),
      runningBalance:
        occurrence.countedInBalance && canProject ? balance : undefined,
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

// --- overdue, awaiting the household's own action -----------------------------

export type OverdueRow = {
  key: string
  sourceEventId: string
  /**
   * The day the occurrence is LISTED under — day 0. This is what the complete
   * action must send as its idempotency key, NOT `dueDate`.
   */
  date: string
  /**
   * The day it actually fell due, joined from the source event's
   * `expectedDate`. Undefined when that event is not loaded — the row then
   * shows no date rather than falling back to `date`, which is today and would
   * read as "due today" for something that is overdue.
   */
  dueDate?: string
  /** Whole days between `dueDate` and today. Undefined without a `dueDate`. */
  daysOverdue?: number
  name: string
  /** Signed for display: outgoing is negative. */
  signedAmount: number
}

export type OverdueSummary = {
  rows: OverdueRow[]
  totalCount: number
  /** Net effect on the balance if every one of them is confirmed as done. */
  netAmount: number
  /** Age of the oldest item, for the block's own summary. */
  oldestDays?: number
}

/**
 * Occurrences that came due before today and have not been acted on.
 *
 * The forecast collapses a missed series into ONE occurrence on day 0 (backend
 * `recurrence.ts`) and flags it `wasClampedFromPast`. It stays counted: an
 * unpaid bill is still owed, so it remains inside `startingLiquidBalance` and
 * everything projected from it.
 *
 * What never happens automatically is RESOLVING one — that is always a button
 * somebody presses (§18). So the household has to be told these are sitting
 * there, otherwise a figure that already includes them reads as settled.
 *
 * This is a notice, not a verdict: it names what is waiting and what it comes
 * to, and leaves the deciding to the two people reading it (§16).
 *
 * **When it fell due comes from the source event, not the occurrence.** The
 * backend overwrites the occurrence's own date with `asOfDate` when it clamps
 * (`recurrence.ts`), so `occurrence.date` is today for every row here and says
 * nothing about how long the item has been waiting. `expectedDate` on the event
 * is the real due date, so callers pass the events in to have it joined on.
 * Rows sort oldest first once that join succeeds.
 */
export function buildOverdue(
  forecast: ForecastResult,
  events: { id: string; expectedDate: string }[] = [],
  limit = 4,
): OverdueSummary {
  const expectedById = new Map(events.map((event) => [event.id, event.expectedDate]))

  const overdue = forecast.days
    .flatMap((day) => day.occurrences)
    .filter((occurrence) => occurrence.wasClampedFromPast)

  const rows: OverdueRow[] = overdue.map((occurrence) => {
    const dueDate = expectedById.get(occurrence.sourceEventId)
    // Only count a date that really is in the past. A completed-then-advanced
    // event can sit in the future while its clamped occurrence is still listed.
    const overdueBy =
      dueDate && dueDate < forecast.asOfDate
        ? daysBetween(dueDate, forecast.asOfDate)
        : undefined

    return {
      key: occurrence.occurrenceKey,
      sourceEventId: occurrence.sourceEventId,
      date: occurrence.date,
      dueDate: overdueBy === undefined ? undefined : dueDate,
      daysOverdue: overdueBy,
      name: occurrence.name,
      signedAmount:
        occurrence.direction === 'incoming' ? occurrence.amount : -occurrence.amount,
    }
  })

  // Oldest first. Rows with no joined date keep their forecast order at the end.
  const sorted = [...rows].sort(
    (a, b) => (b.daysOverdue ?? -1) - (a.daysOverdue ?? -1),
  )

  const ages = sorted
    .map((row) => row.daysOverdue)
    .filter((days): days is number => days !== undefined)

  return {
    rows: sorted.slice(0, limit),
    totalCount: sorted.length,
    netAmount: sorted.reduce((sum, row) => sum + row.signedAmount, 0),
    oldestDays: ages.length > 0 ? Math.max(...ages) : undefined,
  }
}

/** Whole days from `from` to `to`, both ISO dates. */
function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.max(0, Math.round(ms / 86_400_000))
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
  /** Funding rank. Home marks it the same way the goals list does. */
  priority: GoalPriority
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

    // The milestone answers "at the pace you declared, progress should stand
    // here today". It needs a declared pace to exist at all — a goal without one
    // gets no milestone and is therefore never flagged as behind, rather than
    // being judged against a number nobody set.
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
      priority: goal.priority,
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
 * Sources rank by value, largest first, with no liquidity split. The bars used
 * to run counted-then-held so the reader could stop at the first block and have
 * the whole answer about money usable today — but that answer now lives in
 * §12.1, which states the usable total and names every source feeding it. Here
 * the question is where the money SITS, and one continuous ranking answers it
 * without asking the reader to hold two orderings at once.
 *
 * `groups` is still derived, and still splits on the household's own per-asset
 * decision rather than on asset type — `totalUsable` must keep agreeing with
 * §12.1, whether or not a caller draws the split.
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

  // Ranked by value alone, NOT grouped by liquidity first.
  //
  // The bars used to sort usable-now before held, because the fill encoded the
  // group and the reader could stop at the first block. Since §12.4 now steps
  // the fill down by RANK, a split order would put the darkest fill on the
  // largest usable source rather than the largest source — so a 30tr holding
  // would read as smaller than a 2tr account. One order, one meaning.
  const ordered = leaves

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

// --- §12.4 who holds what ----------------------------------------------------

export type HolderSource = {
  id: string
  name: string
  value: number
}

export type HolderGroup = {
  /** Member id, or `shared` for sources nobody is named on. */
  key: string
  name: string
  value: number
  sources: HolderSource[]
}

/**
 * The same money as `buildMoneyLocationMap`, grouped by WHO IS RESPONSIBLE for
 * it (§0.2, §16.4).
 *
 * This is a second reading of one set of sources, not a second set: the bars
 * answer "where does the money sit", this answers "who is looking after it".
 * Both are drawn from the same active assets and sum to the same total, which
 * is what lets the two blocks sit in one section without disagreeing.
 *
 * It is deliberately NOT an attribution of spending. The product never says who
 * spent what — `holderMemberId` is who is responsible for a source, and that is
 * the only person-shaped fact Home is allowed to state.
 *
 * Sources with nobody named collapse into one shared group rather than being
 * dropped or attributed to a default member: a joint account genuinely belongs
 * to the household, and inventing an owner for it would be a claim the data
 * does not make. `sharedLabel` is the caller's, because copy is i18n's job.
 *
 * Groups rank by value and each group's own sources rank inside it, so the
 * block reads largest-first at both levels — the same ordering rule the bars
 * use, so the eye does not have to switch conventions mid-section.
 */
export function buildHolderGroups(
  assets: Asset[],
  holderNameById: Map<string, string> | undefined,
  sharedLabel: string,
): HolderGroup[] {
  const active = assets.filter(
    (asset) => (!asset.status || asset.status === 'active') && (asset.currentValue ?? 0) > 0,
  )

  const byHolder = new Map<string, HolderGroup>()

  for (const asset of active) {
    // A holder id we cannot resolve to a name is treated as unnamed rather than
    // rendered as a raw id — an id is not a person to the household.
    const resolved = asset.holderMemberId
      ? holderNameById?.get(asset.holderMemberId)
      : undefined
    const key = resolved ? asset.holderMemberId! : 'shared'
    const name = resolved ?? sharedLabel

    const group = byHolder.get(key) ?? { key, name, value: 0, sources: [] }
    group.value += asset.currentValue ?? 0
    group.sources.push({
      id: asset.id,
      name: asset.name,
      value: asset.currentValue ?? 0,
    })
    byHolder.set(key, group)
  }

  return [...byHolder.values()]
    .map((group) => ({
      ...group,
      sources: [...group.sources].sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value)
}
