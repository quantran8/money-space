import type { AssetGoalClaim } from '#/features/goals/api/goals.repository'

/**
 * What spending from a wallet costs the goals saving into it — computed HERE,
 * with no request, so the form can answer the moment an amount is typed.
 *
 * ## Why this is duplicated from the server
 *
 * The server owns this rule (`goals/domain/spend-impact.ts`) and is the figure
 * of record. This copy exists for one reason: latency. The household types an
 * amount and may save immediately, and a warning that arrives after they have
 * already clicked has warned nobody. Waiting on a round trip would also mean
 * either a blank space or a stale number during the wait, and a stale money
 * figure is worse than none.
 *
 * The duplication is deliberate and bounded. **Both implementations must change
 * together** — the backend's `spend-impact.spec.ts` holds the worked examples
 * this must agree with (22tr wallet, 20tr set aside, 20tr/month pace → an
 * outflow of 0 / 2tr / 5tr leaves 22tr / 20tr / 17tr). This repo has no test
 * runner, so those cases are documented in the doc comments below instead.
 *
 * ## The rule
 *
 * An outflow OUTRANKS the goals sharing its wallet — a bill is an obligation, a
 * goal is a promise the household makes to itself, and the promise gives way.
 * The goal money shrinks; flexible money does not go negative.
 *
 * The order it gives way in is not imposed here either. It falls out of lowering
 * the wallet's value, exactly as it does on the server:
 *
 *  - a `percent` claim is a share OF the value, so it shrinks proportionally;
 *  - a `fixed` claim is CAPPED at the value, so it only shrinks once the value
 *    falls below it;
 *  - this month's contribution can only come out of what is still FREE, so it is
 *    squeezed out first.
 *
 * Scoped to ONE wallet, which is all the form needs and all
 * `assetGoalUsage` provides. The server's version spans every wallet.
 */

export interface LocalGoalSpendImpact {
  goalId: string
  goalName: string
  before: number
  after: number
  /**
   * What THIS MONTH'S CONTRIBUTION was drawing from this wallet before the
   * spend. The form reports "phần góp tháng này: 17,1 → 12,1", and that first
   * figure is this — not `reduction`, which is what the spend takes. Summing
   * the reductions would report the pace as having held exactly what the bill
   * removed, i.e. always ending at zero.
   */
  paceBefore: number
  /** Money already sitting behind the goal in this wallet, before the spend. */
  setAsideBefore: number
  reduction: number
  /**
   * How much of `reduction` comes out of THIS MONTH'S CONTRIBUTION — the pace
   * that had fit in the wallet's free room.
   *
   * Kept apart from `setAsideReduction` because the two mean different things
   * to the household: this month's saving not happening is a pause, while money
   * already behind the goal going back out is the goal moving backwards. A
   * single total cannot say which one occurred, and they are not equally
   * serious.
   */
  paceReduction: number
  /** How much comes out of money ALREADY SET ASIDE. */
  setAsideReduction: number
}

export interface LocalSpendImpact {
  assetValue: number
  amount: number
  assetValueAfter: number
  totalReduction: number
  /** Across every goal — this month's contribution given up. */
  totalPaceReduction: number
  /** Across every goal — money already set aside taken back out. */
  totalSetAsideReduction: number
  /** Across every goal — what this month's contribution held before the spend. */
  totalPaceBefore: number
  /** Across every goal — money already set aside, before the spend. */
  totalSetAsideBefore: number
  goals: LocalGoalSpendImpact[]
  exceedsWallet: boolean
}

/**
 * What one allocation is worth at a given wallet value.
 *
 * Mirrors the server's `allocationValue`. A `fixed` claim is capped at the value
 * — the household declared "20tr of this wallet belongs to the car", and if the
 * wallet falls to 17tr only 17tr is really there. Reporting the declared figure
 * would be the product inventing money.
 */
function allocationValue(
  claim: AssetGoalClaim,
  assetValue: number,
  /**
   * What a percent claim is a percentage OF, when the wallet has been lowered
   * by a spend.
   *
   * "50% of this wallet" is a standing arrangement, not a figure that
   * re-derives itself every time a bill is scheduled. Re-reading it against the
   * lowered value shaved every goal proportionally even when the spend fitted
   * inside unassigned money: 5tr out of a 52tr wallet with 26tr unassigned
   * reported "mục tiêu giảm 2,5tr" when the honest answer was zero.
   *
   * Still capped at what the wallet actually holds afterwards — a percent
   * cannot conjure money that is gone, so a genuinely unaffordable spend does
   * still reduce the goals.
   */
  percentBasis: number,
): number {
  if (assetValue <= 0) return 0
  if (claim.kind === 'percent') {
    const percent = claim.percent ?? 0
    if (percent <= 0) return 0
    return Math.min((percentBasis * Math.min(100, percent)) / 100, assetValue)
  }
  const allocated = claim.allocatedAmount ?? 0
  if (allocated <= 0) return 0
  return Math.min(allocated, assetValue)
}

const PRIORITY_ORDER = ['high', 'medium', 'low'] as const

/**
 * What each goal is counted as holding from this wallet, at a given value.
 *
 * Two parts, which must not double-count:
 *
 *  1. what is already set aside (every allocation's worth), and
 *  2. what this month's pace can still draw from the room that is LEFT.
 *
 * Part 2 is why the contribution is squeezed out first: free room is
 * `value − everything set aside`, so a smaller value eats the room before it
 * touches the claims. Goals are served by priority, each capped at its own
 * declared pace, and a shortfall inside one priority is split by the declared
 * shares (falling back to the paces themselves when none were declared).
 */
interface GoalParts {
  /** Money already sitting behind the goal. */
  setAside: number
  /** What this month's pace can still draw from the room left over. */
  pace: number
}

function claimsAtValue(
  claims: AssetGoalClaim[],
  assetValue: number,
  /** What percent claims are a percentage of — the wallet BEFORE the spend. */
  percentBasis: number,
): Map<string, GoalParts> {
  const result = new Map<string, GoalParts>()
  const add = (goalId: string, key: keyof GoalParts, amount: number) => {
    const current = result.get(goalId) ?? { setAside: 0, pace: 0 }
    current[key] += amount
    result.set(goalId, current)
  }
  let setAsideTotal = 0

  for (const claim of claims) {
    const value = allocationValue(claim, assetValue, percentBasis)
    add(claim.goalId, 'setAside', value)
    setAsideTotal += value
  }

  let remaining = Math.max(0, assetValue - setAsideTotal)

  for (const priority of PRIORITY_ORDER) {
    if (remaining <= 0) break

    const group = claims
      .filter(
        (claim) =>
          claim.priority === priority &&
          claim.role === 'contribution' &&
          (claim.monthlyContribution ?? 0) > 0,
      )
      .map((claim) => ({
        goalId: claim.goalId,
        pace: claim.monthlyContribution ?? 0,
        share: claim.sharePercent ?? null,
      }))
    if (group.length === 0) continue

    const wanted = group.reduce((sum, entry) => sum + entry.pace, 0)

    if (wanted <= remaining) {
      // The wallet covers everyone here, so the declared shares stay unused —
      // they exist for shortfalls, not for ordinary months.
      for (const entry of group) {
        add(entry.goalId, 'pace', entry.pace)
      }
      remaining -= wanted
      continue
    }

    // Short: divide what is left. All-or-nothing per group — mixing declared
    // shares with paces would measure two goals on different scales.
    const useShares = group.every((entry) => entry.share !== null)
    const weights = group.map((entry) =>
      useShares ? (entry.share ?? 0) : entry.pace,
    )
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    if (totalWeight <= 0) break

    // Two passes, so a goal asking for less than its share does not strand
    // money the rest of the group could still use.
    const portions = group.map((entry, index) =>
      Math.min(entry.pace, (remaining * weights[index]) / totalWeight),
    )
    let handed = 0
    for (const [index, entry] of group.entries()) {
      add(entry.goalId, 'pace', portions[index])
      handed += portions[index]
    }
    let pool = remaining - handed
    for (const [index, entry] of group.entries()) {
      if (pool <= 0) break
      const extra = Math.min(entry.pace - portions[index], pool)
      if (extra > 0) {
        add(entry.goalId, 'pace', extra)
        pool -= extra
      }
    }
    remaining = Math.max(0, pool)
  }

  return result
}

/**
 * Before/after around one lowered wallet value.
 *
 * Worked example (kept in step with the backend's `spend-impact.spec.ts`) — a
 * wallet holding 22tr, 20tr set aside behind `car`, pace 20tr/month of which
 * only 2tr fits this month:
 *
 * | spend | contribution | set aside | goal claim |
 * |-------|--------------|-----------|------------|
 * | 0     | 2tr          | 20tr      | 22tr       |
 * | 2tr   | 0            | 20tr      | 20tr       |
 * | 5tr   | 0            | 17tr      | 17tr       |
 */
export function computeSpendImpact(
  claims: AssetGoalClaim[],
  assetValue: number,
  amount: number,
): LocalSpendImpact {
  const spend = Math.max(0, amount)
  const assetValueAfter = Math.max(0, assetValue - spend)

  // The percent basis is the UNSPENT wallet on both sides — see
  // `allocationValue` for why re-deriving it from the lowered value was wrong.
  const before = claimsAtValue(claims, assetValue, assetValue)
  const after = claimsAtValue(claims, assetValueAfter, assetValue)

  const names = new Map(claims.map((claim) => [claim.goalId, claim.goalName]))
  const goals: LocalGoalSpendImpact[] = []
  let totalReduction = 0
  let totalPaceReduction = 0
  let totalSetAsideReduction = 0

  let totalPaceBefore = 0
  let totalSetAsideBefore = 0

  for (const [goalId, beforeParts] of before) {
    const afterParts = after.get(goalId) ?? { setAside: 0, pace: 0 }

    // The BEFORE totals span every goal on the wallet, including those this
    // spend does not touch. They answer "what was this month's contribution
    // holding", which is a fact about the wallet, not about the spend — summing
    // only the affected goals would understate it whenever one goal absorbs the
    // whole bill.
    totalPaceBefore += beforeParts.pace
    totalSetAsideBefore += beforeParts.setAside

    const beforeValue = beforeParts.setAside + beforeParts.pace
    const afterValue = afterParts.setAside + afterParts.pace
    const reduction = Math.max(0, beforeValue - afterValue)
    if (reduction <= 0) continue

    // Which half gave way. The pace is squeezed out first — it can only ever
    // draw on free room — so a small spend shows a pace-only reduction and only
    // a larger one reaches what is set aside.
    const paceReduction = Math.max(0, beforeParts.pace - afterParts.pace)
    const setAsideReduction = Math.max(
      0,
      beforeParts.setAside - afterParts.setAside,
    )

    totalReduction += reduction
    totalPaceReduction += paceReduction
    totalSetAsideReduction += setAsideReduction
    goals.push({
      goalId,
      goalName: names.get(goalId) ?? '—',
      before: beforeValue,
      after: afterValue,
      paceBefore: beforeParts.pace,
      setAsideBefore: beforeParts.setAside,
      reduction,
      paceReduction,
      setAsideReduction,
    })
  }

  // Biggest loser first: the goal paying most for this spend is the one the
  // household needs to see without scanning.
  goals.sort((a, b) => b.reduction - a.reduction)

  return {
    assetValue,
    amount: spend,
    assetValueAfter,
    totalReduction,
    totalPaceReduction,
    totalSetAsideReduction,
    totalPaceBefore,
    totalSetAsideBefore,
    goals,
    exceedsWallet: spend > assetValue,
  }
}
