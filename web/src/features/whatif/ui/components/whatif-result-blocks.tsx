import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChartNoAxesColumnIncreasing,
  CircleHelp,
  Clock3,
  ReceiptText,
  Target,
  WalletCards,
} from 'lucide-react'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { AssumptionsNote } from '@/features/forecast/ui/components/assumptions-note'
import {
  RESULT_TYPE_CLASS,
  type WhatIfAtRisk,
  type WhatIfGoalCost,
  type WhatIfResult,
} from '@money-space/core/features/whatif/model/whatif.types'
import type {
  AssumptionCode,
  CalculationAssumption,
} from '@money-space/core/features/forecast/model/forecast.types'
import { motion } from 'motion/react'

import {
  CountUp,
  GrowBar,
  RevealSequence,
  SECTION_COUNT_DELAY,
  easeOut,
  useRevealed,
} from '@/components/ui/motion'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The result, by CONSEQUENCE first.
 *
 * The earlier version led with the lowest projected balance and hung
 * everything else off it. That is the engine's most important number, but it
 * is not the reader's first question: someone weighing a purchase wants to
 * know *what this breaks*, and a balance figure only answers that once they
 * have worked out which bill it lands before. So the order is now
 *
 *   1. how many things are affected, split into the two kinds
 *   2. WHICH bills, and by how much            — obligations
 *   3. WHICH goals, and how much later         — promises
 *   4. where the money comes from              — evidence for 2 and 3
 *   5. the balance bridge                      — the arithmetic underneath
 *
 * Bills before goals because a bill going unpaid is an obligation and a goal
 * slipping is a promise the household made to itself — §16's ordering, and the
 * reason bills carry `alert` while goals carry `attention`.
 *
 * Funding source sits at 4 rather than 1 because it is the ANSWER'S EVIDENCE:
 * it explains where the costs in 2 and 3 came from. Leading with it would open
 * on bookkeeping.
 *
 * Every block reports CONSEQUENCE. None says whether to buy — no
 * recommendation, no verdict. `resultType` only picks a colour.
 */
export function WhatIfResultBlocks({ result }: { result: WhatIfResult }) {
  const { t } = useTranslation()
  const { before, after, goalImpact, fundingSource } = result

  /**
   * The spend is the same figure on both sides of the question, so it is read
   * off the input rather than differenced out of two balances — a subtraction
   * that would drift the moment the engine's rounding did.
   */
  const spend = result.input.amount

  const bills = result.newlyAtRisk
  const goals = goalImpact.goals
  const affected = bills.length + goals.length

  return (
    /*
      One section at a time, each waiting for the one above it to FINISH.

      A stagger was tried first and is the wrong tool: it offsets children by a
      fixed amount and lets them overlap, so with figures counting for 1.6s
      every section ended up running at once and the screen read as a twitch.
      `RevealSequence` does not mount a section until the previous one has
      settled, which is what lets the reader follow each in turn — the order is
      the argument here (what broke, then what slipped, then where the money
      came from), so it is worth the seconds.
    */
    <RevealSequence className="s-card-gap flex flex-col" stepMs={1900}>
      {/* 1 — How much is at stake, before any detail. Two counts, because a
          bill and a goal are different kinds of consequence and summing them
          into one number would flatten that. */}
      <Panel>
        <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-[minmax(0,0.8fr)_repeat(2,minmax(0,1fr))] sm:gap-6">
          <div className="col-span-2 sm:col-span-1">
            <p className="t-caption-sm text-ink3">{t('whatif.impact.summary')}</p>
            <p
              className={cn(
                'money-number mt-0.5 t-metric',
                affected > 0 ? RESULT_TYPE_CLASS[result.resultType] : undefined,
              )}
            >
              {affected > 0 ? t('whatif.impact.summaryValue', { count: affected }) : '—'}
            </p>
          </div>
          <div className="sm:border-l sm:border-divider sm:pl-6">
            <p className="money-number t-subhead">{bills.length}</p>
            <p className="mt-0.5 t-caption-sm text-ink3">{t('whatif.impact.bills')}</p>
          </div>
          <div className="border-l border-divider pl-4 sm:pl-6">
            <p className="money-number t-subhead">{goals.length}</p>
            <p className="mt-0.5 t-caption-sm text-ink3">{t('whatif.impact.goals')}</p>
          </div>
        </div>
        {affected === 0 ? (
          <p className="mt-3 t-body-sm text-ink2">{t('whatif.impact.none')}</p>
        ) : null}
      </Panel>

      {/* 2 — WHICH bills stop being payable. "Something would not be covered"
          is enough to worry someone and not enough to act on: they cannot move
          a bill or top up an account without knowing which and when. Only what
          this spend actually breaks is listed — an item already going unpaid is
          not this purchase's doing. */}
      {bills.length > 0 ? <BillsBlock bills={bills} /> : null}

      {/* Something is short, but this spend did not cause it — say so without a
          list that would misattribute the blame. */}
      {bills.length === 0 && !after.obligationsCovered ? (
        <Panel>
          <p className="t-body-sm text-attention-ink">
            {t('whatif.obligations.notCovered')}
          </p>
        </Panel>
      ) : null}

      {/* 3 — What the goals give up: money AND time, per goal. Measured across
          every flexible wallet, since what-if names no single one. */}
      {goals.length > 0 ? <GoalsBlock goals={goals} /> : null}

      {/* 4 — Where the money comes from. The evidence behind blocks 2 and 3. */}
      <FundingSourceBlock
        spend={spend}
        fundingSource={fundingSource}
        uncovered={goalImpact.uncovered}
      />

      {/* 5 — The arithmetic underneath: balance before → after, and where it
          bottoms out afterwards. */}
      <Panel>
        <PanelHead
          icon={
            <ChartNoAxesColumnIncreasing className="size-5 shrink-0 stroke-[1.7] text-ink2" />
          }
          title={t('whatif.cashflow.title')}
          meta={result.input.plannedDate}
        />
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-5">
          <BalanceBlock
            label={t('whatif.cashflow.before')}
            value={before.lowestProjectedBalance}
            /* The before bar is always full: it is the reference the after bar
             is read against, not a quantity of its own. */
            fillClass="bg-committed"
            share={100}
          />
          <div className="flex items-center justify-center gap-3 text-ink2 sm:flex-col sm:gap-1.5">
            <span className="money-number t-body-sm font-medium">
              −{formatVndShort(spend)}
            </span>
            <span aria-hidden="true" className="t-subhead text-ink3">
              →
            </span>
          </div>
          <BalanceBlock
            label={t('whatif.cashflow.after')}
            value={after.lowestProjectedBalance}
            fillClass="bg-data-primary"
            share={barShare(after.lowestProjectedBalance, before.lowestProjectedBalance)}
            tone={RESULT_TYPE_CLASS[result.resultType]}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-2.5 border-t border-divider pt-3.5">
          <span className="t-caption-sm text-ink3">{t('whatif.cashflow.lowest')}</span>
          <span className="money-number t-subhead text-attention-ink">
            {formatVndShort(after.lowestProjectedBalance)}
          </span>
          <span className="money-number t-caption-sm text-ink3">
            {after.lowestProjectedBalanceDate}
          </span>
        </div>
      </Panel>

      {/* 6 — Assumptions */}
      <AssumptionsNote assumptions={whatIfAssumptions(result.assumptions)} />
    </RevealSequence>
  )
}

/**
 * Card heading: an icon beside the section's `<h2>`, and one piece of metadata
 * to the right.
 *
 * Wraps `PanelHeader` rather than re-deriving it, so these sections carry the
 * same `t-title` heading as every other card in the app — on a full screen a
 * section title is a real heading, not the bold line a cramped modal could
 * afford. The icon rides with the title so the two read as one label.
 */
function PanelHead({
  icon,
  title,
  meta,
}: {
  icon: React.ReactNode
  title: string
  meta?: string
}) {
  return (
    <PanelHeader
      className="mb-4"
      title={
        <span className="flex items-center gap-2.5">
          {icon}
          {title}
        </span>
      }
      meta={meta}
    />
  )
}

/**
 * Three figures that size the block before the rows are read.
 *
 * Equal weight, because none of them outranks the others (02-components §4 —
 * metric cells at the same level share a treatment).
 */
function DomainSummary({
  items,
}: {
  items: {
    /** Static fallback — used verbatim when `count` is absent. */
    value: string
    /**
     * The figure to count up to, with its own formatter. Omitted when there is
     * nothing to count: an em-dash for "not measurable" has no magnitude, and
     * animating it would be motion for its own sake.
     */
    count?: { to: number; format: (current: number) => string }
    label: string
    tone?: string
  }[]
}) {
  return (
    <div className="mb-2.5 grid grid-cols-2 sm:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'pb-2.5 pr-4',
            index > 0 && 'border-l border-divider pl-4',
            // The third cell wraps to its own row on a phone, so it takes a top
            // rule instead of the left one it would otherwise carry mid-row.
            index === 2 &&
              'col-span-2 border-l-0 border-t border-divider pl-0 pt-3 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0',
          )}
        >
          <p className={cn('money-number t-metric', item.tone)}>
            {item.count ? (
              <CountUp
              value={item.count.to}
              format={item.count.format}
              delay={SECTION_COUNT_DELAY}
            />
            ) : (
              item.value
            )}
          </p>
          <p className="mt-0.5 t-caption-sm text-ink3">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * Rows past the first two, behind a disclosure.
 *
 * Two is what fits before the block starts competing with the one after it. A
 * household with eight affected goals still gets all eight — they are one tap
 * away, and the summary above already counted them, so nothing is hidden that
 * changes the answer.
 */
const VISIBLE_ROWS = 2

function RowList<T>({
  rows,
  keyOf,
  render,
}: {
  rows: T[]
  keyOf: (row: T) => string
  render: (row: T) => React.ReactNode
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const head = rows.slice(0, VISIBLE_ROWS)
  const rest = rows.slice(VISIBLE_ROWS)

  return (
    <div className="flex flex-col">
      {head.map((row) => (
        <div
          key={keyOf(row)}
          className="grid grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.4fr)] items-center gap-3 border-t border-divider py-3 first:border-t-0 sm:grid-cols-[minmax(8.75rem,1fr)_minmax(0,1.4fr)] sm:gap-5"
        >
          {render(row)}
        </div>
      ))}
      {rest.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="flex min-h-11 items-center gap-2 border-t border-divider text-left t-caption-sm text-ink2"
          >
            <span
              aria-hidden="true"
              className={cn(
                't-caption text-ink3 transition-transform',
                expanded && 'rotate-90',
              )}
            >
              ›
            </span>
            {t('whatif.impact.showMore', { count: rest.length })}
          </button>
          {expanded
            ? rest.map((row) => (
                <div
                  key={keyOf(row)}
                  className="grid grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.4fr)] items-center gap-3 border-t border-divider py-3 sm:grid-cols-[minmax(8.75rem,1fr)_minmax(0,1.4fr)] sm:gap-5"
                >
                  {render(row)}
                </div>
              ))
            : null}
        </>
      ) : null}
    </div>
  )
}

/**
 * The obligations this spend breaks.
 *
 * Each row states the balance when the item comes due against what it needs,
 * then the shortfall on its own — the balance/need pair says how close it came,
 * the shortfall says what to top up, and neither substitutes for the other.
 */
function BillsBlock({ bills }: { bills: WhatIfAtRisk[] }) {
  const { t } = useTranslation()
  const shortTotal = bills.reduce((sum, bill) => sum + bill.shortfall, 0)
  const shortMax = Math.max(...bills.map((bill) => bill.shortfall))

  return (
    <Panel>
      <PanelHead
        icon={<ReceiptText className="size-5 shrink-0 stroke-[1.7] text-alert-ink" />}
        title={t('whatif.bills.title')}
        meta={t('whatif.bills.count', { count: bills.length })}
      />
      <DomainSummary
        items={[
          {
            value: String(bills.length),
            count: { to: bills.length, format: (n) => String(Math.round(n)) },
            label: t('whatif.bills.affected'),
          },
          {
            value: formatVndShort(shortTotal),
            count: { to: shortTotal, format: formatVndShort },
            label: t('whatif.bills.shortTotal'),
          },
          {
            value: formatVndShort(shortMax),
            count: { to: shortMax, format: formatVndShort },
            label: t('whatif.bills.shortMax'),
          },
        ]}
      />
      <RowList
        rows={bills}
        keyOf={(bill) => bill.occurrenceKey}
        render={(bill) => (
          <>
            <div className="min-w-0">
              <p className="truncate t-body-sm font-medium">{bill.name}</p>
              <p className="money-number mt-0.5 t-caption-sm text-ink3">{bill.date}</p>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3.5">
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                {/* The balance when it comes due — negative is never hidden,
                    it is what put the item at risk. */}
                <span className="money-number t-subhead text-alert-ink">
                  {formatVndShort(bill.balanceAfter)}
                </span>
                <span className="money-number t-caption-sm text-ink3">
                  {t('whatif.bills.need', { amount: formatVndShort(bill.amount) })}
                </span>
              </div>
              <div className="whitespace-nowrap text-right">
                <p className="money-number t-body-sm text-alert-ink">
                  −{formatVndShort(bill.shortfall)}
                </p>
                <p className="t-caption-sm text-ink3">{t('whatif.bills.short')}</p>
              </div>
            </div>
          </>
        )}
      />
    </Panel>
  )
}

/**
 * What the goals give up.
 *
 * TIME leads each row, money follows. "Giảm 3tr" says what leaves; "chậm 12
 * ngày" says what it costs them, and the second is the one that decides
 * whether a purchase is worth it. A goal with no declared pace says so plainly
 * rather than showing a fabricated figure — there is no honest way to turn
 * money into time without a rate.
 */
function GoalsBlock({ goals }: { goals: WhatIfGoalCost[] }) {
  const { t } = useTranslation()

  const measurable = goals.filter((goal) => goal.delayDays !== null)
  const slowest = measurable.reduce((max, goal) => Math.max(max, goal.delayDays ?? 0), 0)
  const totalDelay = measurable.reduce((sum, goal) => sum + (goal.delayDays ?? 0), 0)
  const totalReduction = goals.reduce((sum, goal) => sum + goal.reduction, 0)

  return (
    <Panel>
      <PanelHead
        icon={<Target className="size-5 shrink-0 stroke-[1.7] text-attention-ink" />}
        title={t('whatif.goals.title')}
        meta={t('whatif.goals.count', { count: goals.length })}
      />
      <DomainSummary
        items={[
          {
            value:
              measurable.length > 0
                ? t('whatif.goals.delayDays', { count: slowest })
                : '—',
            // Only when there IS a delay to count to: an em-dash has no
            // magnitude, so there is nothing for the climb to say.
            count:
              measurable.length > 0
                ? {
                    to: slowest,
                    format: (n) => t('whatif.goals.delayDays', { count: Math.round(n) }),
                  }
                : undefined,
            label: t('whatif.goals.slowest'),
            tone: measurable.length > 0 ? 'text-attention-ink' : undefined,
          },
          {
            value:
              measurable.length > 0
                ? t('whatif.goals.delayDays', { count: totalDelay })
                : '—',
            count:
              measurable.length > 0
                ? {
                    to: totalDelay,
                    format: (n) => t('whatif.goals.delayDays', { count: Math.round(n) }),
                  }
                : undefined,
            // Saying how many goals the total covers keeps it honest: a goal
            // with no pace contributes nothing, and a bare total would read as
            // though it had.
            label:
              measurable.length === goals.length
                ? t('whatif.goals.totalDelay')
                : t('whatif.goals.delayCoverage', {
                    counted: measurable.length,
                    total: goals.length,
                  }),
          },
          {
            value: formatVndShort(totalReduction),
            count: { to: totalReduction, format: formatVndShort },
            label: t('whatif.goals.totalReduction'),
          },
        ]}
      />
      <RowList
        rows={goals}
        keyOf={(goal) => goal.goalId}
        render={(goal) => (
          <>
            <div className="min-w-0">
              <p className="truncate t-body-sm font-medium">{goal.goalName ?? '—'}</p>
            </div>
            <div className="flex min-w-0 flex-col items-end gap-1.5">
              {goal.delayDays !== null ? (
                <p className="money-number flex items-center gap-1.5 whitespace-nowrap t-subhead text-attention-ink">
                  <Clock3 className="size-[15px] shrink-0 stroke-[1.7]" />
                  <CountUp
                    value={goal.delayDays}
                    delay={SECTION_COUNT_DELAY}
                    format={(current) =>
                      t('whatif.goals.delayDays', { count: Math.round(current) })
                    }
                  />
                </p>
              ) : (
                <p className="flex items-center gap-1.5 t-body-sm text-ink3">
                  <CircleHelp className="size-[15px] shrink-0 stroke-[1.7]" />
                  {t('whatif.goals.noDelay')}
                </p>
              )}
              {/* The two halves, in the order the money gives way: this
                  month's contribution first, money already set aside only once
                  that is gone. The order IS the rule. */}
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                <MoneyPart
                  amount={goal.paceReduction}
                  label={t('whatif.goals.fromPace')}
                />
                <MoneyPart
                  amount={goal.setAsideReduction}
                  label={t('whatif.goals.fromSetAside')}
                  divided
                />
              </div>
            </div>
          </>
        )}
      />
    </Panel>
  )
}

function MoneyPart({
  amount,
  label,
  divided,
}: {
  amount: number
  label: string
  divided?: boolean
}) {
  return (
    <span
      className={cn(
        'flex items-baseline gap-1 whitespace-nowrap t-caption-sm text-ink3',
        divided && 'border-l border-divider pl-3',
      )}
    >
      <strong className="money-number t-caption font-normal text-ink2">
        {amount > 0 ? `−${formatVndShort(amount)}` : formatVndShort(0)}
      </strong>
      {label}
    </span>
  )
}

/**
 * Where the spend comes from, semantic split first.
 *
 * The stack answers "did this cost me anything that was promised" — the
 * question that decides whether a purchase feels affordable — before it answers
 * "out of which account". The wallets are literal and secondary: the household
 * named no wallet, the simulation chose one, so they sit behind a disclosure
 * rather than in the headline.
 */
function FundingSourceBlock({
  spend,
  fundingSource,
  uncovered,
}: {
  spend: number
  fundingSource: WhatIfResult['fundingSource']
  uncovered: number
}) {
  const { t } = useTranslation()
  const revealed = useRevealed()
  const [showWallets, setShowWallets] = useState(false)

  const parts = [
    {
      key: 'free',
      amount: fundingSource.free,
      label: t('whatif.source.free'),
      fill: 'bg-data-primary',
    },
    {
      key: 'pace',
      amount: fundingSource.fromPace,
      label: t('whatif.source.pace'),
      fill: 'bg-attention',
    },
    {
      key: 'setAside',
      amount: fundingSource.fromSetAside,
      label: t('whatif.source.setAside'),
      fill: 'bg-protect',
    },
  ]
  const total = parts.reduce((sum, part) => sum + part.amount, 0)
  const visible = parts.filter((part) => part.amount > 0)

  return (
    <Panel>
      <PanelHead
        icon={<WalletCards className="size-5 shrink-0 stroke-[1.7] text-ink2" />}
        title={t('whatif.source.title', { amount: formatVndShort(spend) })}
        meta={
          uncovered > 0
            ? t('whatif.source.uncoveredMeta', { amount: formatVndShort(uncovered) })
            : t('whatif.source.covered')
        }
      />

      {/* The money simply not being there is a different fact from a goal
          giving way, so it keeps its own line rather than folding into the
          split below. */}
      {uncovered > 0 ? (
        <p className="mb-3 t-body-sm text-alert-ink">
          {t('whatif.blocks.uncovered', { amount: formatVndShort(uncovered) })}
        </p>
      ) : null}

      {total > 0 ? (
        <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[11.875rem_minmax(0,1fr)] sm:gap-8">
          <div className="flex items-baseline gap-2 sm:block">
            <p className="t-caption text-ink3">{t('whatif.source.total')}</p>
            <p className="money-number sm:mt-0.5 t-metric">
              <CountUp value={total} format={formatVndShort} delay={SECTION_COUNT_DELAY} />
            </p>
          </div>
          <div>
            <motion.div
              className="flex h-[42px] overflow-hidden rounded-control bg-accent-soft"
              aria-hidden="true"
              // The bar wipes in as ONE. The slices are shares of a single
              // spend, so growing each independently would animate through
              // compositions that never existed.
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              // Unwiped until this section is the one showing — every child of
              // a `RevealSequence` is mounted from the start, so animating on
              // mount would run the wipe while the card is still invisible.
              animate={{
                clipPath: revealed ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
              }}
              transition={{
                duration: 1.1,
                delay: SECTION_COUNT_DELAY,
                ease: easeOut,
              }}
            >
              {visible.map((part) => {
                const share = (part.amount / total) * 100
                return (
                  <div
                    key={part.key}
                    className={cn(
                      'flex min-w-[3px] items-center justify-center whitespace-nowrap t-caption-sm font-medium text-white',
                      part.fill,
                    )}
                    style={{ flexGrow: part.amount, flexBasis: 0 }}
                  >
                    {/* A sliver cannot hold a figure legibly, and a clipped
                        number is worse than none — the legend carries it. */}
                    {share >= 14 ? formatVndShort(part.amount) : null}
                  </div>
                )
              })}
            </motion.div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {parts.map((part) => (
                <div key={part.key} className="min-w-0">
                  <p className="flex items-center gap-1.5 t-caption-sm text-ink2">
                    <span
                      aria-hidden="true"
                      className={cn('size-2 shrink-0 rounded-[2px]', part.fill)}
                    />
                    {part.label}
                  </p>
                  <p className="money-number mt-0.5 t-body-sm">
                    {formatVndShort(part.amount)}
                    <span className="ml-1 t-caption-sm text-ink3">
                      {Math.round((part.amount / total) * 100)}%
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {fundingSource.wallets.length > 0 ? (
        <div className="mt-4 border-t border-divider pt-1">
          <button
            type="button"
            onClick={() => setShowWallets((open) => !open)}
            aria-expanded={showWallets}
            className="flex min-h-11 items-center gap-2 text-left t-caption text-ink2"
          >
            <span
              aria-hidden="true"
              className={cn(
                't-caption text-ink3 transition-transform',
                showWallets && 'rotate-90',
              )}
            >
              ›
            </span>
            {t('whatif.source.walletCount', { count: fundingSource.wallets.length })}
          </button>
          {showWallets ? (
            <div className="flex flex-col gap-2.5 pb-0.5 pt-1.5">
              {fundingSource.wallets.map((wallet) => (
                <div
                  key={wallet.assetId}
                  className="grid grid-cols-[6.25rem_1fr_4.125rem] items-center gap-3 sm:grid-cols-[8.75rem_1fr_5rem]"
                >
                  <p className="truncate t-caption text-ink2">{wallet.name}</p>
                  {/* How much of this wallet the spend took, against what it
                      held — a wallet emptied outright and one barely touched
                      are different facts about the same number. */}
                  <div
                    className="flex h-2.5 overflow-hidden rounded-full bg-accent-soft"
                    aria-hidden="true"
                  >
                    <GrowBar
                      delay={SECTION_COUNT_DELAY}
                      className="bg-data-primary"
                      share={
                        wallet.before > 0
                          ? Math.min(100, (wallet.taken / wallet.before) * 100)
                          : 100
                      }
                    />
                  </div>
                  <p className="money-number text-right t-caption">
                    −{formatVndShort(wallet.taken)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  )
}

function BalanceBlock({
  label,
  value,
  fillClass,
  share,
  tone,
}: {
  label: string
  value: number
  fillClass: string
  share: number
  tone?: string
}) {
  return (
    <div>
      <p className="mb-1 t-caption-sm text-ink3">{label}</p>
      <p className={cn('money-number t-metric', tone)}>
        <CountUp value={value} format={formatVndShort} delay={SECTION_COUNT_DELAY} />
      </p>
      <div className="mt-2.5 h-[18px] overflow-hidden rounded-full bg-accent-soft">
        <GrowBar
          share={share}
          className={cn('h-full', fillClass)}
          delay={SECTION_COUNT_DELAY}
        />
      </div>
    </div>
  )
}

/**
 * The after bar as a share of the before bar.
 *
 * Clamped to 0 rather than allowed to go negative: a bar cannot draw a negative
 * width, and the figure above it already states the shortfall. A non-positive
 * "before" leaves nothing to compare against, so the bar reads empty rather
 * than dividing by it.
 */
function barShare(after: number, before: number): number {
  if (before <= 0) return 0
  return Math.max(0, Math.min(100, (after / before) * 100))
}

/**
 * Assumptions that describe how the FORECAST is built rather than what this
 * particular purchase changes.
 *
 * The horizon, the same-day ordering of outflows and the fact that planned
 * outflows are still subtracted are all true of every number the app shows —
 * they belong on `/upcoming`, where the forecast itself is the subject. Here
 * the reader asked one question about one purchase, and repeating the standing
 * rules of the engine buries the two or three lines that actually answer it.
 *
 * What survives is anything CONDITIONAL — stale sources, no confirmed inflow,
 * estimated income held back — because those qualify this answer.
 */
// Typed as `AssumptionCode` so renaming a code upstream breaks the build here
// rather than silently leaving the line on screen.
const FORECAST_WIDE_ASSUMPTIONS = new Set<AssumptionCode>([
  'horizon_days',
  'same_day_outflows_ordered_first',
  'planned_outflows_included',
])

function whatIfAssumptions(
  assumptions: CalculationAssumption[],
): CalculationAssumption[] {
  return assumptions.filter(
    (assumption) => !FORECAST_WIDE_ASSUMPTIONS.has(assumption.code),
  )
}
