import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SpendImpactBar } from '@/features/cashflow/ui/components/spend-impact-bar'
import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useAssetGoalUsage } from '@money-space/core/features/goals/hooks/use-asset-goal-usage'
import { computeSpendImpact } from '@money-space/core/features/goals/model/spend-impact'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

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
 * ## The shape: allocate the SPEND, then show only what changed
 *
 * The block leads with the spend and divides it into where the money comes
 * from — this month's contribution first, set-aside money only once the pace is
 * used up. That ordering is the entire mechanism, and a divided bar states it
 * without a paragraph.
 *
 * Underneath, before → after for the things that ACTUALLY MOVED, and nothing
 * else. A spend that fits inside this month's contribution moves one figure, so
 * it shows one row; the goal's own total is untouched and saying "303,6 →
 * 303,6" would manufacture a consequence. Only once set-aside money is reached
 * does the goal total appear as a second row — which is exactly when the
 * household needs to see it.
 *
 * ## Answering "but the wallet still HAS money"
 *
 * The obvious objection to seeing a goal drop: the account clearly holds enough
 * to cover the bill, so why is a goal paying for it? Because a balance is not
 * the same as free money — most or all of it is already promised. Kept to ONE
 * quiet line at the end: it answers the objection for whoever has it, without
 * taxing everyone else.
 *
 * Deliberately NOT a warning, NOT a block, and it never gates the submit button.
 * The household may well go ahead — a bill is a bill. This states a consequence
 * and never a recommendation (Voice: never say someone should or should not
 * spend). Set-aside money is marked `--attention`, never `--alert`: scheduling a
 * bill is not an error (§16).
 */
export function GoalImpactNotice({
  assetId,
  amount,
}: {
  assetId?: string
  amount?: number
}) {
  const { t } = useTranslation()
  const { items, assetValue, claimedAmount, unassignedAmount } =
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
  const walletName = assets.find((asset) => asset.id === assetId)?.name ?? ''

  if (!hasFigures) {
    return (
      <div className="rounded-sunk bg-sunk px-4 py-3">
        <p className="text-[13px] leading-5 text-ink2">
          {t('upcoming.complete.goalImpact.pending')}
        </p>
      </div>
    )
  }

  // The pace is always squeezed first, so this is the figure that moves in every
  // case — which is why it leads. `totalPaceBefore` is what the contribution was
  // HOLDING, not what the spend takes from it.
  const reachesSetAside = impact.totalSetAsideReduction > 0

  // The goals' own set-aside total on this wallet. Only shown when set-aside
  // money is actually reached — otherwise it does not move, and a row saying so
  // would invent a consequence.
  const goalTotalBefore = impact.totalSetAsideBefore

  // One goal is the common case and its name is already in the heading, so the
  // per-goal breakdown only earns its lines when the wallet feeds several.
  const showPerGoal = impact.goals.length > 1

  return (
    <section className="rounded-sunk bg-sunk p-4 sm:p-5">
      {/* The spend, and the one-phrase answer to where it comes from. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-vi">{t('upcoming.complete.goalImpact.spendLabel')}</p>
          <p className="money-number mt-1 text-[26px]">
            {formatVndShort(impact.totalReduction)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-ink3">{t('upcoming.complete.goalImpact.takenFrom')}</p>
          <p
            className={`mt-1 text-[13px] font-medium ${
              reachesSetAside ? 'text-attention' : 'text-accent'
            }`}
          >
            {reachesSetAside
              ? t('upcoming.complete.goalImpact.twoSources')
              : t('upcoming.complete.goalImpact.paceOnly')}
          </p>
        </div>
      </div>

      {/* The spend divided across its sources — the mechanism, drawn. */}
      <div className="mt-5">
        <p className="text-[11px] text-ink3">
          {t('upcoming.complete.goalImpact.allocationLabel', {
            amount: formatVndShort(impact.totalReduction),
          })}
        </p>
        <SpendImpactBar
          className="mt-2"
          fromPace={impact.totalPaceReduction}
          fromSetAside={impact.totalSetAsideReduction}
          formatAmount={formatVndShort}
        />

        {/* A legend only when there are two slices to tell apart. */}
        {reachesSetAside && impact.totalPaceReduction > 0 ? (
          <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
            <LegendItem fill="var(--accent)" label={t('upcoming.complete.goalImpact.legendPace')} />
            <LegendItem
              fill="var(--attention)"
              label={t('upcoming.complete.goalImpact.legendSetAside')}
            />
          </div>
        ) : null}
      </div>

      {/* Only the consequences that actually moved. */}
      <div className="mt-6 space-y-5">
        <ChangeRow
          label={t('upcoming.complete.goalImpact.paceRemainingLabel')}
          before={formatVndShort(impact.totalPaceBefore)}
          after={formatVndShort(
            Math.max(0, impact.totalPaceBefore - impact.totalPaceReduction),
          )}
        />

        {reachesSetAside ? (
          <ChangeRow
            label={t('upcoming.complete.goalImpact.goalTotalLabel')}
            before={formatVndShort(goalTotalBefore)}
            after={formatVndShort(Math.max(0, goalTotalBefore - impact.totalSetAsideReduction))}
            delta={`−${formatVndShort(impact.totalSetAsideReduction)}`}
          />
        ) : null}
      </div>

      {/* Which goal pays what, when the wallet feeds more than one. */}
      {showPerGoal ? (
        <ul className="mt-5 space-y-1 border-t border-hair pt-4">
          {impact.goals.map((goal) => (
            <li
              key={goal.goalId}
              className="flex items-baseline justify-between gap-4 text-[12px] leading-5"
            >
              <span className="min-w-0 truncate text-ink2">{goal.goalName}</span>
              <span className="num shrink-0 text-ink2">
                {goal.setAsideReduction > 0 && goal.paceReduction > 0
                  ? t('upcoming.complete.goalImpact.goalBoth', {
                      pace: formatVndShort(goal.paceReduction),
                      setAside: formatVndShort(goal.setAsideReduction),
                    })
                  : t(
                      goal.setAsideReduction > 0
                        ? 'upcoming.complete.goalImpact.goalSetAsideShort'
                        : 'upcoming.complete.goalImpact.goalPaceShort',
                      { amount: formatVndShort(goal.reduction) },
                    )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* The sentence that explains the whole thing, sized to be read. */}
      <p className="mt-4 text-[12px] leading-5 text-ink2">
        {reachesSetAside
          ? t('upcoming.complete.goalImpact.explainSetAside', {
              pace: formatVndShort(impact.totalPaceReduction),
              setAside: formatVndShort(impact.totalSetAsideReduction),
            })
          : t('upcoming.complete.goalImpact.explainPace')}
      </p>

      {/* Why a wallet with money in it still costs a goal. `unassignedAmount`,
          not `freeAmount`: the latter only subtracts what is set aside, so it
          would claim money is free directly above a list showing that same money
          coming out of the goals. */}
      <p className="mt-2 text-[12px] leading-5 text-ink3">
        {t(
          unassignedAmount > 0
            ? 'upcoming.complete.goalImpact.subtitleSomeFree'
            : 'upcoming.complete.goalImpact.subtitle',
          {
            wallet: walletName,
            value: formatVndShort(assetValue),
            free: formatVndShort(unassignedAmount),
          },
        )}
      </p>

      {/* A shortfall is a different fact from "your goal shrinks", so it gets
          its own line rather than being folded into anything above. */}
      {impact.exceedsWallet ? (
        <p className="mt-2 text-[12px] leading-5 text-alert">
          {t('upcoming.complete.goalImpact.exceedsWallet', {
            value: formatVndShort(impact.assetValue),
          })}
        </p>
      ) : null}
    </section>
  )
}

/** One before → after pair. The arrow carries the direction, so no word has to. */
function ChangeRow({
  label,
  before,
  after,
  delta,
}: {
  label: string
  before: string
  after: string
  delta?: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-1">
      <div className="min-w-0">
        <p className="text-[11px] text-ink3">{label}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="num text-[15px] text-ink3">{before}</span>
          <ArrowRight className="size-4 shrink-0 text-ink3" strokeWidth={1.5} aria-hidden="true" />
          <span className="money-number text-[22px]">{after}</span>
        </div>
      </div>
      {delta ? <span className="num mb-1 text-[12px] font-medium text-attention">{delta}</span> : null}
    </div>
  )
}

function LegendItem({ fill, label }: { fill: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-ink2">
      <span className="size-2 shrink-0 rounded-full" style={{ background: fill }} />
      {label}
    </span>
  )
}
