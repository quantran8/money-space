import { useTranslation } from 'react-i18next'

import { SpendImpactBar } from '@/features/cashflow/ui/components/spend-impact-bar'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useAssetGoalUsage } from '@/features/goals/hooks/use-asset-goal-usage'
import { computeSpendImpact } from '@/features/goals/model/spend-impact'
import { formatVndShort } from '@/shared/lib/format-money'

/**
 * What this outflow takes from the goals saving into the chosen wallet.
 *
 * An outflow outranks the goals sharing its wallet: the money does not vanish
 * from the household's picture, it stops being goal money. That trade is real
 * and it used to happen silently — the goal screen simply read lower afterwards,
 * with nothing connecting it to the bill someone had scheduled.
 *
 * **This form is the only place that explains it**, so the explanation must not
 * depend on a request finishing first. The figures are computed LOCALLY
 * (`computeSpendImpact`) from the goal-usage data the wallet picker already
 * loaded, so they appear the instant an amount is typed — no round trip, nothing
 * to race, and nothing stale to show while a request is in flight. Someone who
 * types an amount and saves immediately has still seen what it costs.
 *
 * When the wallet backs a goal but no amount is typed yet, the mechanism is
 * still stated in words — the household should know what this wallet does before
 * they decide the number.
 *
 * ## Answering "but the wallet still HAS money"
 *
 * The obvious objection to seeing a goal drop: the account clearly holds enough
 * to cover the bill, so why is a goal paying for it? Because a balance is not
 * the same as free money — most or all of it is already promised. Kept to ONE
 * quiet line under the headline: it answers the objection for whoever has it,
 * without taxing everyone else.
 *
 * ## Kept short on purpose
 *
 * This sits mid-form, between an amount and a save button, and it competes with
 * the household's patience — a block long enough to skim past has warned nobody.
 * It was 7 lines (title, cause, total, two split lines, a row per goal, a
 * reassurance) and is now 2–3: a headline carrying the whole decision, per-goal
 * lines only when more than one goal is affected, and the cause underneath.
 *
 * Dropped along the way: the "you can still record this" reassurance (nothing
 * here blocks anything, so saying so invited the doubt it answered) and the
 * `36,0 → 34,0` before/after pairs, which read as money being withdrawn from a
 * goal even when only the monthly contribution had moved.
 *
 * The order goals give way in is shown rather than explained: this month's
 * contribution goes first, and only then money already set aside. The
 * before → after per goal makes that visible without a paragraph about it.
 *
 * Deliberately NOT a warning, NOT a block, and it never gates the submit button.
 * The household may well go ahead — a bill is a bill. This states a consequence
 * and never a recommendation (Voice: never say someone should or should not
 * spend).
 */
export function GoalImpactNotice({
  assetId,
  amount,
}: {
  assetId?: string
  amount?: number
}) {
  const { t } = useTranslation()
  const { items, assetValue, claimedAmount, committedAmount, unassignedAmount } =
    useAssetGoalUsage(assetId)
  const { assets } = useAssets()

  // Nothing to say when no goal is saving into this wallet at all: spending
  // from it costs no goal anything, now or at any amount.
  const backsAGoal = claimedAmount > 0
  if (!assetId || !backsAGoal) {
    return null
  }

  const impact = computeSpendImpact(items, assetValue, amount ?? 0)
  const hasFigures = impact.totalReduction > 0
  const walletName =
    assets.find((asset) => asset.id === assetId)?.name ?? ''

  /**
   * Why a wallet with money in it still costs a goal.
   *
   * `unassignedAmount` — the balance minus everything the goals claim ALL IN,
   * money set aside plus what this month's paces will draw. Deliberately not
   * `freeAmount`, which only subtracts what is set aside: that figure answers
   * "what may a new allocation take", and using it here would state a
   * contradiction — "còn 32tr chưa gán" directly above a list showing every
   * đồng of those 32tr coming out of the goals.
   *
   * 0 means the whole balance is spoken for, which is the case that looks wrong
   * until it is said out loud.
   */
  /**
   * One line that carries the decision.
   *
   * The pace is always squeezed out first, so a spend that fits inside this
   * month's contribution is a month of saving reduced — not the goal moving
   * backwards. Leading with the milder, far more common case keeps the block
   * from crying wolf; the harsher headline appears only once set-aside money is
   * genuinely being taken back out, and names how much.
   */
  const headline =
    impact.totalSetAsideReduction > 0
      ? t('upcoming.complete.goalImpact.titleSetAside', {
          amount: formatVndShort(impact.totalReduction),
          setAside: formatVndShort(impact.totalSetAsideReduction),
        })
      : t('upcoming.complete.goalImpact.titlePace', {
          amount: formatVndShort(impact.totalReduction),
        })

  /**
   * Why a wallet with money in it still costs a goal, in ONE line.
   *
   * `unassignedAmount`, not `freeAmount`: the latter only subtracts what is set
   * aside, so it would claim money is free directly above a list showing that
   * same money coming out of the goals.
   */
  const subtitle = t(
    unassignedAmount > 0
      ? 'upcoming.complete.goalImpact.subtitleSomeFree'
      : 'upcoming.complete.goalImpact.subtitle',
    {
      wallet: walletName,
      value: formatVndShort(assetValue),
      free: formatVndShort(unassignedAmount),
    },
  )

  /**
   * Per goal, saying WHICH part shrinks — never "36tr → 34tr".
   *
   * A before/after pair reads as money being taken out of the goal's balance,
   * which is exactly wrong when only the monthly contribution moved: the same
   * "36,0 → 34,0" appeared whether 2tr of pace was skipped or 2tr of set-aside
   * money was withdrawn. Naming the part removes the ambiguity that a pair of
   * totals cannot.
   */
  const goalLine = (goal: (typeof impact.goals)[number]) => {
    if (goal.paceReduction > 0 && goal.setAsideReduction > 0) {
      return t('upcoming.complete.goalImpact.goalBoth', {
        name: goal.goalName,
        pace: formatVndShort(goal.paceReduction),
        setAside: formatVndShort(goal.setAsideReduction),
      })
    }
    return t(
      goal.setAsideReduction > 0
        ? 'upcoming.complete.goalImpact.goalSetAside'
        : 'upcoming.complete.goalImpact.goalPace',
      {
        name: goal.goalName,
        amount: formatVndShort(goal.reduction),
      },
    )
  }

  return (
    <div className="rounded-control bg-surface2 px-3 py-2.5">
      {hasFigures ? (
        <>
          <p className="text-[13px] font-medium leading-5">{headline}</p>

          {/* The wallet, with the part this spend takes marked off. Carries the
              proportion, which words cannot: 4tr out of 52tr and 4tr out of 5tr
              read identically as text and are not remotely the same situation. */}
          <SpendImpactBar
            className="mt-2"
            spendFromPace={impact.totalPaceReduction}
            spendFromSetAside={impact.totalSetAsideReduction}
            goalRemaining={Math.max(
              0,
              committedAmount - impact.totalReduction,
            )}
            unassigned={unassignedAmount}
          />

          {/* Only when more than one goal shares the wallet. With a single goal
              the headline already said everything, and repeating it under a
              name is a line nobody needs to read.

              The dot ties each line to its slice in the bar above, so the bar
              needs no legend of its own — a legend here would cost more lines
              than the bar saves. */}
          {impact.goals.length > 1 ? (
            <ul className="mt-1.5 space-y-0.5">
              {impact.goals.map((goal) => (
                <li
                  key={goal.goalId}
                  className="flex items-center gap-1.5 text-[12px] leading-5 text-ink2"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{
                      background:
                        goal.setAsideReduction > 0
                          ? 'var(--alert)'
                          : 'var(--ink3)',
                    }}
                    aria-hidden="true"
                  />
                  {goalLine(goal)}
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-1.5 text-[12px] leading-5 text-ink3">{subtitle}</p>

          {/* A shortfall is a different fact from "your goal shrinks", so it
              gets its own line rather than being folded into the headline. */}
          {impact.exceedsWallet ? (
            <p className="mt-1.5 text-[12px] leading-5 text-alert">
              {t('upcoming.complete.goalImpact.exceedsWallet', {
                value: formatVndShort(impact.assetValue),
              })}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-[13px] leading-5 text-ink2">
          {t('upcoming.complete.goalImpact.pending')}
        </p>
      )}
    </div>
  )
}