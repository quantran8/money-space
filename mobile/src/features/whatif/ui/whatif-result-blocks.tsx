import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  ChartNoAxesColumnIncreasing,
  CircleHelp,
  Clock3,
  ReceiptText,
  Target,
  WalletCards,
} from 'lucide-react-native'

import type {
  AssumptionCode,
  CalculationAssumption,
} from '@money-space/core/features/forecast/model/forecast.types'
import {
  type WhatIfAtRisk,
  type WhatIfGoalCost,
  type WhatIfResult,
  type WhatIfResultType,
} from '@money-space/core/features/whatif/model/whatif.types'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { Disclosure, Panel } from '@/components/ui'
import { AssumptionsNote, formatFullDate } from '@/features/forecast'
import { colors } from '@/theme/tokens'

import type { ReactNode } from 'react'

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
 *
 * The web sequences these with `RevealSequence` and counts every figure up.
 * None of that is ported: the motion primitives are `motion/react`, and the
 * pacing was designed for a 56rem dialog the reader watches settle. On a phone
 * the sheet is already full-width and the reader scrolls — the ORDER is the
 * argument, and it survives without the choreography. Rows stack instead of
 * gridding, because money must never truncate at 335pt.
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
    <View className="gap-3">
      {/* 1 — How much is at stake, before any detail. Two counts, because a
          bill and a goal are different kinds of consequence and summing them
          into one number would flatten that. */}
      <Panel>
        <Text className="t-caption-sm text-ink3">{t('whatif.impact.summary')}</Text>
        <Text
          className="mt-0.5 t-metric"
          style={{
            fontVariant: ['tabular-nums'],
            color: affected > 0 ? RESULT_TYPE_COLOR[result.resultType] : colors.ink,
          }}
        >
          {affected > 0 ? t('whatif.impact.summaryValue', { count: affected }) : '—'}
        </Text>

        <View className="mt-4 flex-row">
          <View className="flex-1">
            <Text className="t-subhead text-ink" style={{ fontVariant: ['tabular-nums'] }}>
              {bills.length}
            </Text>
            <Text className="mt-0.5 t-caption-sm text-ink3">{t('whatif.impact.bills')}</Text>
          </View>
          <View className="flex-1 border-l border-divider pl-4">
            <Text className="t-subhead text-ink" style={{ fontVariant: ['tabular-nums'] }}>
              {goals.length}
            </Text>
            <Text className="mt-0.5 t-caption-sm text-ink3">{t('whatif.impact.goals')}</Text>
          </View>
        </View>

        {affected === 0 ? (
          <Text className="mt-3 t-body-sm leading-5 text-ink2">{t('whatif.impact.none')}</Text>
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
          <Text className="t-body-sm leading-5 text-attention-ink">
            {t('whatif.obligations.notCovered')}
          </Text>
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
            <ChartNoAxesColumnIncreasing size={20} color={colors.ink2} strokeWidth={1.7} />
          }
          title={t('whatif.cashflow.title')}
          meta={formatFullDate(result.input.plannedDate)}
        />

        <BalanceBlock
          label={t('whatif.cashflow.before')}
          value={before.lowestProjectedBalance}
          /* The before bar is always full: it is the reference the after bar is
             read against, not a quantity of its own. `dataPrimary`, the same
             fill as the after bar — this is one measurement drawn twice, so the
             pair is a composition, not two different things. It used to be
             `committed` (the hairline grey), which read as a disabled track
             rather than as the reference. */
          fill={colors.dataPrimary}
          share={100}
        />

        <Text className="mt-3 t-body-sm font-medium text-ink2" style={{ fontVariant: ['tabular-nums'] }}>
          {`− ${formatVndShort(spend)}`}
        </Text>

        {/* Same fill and same track as "before": what changed is the LENGTH, and
            the drop is the gap of bare track the fill no longer covers. Not
            `positive`/`alert` — §4 reserves those for a consequence that really
            is good or really is a deficit, and this bar is drawn the same way
            whichever it turns out to be. The figure above it carries the result
            tone; the bar carries the magnitude. */}
        <BalanceBlock
          className="mt-3"
          label={t('whatif.cashflow.after')}
          value={after.lowestProjectedBalance}
          fill={colors.dataPrimary}
          share={barShare(after.lowestProjectedBalance, before.lowestProjectedBalance)}
          tone={RESULT_TYPE_COLOR[result.resultType]}
        />

        <View className="mt-4 flex-row flex-wrap items-baseline gap-2.5 border-t border-divider pt-3.5">
          <Text className="t-caption-sm text-ink3">{t('whatif.cashflow.lowest')}</Text>
          <Text
            className="t-subhead text-attention-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatVndShort(after.lowestProjectedBalance)}
          </Text>
          <Text className="font-mono t-caption-sm text-ink3">
            {formatFullDate(after.lowestProjectedBalanceDate)}
          </Text>
        </View>
      </Panel>

      {/* 6 — Assumptions. Every derived number must be explainable. */}
      <AssumptionsNote assumptions={whatIfAssumptions(result.assumptions)} />
    </View>
  )
}

/**
 * Card heading: an icon beside the section's title, and one piece of metadata
 * to the right.
 *
 * Wraps `PanelHeader` rather than re-deriving it, so these sections carry the
 * same heading treatment as every other card in the app.
 */
function PanelHead({ icon, title, meta }: { icon: ReactNode; title: string; meta?: string }) {
  return (
    <View className="mb-4 flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        {icon}
        <Text className="flex-1 t-subtitle text-ink" numberOfLines={2}>
          {title}
        </Text>
      </View>
      {meta ? <Text className="t-caption text-ink3">{meta}</Text> : null}
    </View>
  )
}

/**
 * Three figures that size the block before the rows are read.
 *
 * Equal weight, because none of them outranks the others (02-components §4 —
 * metric cells at the same level share a treatment). The web lays them in a
 * row; at 335pt three money figures do not fit across, so they stack and are
 * separated by rules instead.
 */
function DomainSummary({
  items,
}: {
  items: { value: string; label: string; tone?: string }[]
}) {
  return (
    <View className="mb-2.5">
      {items.map((item, index) => (
        <View
          key={item.label}
          className={cn('py-2.5', index > 0 && 'border-t border-divider')}
        >
          <Text
            className="t-metric"
            style={{ fontVariant: ['tabular-nums'], color: item.tone ?? colors.ink }}
          >
            {item.value}
          </Text>
          <Text className="mt-0.5 t-caption-sm text-ink3">{item.label}</Text>
        </View>
      ))}
    </View>
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
  render: (row: T) => ReactNode
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const head = rows.slice(0, VISIBLE_ROWS)
  const rest = rows.slice(VISIBLE_ROWS)

  return (
    <View>
      {head.map((row, index) => (
        <View
          key={keyOf(row)}
          className={cn('py-3', index > 0 && 'border-t border-divider')}
        >
          {render(row)}
        </View>
      ))}

      {rest.length > 0 ? (
        <Disclosure
          className="border-t border-divider"
          open={expanded}
          onToggle={() => setExpanded((open) => !open)}
          label={t('whatif.impact.showMore', { count: rest.length })}
        >
          {rest.map((row) => (
            <View key={keyOf(row)} className="border-t border-divider py-3">
              {render(row)}
            </View>
          ))}
        </Disclosure>
      ) : null}
    </View>
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
        icon={<ReceiptText size={20} color={colors.alertInk} strokeWidth={1.7} />}
        title={t('whatif.bills.title')}
        meta={t('whatif.bills.count', { count: bills.length })}
      />
      <DomainSummary
        items={[
          { value: String(bills.length), label: t('whatif.bills.affected') },
          { value: formatVndShort(shortTotal), label: t('whatif.bills.shortTotal') },
          { value: formatVndShort(shortMax), label: t('whatif.bills.shortMax') },
        ]}
      />
      <RowList
        rows={bills}
        keyOf={(bill) => bill.occurrenceKey}
        render={(bill) => (
          <>
            <View className="flex-row items-baseline justify-between gap-3">
              <Text className="flex-1 t-body-sm font-medium text-ink" numberOfLines={1}>
                {bill.name}
              </Text>
              <Text className="font-mono t-caption-sm text-ink3">
                {formatFullDate(bill.date)}
              </Text>
            </View>

            <View className="mt-1.5 flex-row flex-wrap items-baseline gap-x-1.5 gap-y-1">
              {/* The balance when it comes due — negative is never hidden, it
                  is what put the item at risk. */}
              <Text
                className="t-subhead text-alert-ink"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatVndShort(bill.balanceAfter)}
              </Text>
              <Text className="t-caption-sm text-ink3" style={{ fontVariant: ['tabular-nums'] }}>
                {t('whatif.bills.need', { amount: formatVndShort(bill.amount) })}
              </Text>
            </View>

            <View className="mt-1 flex-row items-baseline gap-1.5">
              <Text
                className="t-body-sm text-alert-ink"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {`− ${formatVndShort(bill.shortfall)}`}
              </Text>
              <Text className="t-caption-sm text-ink3">{t('whatif.bills.short')}</Text>
            </View>
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
        icon={<Target size={20} color={colors.attentionInk} strokeWidth={1.7} />}
        title={t('whatif.goals.title')}
        meta={t('whatif.goals.count', { count: goals.length })}
      />
      <DomainSummary
        items={[
          {
            value:
              measurable.length > 0 ? t('whatif.goals.delayDays', { count: slowest }) : '—',
            label: t('whatif.goals.slowest'),
            tone: measurable.length > 0 ? colors.attentionInk : undefined,
          },
          {
            value:
              measurable.length > 0 ? t('whatif.goals.delayDays', { count: totalDelay }) : '—',
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
          { value: formatVndShort(totalReduction), label: t('whatif.goals.totalReduction') },
        ]}
      />
      <RowList
        rows={goals}
        keyOf={(goal) => goal.goalId}
        render={(goal) => (
          <>
            <Text className="t-body-sm font-medium text-ink" numberOfLines={1}>
              {goal.goalName ?? '—'}
            </Text>

            {goal.delayDays !== null ? (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <Clock3 size={15} color={colors.attentionInk} strokeWidth={1.7} />
                <Text
                  className="t-subhead text-attention-ink"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {t('whatif.goals.delayDays', { count: goal.delayDays })}
                </Text>
              </View>
            ) : (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <CircleHelp size={15} color={colors.ink3} strokeWidth={1.7} />
                <Text className="t-body-sm text-ink3">{t('whatif.goals.noDelay')}</Text>
              </View>
            )}

            {/* The two halves, in the order the money gives way: this month's
                contribution first, money already set aside only once that is
                gone. The order IS the rule. */}
            <View className="mt-1.5 flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
              <MoneyPart amount={goal.paceReduction} label={t('whatif.goals.fromPace')} />
              <MoneyPart
                amount={goal.setAsideReduction}
                label={t('whatif.goals.fromSetAside')}
                divided
              />
            </View>
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
    <View
      className={cn('flex-row items-baseline gap-1', divided && 'border-l border-divider pl-3')}
    >
      <Text className="t-caption text-ink2" style={{ fontVariant: ['tabular-nums'] }}>
        {amount > 0 ? `− ${formatVndShort(amount)}` : formatVndShort(0)}
      </Text>
      <Text className="t-caption-sm text-ink3">{label}</Text>
    </View>
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
  const [showWallets, setShowWallets] = useState(false)

  const parts = [
    { key: 'free', amount: fundingSource.free, label: t('whatif.source.free'), fill: colors.dataPrimary },
    { key: 'pace', amount: fundingSource.fromPace, label: t('whatif.source.pace'), fill: colors.attention },
    {
      key: 'setAside',
      amount: fundingSource.fromSetAside,
      label: t('whatif.source.setAside'),
      fill: colors.protect,
    },
  ]
  const total = parts.reduce((sum, part) => sum + part.amount, 0)
  const visible = parts.filter((part) => part.amount > 0)

  return (
    <Panel>
      <PanelHead
        icon={<WalletCards size={20} color={colors.ink2} strokeWidth={1.7} />}
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
        <Text className="mb-3 t-body-sm leading-5 text-alert-ink">
          {t('whatif.blocks.uncovered', { amount: formatVndShort(uncovered) })}
        </Text>
      ) : null}

      {total > 0 ? (
        <View>
          <Text className="t-caption text-ink3">{t('whatif.source.total')}</Text>
          <Text className="mt-0.5 t-metric text-ink" style={{ fontVariant: ['tabular-nums'] }}>
            {formatVndShort(total)}
          </Text>

          <View
            className="mt-3 h-[42px] flex-row overflow-hidden rounded-control"
            style={{ backgroundColor: colors.actionSoft }}
          >
            {visible.map((part) => {
              const share = (part.amount / total) * 100
              return (
                <View
                  key={part.key}
                  className="items-center justify-center"
                  style={{ flexGrow: part.amount, flexBasis: 0, minWidth: 3, backgroundColor: part.fill }}
                >
                  {/* A sliver cannot hold a figure legibly, and a clipped
                      number is worse than none — the legend carries it. */}
                  {share >= 22 ? (
                    <Text
                      className="t-caption-sm font-medium text-ink"
                      style={{ fontVariant: ['tabular-nums'] }}
                      numberOfLines={1}
                    >
                      {formatVndShort(part.amount)}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>

          <View className="mt-3 gap-2">
            {parts.map((part) => (
              <View key={part.key} className="flex-row items-center gap-2">
                <View
                  className="size-2 rounded-[2px]"
                  style={{ backgroundColor: part.fill }}
                />
                <Text className="flex-1 t-caption-sm text-ink2">{part.label}</Text>
                <Text className="t-body-sm text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatVndShort(part.amount)}
                </Text>
                <Text
                  className="w-11 text-right t-caption-sm text-ink3"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {`${Math.round((part.amount / total) * 100)}%`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {fundingSource.wallets.length > 0 ? (
        <Disclosure
          className="mt-4 border-t border-divider pt-1"
          open={showWallets}
          onToggle={() => setShowWallets((open) => !open)}
          label={t('whatif.source.walletCount', { count: fundingSource.wallets.length })}
        >
          <View className="gap-2.5 pb-0.5 pt-1.5">
            {fundingSource.wallets.map((wallet) => (
              <View key={wallet.assetId} className="flex-row items-center gap-3">
                <Text className="w-24 t-caption text-ink2" numberOfLines={1}>
                  {wallet.name}
                </Text>
                {/* How much of this wallet the spend took, against what it
                    held — a wallet emptied outright and one barely touched are
                    different facts about the same number. */}
                <View
                  className="h-2.5 flex-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: colors.actionSoft }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${
                        wallet.before > 0
                          ? Math.min(100, (wallet.taken / wallet.before) * 100)
                          : 100
                      }%`,
                      backgroundColor: colors.dataPrimary,
                    }}
                  />
                </View>
                <Text
                  className="w-20 text-right t-caption text-ink"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {`− ${formatVndShort(wallet.taken)}`}
                </Text>
              </View>
            ))}
          </View>
        </Disclosure>
      ) : null}
    </Panel>
  )
}

function BalanceBlock({
  label,
  value,
  fill,
  share,
  tone,
  className,
}: {
  label: string
  value: number
  fill: string
  share: number
  tone?: string
  className?: string
}) {
  return (
    <View className={className}>
      <Text className="mb-1 t-caption-sm text-ink3">{label}</Text>
      {/* Never clamped: a negative low point is the answer, not an error. */}
      <Text
        className="t-metric"
        style={{ fontVariant: ['tabular-nums'], color: tone ?? colors.ink }}
      >
        {formatVndShort(value)}
      </Text>
      <View
        className="mt-2.5 h-[18px] overflow-hidden rounded-full"
        style={{ backgroundColor: colors.actionSoft }}
      >
        <View className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: fill }} />
      </View>
    </View>
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
 * STYLING ONLY (invariant 3). Core's `RESULT_TYPE_CLASS` is web Tailwind, so
 * the same three tones are resolved here to theme colours. The mapping is a
 * palette lookup and decides nothing.
 *
 * `comfortable` is plain ink, not green: v5 §4 reserves `--positive` for a
 * consequence that is genuinely good, and "this fits" is the absence of a
 * problem rather than a win. Colour marks what needs attention.
 */
const RESULT_TYPE_COLOR: Record<WhatIfResultType, string> = {
  comfortable: colors.ink,
  tight: colors.attentionInk,
  not_covered: colors.alertInk,
}

/**
 * Assumptions that describe how the FORECAST is built rather than what this
 * particular purchase changes.
 *
 * The horizon, the same-day ordering of outflows and the fact that planned
 * outflows are still subtracted are all true of every number the app shows —
 * they belong on `Sắp tới`, where the forecast itself is the subject. Here the
 * reader asked one question about one purchase, and repeating the standing
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

function whatIfAssumptions(assumptions: CalculationAssumption[]): CalculationAssumption[] {
  return assumptions.filter((assumption) => !FORECAST_WIDE_ASSUMPTIONS.has(assumption.code))
}
