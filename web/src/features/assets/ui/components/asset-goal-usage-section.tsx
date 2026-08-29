import { useState } from 'react'
import { ChevronDown, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/ui/empty-state'
import { MoneyCompositionRing } from '@/components/ui/money-composition-ring'
import { Skeleton } from '@/components/ui/skeleton'
import { useAssetGoalUsage } from '@money-space/core/features/goals/hooks/use-asset-goal-usage'
import type { AssetGoalClaim } from '@money-space/core/features/goals/api/goals.repository'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/** The four-column grid, shared by the header, every row and the total. */
const COLS =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-2 sm:grid-cols-[minmax(180px,1.3fr)_minmax(110px,.9fr)_minmax(120px,1fr)_minmax(110px,.9fr)]'

/**
 * What this asset is already promised to, and how much of it is still free.
 *
 * The relationship used to be visible only from the goal's side: opening an
 * account showed a balance with no hint that most of it was spoken for, and the
 * household had to open every goal in turn to work out what was actually theirs
 * to use. This is the question people bring TO the asset page — "can I use
 * this?" — so it is answered here.
 *
 * The figure per goal is a SUM OF TWO UNLIKE THINGS, and showing only the sum
 * is what made this panel unreadable: money already sitting in the asset, plus
 * what this month's pace is drawing from what is left. A goal could read 100%
 * of the asset while a third of that was a contribution the month had not made
 * yet. So the two halves are now columns, and they add up in front of the
 * reader — the total row is the proof that 90% + 10% = 100%.
 *
 * `freeAmount` is the same subtraction the server enforces when a new claim is
 * written, so what this reports as free is exactly what a new goal would be
 * allowed to take.
 */
export function AssetGoalUsageSection({ assetId }: { assetId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, assetValue, committedAmount, unassignedAmount, isLoading } =
    useAssetGoalUsage(assetId)
  const [open, setOpen] = useState(true)

  if (isLoading) {
    return (
      <div>
        <p className="t-body-sm text-ink2">{t('assets.detail.goals.sectionTitle')}</p>
        <div className="mt-5 flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-control" />
          ))}
        </div>
      </div>
    )
  }

  // Nothing claims it. Said plainly rather than hidden: "all of it is yours to
  // use" is an answer worth giving, and an absent panel would leave the question
  // open.
  if (items.length === 0) {
    return (
      <div>
        <p className="t-body-sm text-ink2">{t('assets.detail.goals.sectionTitle')}</p>
        <EmptyState icon={Target} className="mt-5">
          {t('assets.detail.goals.empty')}
        </EmptyState>
      </div>
    )
  }

  const share = (value: number) =>
    assetValue > 0 ? (Math.max(value, 0) / assetValue) * 100 : 0

  /**
   * A share that rounds to 0% or 100% must not READ as none or all — an asset
   * that is 99,6% spoken for still has something free, and rounding it away is
   * the one direction this figure must not err in.
   */
  const percentLabel = (value: number) => {
    const value_ = share(value)
    if (value_ > 0 && value_ < 1) return '<1%'
    if (value_ > 99 && value_ < 100) return '>99%'
    // One decimal only when the integer would hide a real difference between
    // two goals (33,3% vs 33,4%); whole percents stay whole.
    const rounded = Math.round(value_ * 10) / 10
    return Number.isInteger(rounded) ? `${rounded}%` : `${rounded}`.replace('.', ',') + '%'
  }

  const paceOf = (item: AssetGoalClaim) => Math.max(item.countedValue - item.currentValue, 0)
  const setAsideTotal = items.reduce((sum, item) => sum + item.currentValue, 0)
  const paceTotal = items.reduce((sum, item) => sum + paceOf(item), 0)
  const countedTotal = items.reduce((sum, item) => sum + item.countedValue, 0)
  const declaredTotal = items.reduce(
    (sum, item) => sum + (item.monthlyContribution ?? 0),
    0,
  )

  /** Each goal's share OF WHAT IS CONTRIBUTED — not of the asset (§ the bar). */
  const sliceOf = (value: number) =>
    countedTotal > 0 ? (Math.max(value, 0) / countedTotal) * 100 : 0

  // A wallet may hold a negative balance — editing a back-dated event replays it
  // from its opening balance and an overdrawn result is recorded, not clamped.
  // Every figure below is then legitimately 0 (nothing is there to be claimed),
  // which reads as a broken panel unless the reason is stated.
  const isOverdrawn = assetValue < 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6">
        <p className="t-body-sm text-ink2">{t('assets.detail.goals.sectionTitle')}</p>
        <p
          className={cn(
            'num shrink-0 t-caption',
            isOverdrawn ? 'text-attention-ink' : 'text-ink3',
          )}
        >
          {isOverdrawn
            ? t('assets.detail.goals.assetOverdrawn', {
                // The label already says "âm", so show the magnitude rather than
                // repeating the sign.
                value: formatVndShort(Math.abs(assetValue)),
              })
            : t('assets.detail.goals.assetMeta', { value: formatVndShort(assetValue) })}
        </p>
      </div>

      {/* Why every figure below is 0, said before the reader has to wonder. */}
      {isOverdrawn ? (
        <p className="mt-2 t-body-sm text-attention-ink">
          {t('assets.detail.goals.overdrawnNote')}
        </p>
      ) : null}

      {/* The answer first: how much is still the household's to use, with the
          ring stating the same split as a shape. `committedAmount` /
          `unassignedAmount`, NOT `claimed` / `free`: the labels here say "đã
          dành cho mục tiêu" and "còn tự do", which is the all-in question —
          money set aside AND what this month's paces will draw. `freeAmount`
          answers a different one (what a NEW allocation may still take), and
          showing it under this label contradicted the dashboard. */}
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <MoneyCompositionRing
          className="shrink-0 sm:w-[170px] sm:grid-cols-1"
          segments={[
            {
              key: 'free',
              label: t('assets.detail.goals.freeTitle'),
              amount: unassignedAmount,
              percent: Math.round(share(unassignedAmount)),
              percentLabel: percentLabel(unassignedAmount),
              tone: 'flexible',
            },
            {
              key: 'claimed',
              label: t('assets.detail.goals.claimed'),
              amount: committedAmount,
              percent: Math.round(share(committedAmount)),
              percentLabel: percentLabel(committedAmount),
              tone: 'committed',
            },
          ]}
          ariaLabel={t('assets.detail.goals.aria', {
            claimed: formatVndShort(committedAmount),
            free: formatVndShort(unassignedAmount),
          })}
          centerLabel={t('assets.detail.goals.ringCenter')}
          formatAmount={formatVndShort}
          legend={false}
        />

        <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="t-body text-ink2">{t('assets.detail.goals.freeTitle')}</p>
            <p className="num mt-1 t-figure">{formatVndShort(unassignedAmount)}</p>
            <p className="mt-1.5 t-body-sm text-ink3">
              {t('assets.detail.goals.freeAllContributed', {
                percent: percentLabel(committedAmount),
              })}
            </p>
          </div>

          <div className="shrink-0 text-right t-body-sm text-ink2">
            {t('assets.detail.goals.contributedSide')}
            <span className="num block t-subhead text-ink">
              {formatVndShort(committedAmount)}
            </span>
            {t('assets.detail.goals.goalCount', { count: items.length })}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-divider" />

      {/* The summary line doubles as the disclosure: the sum, and what it is
          made of, before any of the detail. */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="s-tap flex w-full items-center gap-5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block t-subtitle">{t('assets.detail.goals.summaryTitle')}</span>
          <span className="num mt-0.5 block t-body-sm text-ink3">
            {t('assets.detail.goals.summarySub', {
              count: items.length,
              initial: formatVndShort(setAsideTotal),
              month: formatVndShort(paceTotal),
            })}
          </span>
        </span>
        <span className="num shrink-0 text-right">
          <span className="block t-subhead">{formatVndShort(countedTotal)}</span>
          <span className="mt-0.5 block t-body-sm text-ink3">
            {t('assets.detail.goals.ofAsset', { percent: percentLabel(countedTotal) })}
          </span>
        </span>
        <ChevronDown
          className={cn('size-5 shrink-0 text-ink2 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="pt-2">
          {/* Column headers on wide screens only: below `sm` each row stacks and
              the cells carry their own labels instead. */}
          <div className={cn(COLS, 'hidden pb-2 t-caption text-ink3 sm:grid')} aria-hidden>
            <div>{t('assets.detail.goals.goalColumn')}</div>
            <div className="text-right">{t('assets.detail.goals.initial')}</div>
            <div className="text-right">{t('assets.detail.goals.thisMonth')}</div>
            <div className="text-right">{t('assets.detail.goals.totalIntoGoal')}</div>
          </div>

          <ul>
            {items.map((item, index) => {
              const pace = paceOf(item)
              return (
                <li key={item.allocationId} className={cn(index > 0 && 'border-t border-divider')}>
                  {/* A button, not a row with an onClick: this is the one link
                      out of the panel and it has to be reachable by keyboard. */}
                  <button
                    type="button"
                    onClick={() => navigate(`/goals/${item.goalId}`)}
                    className={cn(
                      COLS,
                      'w-full items-center rounded-control py-3 text-left outline-none transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-action',
                    )}
                  >
                    <span className="col-span-2 flex min-w-0 items-start gap-3 sm:col-span-1">
                      <Target className="mt-[3px] size-[18px] shrink-0 text-ink2" strokeWidth={1.6} aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate t-body font-medium">{item.goalName}</span>
                        {/* What this goal ends up holding as a share of the
                            asset, stated once in words so the columns of
                            percentages below never have to be added up. */}
                        <span className="num mt-0.5 block t-caption text-ink3">
                          {t('assets.detail.goals.noteAfterMonth', {
                            percent: percentLabel(item.countedValue),
                          })}
                        </span>
                      </span>
                    </span>

                    <Cell
                      label={t('assets.detail.goals.initial')}
                      value={formatVndShort(item.currentValue)}
                      note={t('assets.detail.goals.ofAsset', {
                        percent: percentLabel(item.currentValue),
                      })}
                    />

                    <Cell
                      label={t('assets.detail.goals.thisMonth')}
                      value={formatVndShort(pace)}
                      /* Drawn against declared: "1,5 / 20 tr tháng" says the
                         pace was only partly met, which a bare figure cannot. */
                      note={
                        item.monthlyContribution
                          ? t('assets.detail.goals.paceOfDeclared', {
                              drawn: formatVndShort(pace),
                              declared: formatVndShort(item.monthlyContribution),
                            })
                          : undefined
                      }
                    />

                    <Cell
                      label={t('assets.detail.goals.totalIntoGoal')}
                      value={formatVndShort(item.countedValue)}
                      note={t('assets.detail.goals.ofAsset', {
                        percent: percentLabel(item.countedValue),
                      })}
                    />
                  </button>
                </li>
              )
            })}
          </ul>

          {/* The proof. Two columns that look unrelated add to the third, and
              the reader can see it happen rather than being told. */}
          <div className={cn(COLS, 'border-t border-divider pt-4')}>
            <p className="col-span-2 t-body font-medium sm:col-span-1">
              {t('assets.detail.goals.totalRow')}
            </p>
            <Cell
              label={t('assets.detail.goals.initial')}
              value={formatVndShort(setAsideTotal)}
              note={t('assets.detail.goals.ofAsset', { percent: percentLabel(setAsideTotal) })}
              strong
            />
            <Cell
              label={t('assets.detail.goals.thisMonth')}
              value={formatVndShort(paceTotal)}
              note={
                declaredTotal > 0
                  ? t('assets.detail.goals.paceOfDeclared', {
                      drawn: formatVndShort(paceTotal),
                      declared: formatVndShort(declaredTotal),
                    })
                  : undefined
              }
              strong
            />
            <Cell
              label={t('assets.detail.goals.totalIntoGoal')}
              value={formatVndShort(countedTotal)}
              note={t('assets.detail.goals.ofAsset', { percent: percentLabel(countedTotal) })}
              strong
            />
          </div>

          {/* How the contributed total splits between the goals. A different
              question from the columns above — those measure against the ASSET,
              this measures against what is contributed — so it is a separate
              block with its own label rather than a fourth column. */}
          {items.length > 1 ? (
            <div className="mt-6">
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 t-caption text-ink3">
                <span>
                  {t('assets.detail.goals.compositionLabel', {
                    amount: formatVndShort(countedTotal),
                  })}
                </span>
              </div>

              <div className="mt-2 flex h-3 overflow-hidden">
                {items.map((item, index) => (
                  <span
                    key={item.allocationId}
                    className="h-full text-data-primary"
                    style={{
                      width: `${sliceOf(item.countedValue)}%`,
                      // Each goal steps down in weight rather than taking a
                      // colour of its own: this is one quantity split, not a
                      // set of categories (§4).
                      opacity: 1 - index * 0.26,
                      backgroundImage:
                        'repeating-linear-gradient(to right, currentColor 0 2px, transparent 2px 6px)',
                    }}
                  />
                ))}
              </div>

              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {items.map((item, index) => (
                  <li key={item.allocationId} className="flex items-center gap-2 t-caption text-ink2">
                    <span
                      className="size-[7px] shrink-0 rounded-full bg-data-primary"
                      style={{ opacity: 1 - index * 0.26 }}
                      aria-hidden
                    />
                    <span className="num truncate">
                      {item.goalName} · {formatVndShort(item.countedValue)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/**
 * One number in the table.
 *
 * Carries its own label below `sm`, where the four columns stack and a bare
 * figure would have nothing to say which of the three it is.
 */
function Cell({
  label,
  value,
  note,
  strong,
}: {
  label: string
  value: string
  note?: string
  strong?: boolean
}) {
  return (
    <span className="text-right">
      <span className="block t-caption text-ink3 sm:hidden">{label}</span>
      <span className={cn('num block t-body', strong && 'font-medium')}>{value}</span>
      {note ? <span className="num mt-0.5 block t-caption text-ink3">{note}</span> : null}
    </span>
  )
}
