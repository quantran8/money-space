import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BarChart } from 'react-native-gifted-charts'

import type { GoalMonthProgress } from '@money-space/core/features/goals/api/goals.repository'
import { useGoalMonthlyProgress } from '@money-space/core/features/goals/hooks/use-goal-monthly-progress'
import { formatAmount } from '@money-space/core/features/goals/model/goals-form'

import {
  CaveatNote,
  GroupedRow,
  Label,
  Panel,
  PanelHeader,
  ProgressBar,
  RowMeta,
  Skeleton,
  Sunk,
} from '@/components/ui'
import { colors } from '@/theme/tokens'

/** How many closed months the list shows. Older months live on the web. */
const HISTORY_MONTHS = 6

/**
 * "Nhịp góp" — how much actually went into this goal, month by month, against
 * the pace the household declared.
 *
 * The headline figure answers *how much is behind this now*. This answers the
 * question a household actually asks month to month: "we meant to set aside
 * 10tr; did we?" Because each month is the difference between two frozen
 * snapshots, it already accounts for money added, money spent back out of a
 * backing asset, and the assets repricing.
 *
 * ## What the phone drops
 *
 * The web pairs a running-month card with a six-bar chart and a paginated
 * table. The card stays — it is the answer. The bar chart goes: six bars across
 * 335pt with a dashed rate line is a texture, not a reading, and the same six
 * months read perfectly well as rows with their gap stated in words. The
 * pagination goes with the table; the last six closed months are what a
 * household checks on a phone, and the full record is a desktop errand.
 *
 * ## What must not drift
 *
 * A short month is `--attention`, never `--alert`: falling short of a savings
 * pace is information, and this product does not deliver verdicts on how a
 * household spent its own money.
 *
 * The **running** month says what is LEFT to go, not what is missing — an
 * unfinished month is not a shortfall — and when its figure is an estimate of
 * capacity rather than money observed moving, it says "có thể góp", never "đã
 * góp".
 */
export function GoalMonthlyProgressSection({ goalId }: { goalId: string }) {
  const { t } = useTranslation()
  const { months, needsShareDecision, isLoading } = useGoalMonthlyProgress(goalId)

  // The first month on record carries no delta — a household arriving with
  // 200tr already saved did not save it that month, and a row of dashes says
  // nothing. The running month stays regardless: "this month, so far" is the
  // question being asked, and an honest blank answers it better than no row.
  const rows = months.filter((month) => month.delta !== null || month.inProgress)
  const running = months.find((month) => month.inProgress)
  // Newest first, and the running month excluded: a month that has not ended is
  // not history, and listing it as a record invites it to be read as a result.
  const closed = rows
    .filter((month) => !month.inProgress)
    .reverse()
    .slice(0, HISTORY_MONTHS)

  // A goal backed only by gold has no pace to keep. The server withholds
  // `planned` for it, so the rate line comes off entirely rather than reporting
  // "0 / 10tr · thiếu 10tr" against a plan nobody made.
  const plannedRate = months.find((month) => month.planned !== null)?.planned ?? null

  return (
    <Panel>
      <PanelHeader
        title={t('goals.monthly.title')}
        right={
          plannedRate != null ? (
            <Text
              className="t-caption text-ink3"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {t('goals.monthly.rateMeta', { amount: formatAmount(plannedRate) })}
            </Text>
          ) : undefined
        }
      />

      {/* A wallet feeding this goal also feeds another at the same priority and
          nobody has said how it divides. The figure below is a share-by-pace
          fallback, not a decision the household made — saying so is what lets
          them go and make it. */}
      {needsShareDecision ? (
        <CaveatNote className="mt-4">{t('goals.monthly.shareUndecided')}</CaveatNote>
      ) : null}

      {isLoading ? (
        <View className="mt-5 gap-2">
          <Skeleton height={92} className="rounded-control" />
          <Skeleton height={44} className="rounded-control" />
        </View>
      ) : rows.length === 0 ? (
        <Sunk className="mt-5">
          <Text className="t-body-sm leading-5 text-ink2">{t('goals.monthly.empty')}</Text>
        </Sunk>
      ) : (
        <>
          {running ? <RunningMonthCard month={running} /> : null}

          <Text className="mt-6 t-body-sm font-medium text-ink">
            {t('goals.monthly.historyTitle')}
          </Text>

          {closed.length === 0 ? (
            // A goal in its first month has a running month and nothing else.
            // A heading over an empty body would promise a record that does not
            // exist yet.
            <Sunk className="mt-3">
              <Text className="t-body-sm text-ink2">{t('goals.monthly.historyEmpty')}</Text>
            </Sunk>
          ) : (
            <>
              {/* The shape first, the figures under it. Six months of "did we
                  keep the pace" is a comparison against one line, which an arc
                  of bars answers at a glance and a column of numbers does not.
                  The rows stay: the chart carries no exact amounts. */}
              <RecentMonthsChart months={closed} plannedRate={plannedRate} />

              <View className="mt-2">
                {closed.map((month) => (
                  <ClosedMonthRow key={month.month} month={month} />
                ))}
              </View>
            </>
          )}

          {/* Assets repricing is not the household saving. Said once, under the
              rows it qualifies. */}
          <Text className="mt-4 t-caption-sm leading-4 text-ink3">
            {t('goals.monthly.marketNote')}
          </Text>
        </>
      )}
    </Panel>
  )
}

/**
 * Where the running month stands right now.
 *
 * Measured to this moment rather than to a month-end close, so the figure is
 * partial and will keep moving. Without this card a household mid-month sees
 * its 10tr target and nothing else, and has to wait for the month to end to
 * learn where it stands.
 */
function RunningMonthCard({ month }: { month: GoalMonthProgress }) {
  const { t } = useTranslation()

  const actual = month.delta ?? 0
  const planned = month.planned
  const percent = planned != null && planned > 0 ? Math.min((actual / planned) * 100, 100) : null
  const left = planned != null ? Math.max(planned - actual, 0) : null

  return (
    <Sunk className="mt-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          {/* "Có thể góp", not "đã góp", when the figure is the HEADROOM
              estimate: what the wallets could still put in, not money observed
              moving. A month that has not ended cannot be reported as kept. */}
          <Text className="t-caption-sm text-ink3">
            {month.isEstimate
              ? t('goals.monthly.couldContribute')
              : t('goals.monthly.contributed')}
          </Text>
          <Text
            className="mt-1 t-metric text-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatAmount(actual)}
          </Text>
        </View>

        {planned != null ? (
          <View className="items-end">
            <Text className="t-caption-sm text-ink3">{t('goals.monthly.monthlyRate')}</Text>
            <Text
              className="mt-1 t-body-sm font-medium text-ink"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatAmount(planned)}
            </Text>
          </View>
        ) : null}
      </View>

      {percent !== null ? (
        <ProgressBar
          className="mt-4"
          height={8}
          percent={percent}
          label={t('goals.monthly.monthProgressAria', {
            actual: formatAmount(actual),
            planned: formatAmount(planned ?? 0),
          })}
        />
      ) : null}

      <Text className="mt-3 t-caption leading-5 text-ink2">
        {left === null
          ? t('goals.monthly.noRate')
          : month.isEstimate
            ? t('goals.monthly.estimateNote')
            : left > 0
              ? t('goals.monthly.leftThisMonth', { amount: formatAmount(left) }).replace(
                  /<\/?1>/g,
                  '',
                )
              : t('goals.monthly.metThisMonth')}
      </Text>
    </Sunk>
  )
}

/**
 * One month that closed.
 *
 * The web's five columns (month, source, actual, planned, gap) collapse to a
 * grouped row: the month and the pace verdict on the left, what went in on the
 * right. The planned figure is not repeated per row — the panel header already
 * states the rate, and §5 forbids one fact in two places.
 */
/** The well's plotting height. Six bars need room to differ, not to impress. */
const CHART_HEIGHT = 132

/**
 * Six closed months against the declared pace.
 *
 * The bars are `--data-primary`: this is DATA, never the action colour (§4).
 * A short month is not tinted — the rate line above it already says the month
 * fell under, and colouring the bar would turn a reading into a verdict on how
 * a household spent its own money.
 *
 * The rate line is `--committed`, dashed, and absent entirely when no pace was
 * declared: a goal backed only by gold has no plan to miss, and drawing a line
 * at zero would invent one.
 *
 * Scaled against the PEAK of bars and rate together, so a month that overshot
 * the pace is not clipped flat at the top.
 */
function RecentMonthsChart({
  months,
  plannedRate,
}: {
  /** Newest first, as the rows below receive them. */
  months: GoalMonthProgress[]
  plannedRate: number | null
}) {
  const { t } = useTranslation()

  // The rows read newest-first; a chart reads left-to-right in time.
  const chronological = [...months].reverse()

  // Negative months floor at zero for the BAR only — a bar below the axis needs
  // an axis to hang from, and the row beside it states the real figure.
  const values = chronological.map((month) => Math.max(month.delta ?? 0, 0))
  const peak = Math.max(...values, plannedRate ?? 0, 1)

  const ariaLabel = chronological
    .map((month) => `${monthLabel(month.month)} ${formatAmount(Math.max(month.delta ?? 0, 0))}`)
    .join(', ')

  return (
    <View className="mt-4">
      {plannedRate != null ? (
        <Label>{t('goals.monthly.legendPlanned')}</Label>
      ) : null}

      <View
        className="mt-2"
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        <BarChart
          data={chronological.map((month) => ({
            value: Math.max(month.delta ?? 0, 0),
            label: monthLabel(month.month),
            frontColor: colors.dataPrimary,
          }))}
          height={CHART_HEIGHT}
          maxValue={peak}
          barWidth={26}
          spacing={18}
          initialSpacing={12}
          endSpacing={4}
          roundedTop
          barBorderRadius={5}
          // The axis is the baseline every bar is read from; the grid and the
          // value scale are noise the rows below already carry precisely.
          hideRules
          hideYAxisText
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.divider}
          xAxisLabelTextStyle={{
            color: colors.ink3,
            fontSize: 11,
            fontFamily: 'IBMPlexMono_400Regular',
          }}
          isAnimated={false}
          // The pace, as one dashed rule. Omitted when nothing was declared.
          showReferenceLine1={plannedRate != null}
          referenceLine1Position={plannedRate ?? 0}
          referenceLine1Config={{
            color: colors.committed,
            thickness: 1,
            type: 'dashed',
            dashWidth: 4,
            dashGap: 4,
          }}
        />
      </View>
    </View>
  )
}

/** `08/26` — ASCII only, so the mono face is safe on it. */
function monthLabel(month: string): string {
  const [year, monthPart] = month.split('-')
  return year && monthPart ? `${monthPart}/${year.slice(2)}` : month
}

function ClosedMonthRow({ month }: { month: GoalMonthProgress }) {
  const { t } = useTranslation()

  const actual = month.delta ?? 0
  const gap = month.gap
  // A negative month is reported as-is. Falling short is information, so
  // attention — never alert, and never a verdict.
  const short = gap != null && gap < 0

  return (
    <GroupedRow
      title={t('goals.monthly.currentMonth', { month: shortMonth(month.month) })}
      meta={
        gap == null ? (
          // `delta` present but no pace declared: nothing to compare against,
          // so nothing is claimed.
          undefined
        ) : short ? (
          <RowMeta>
            <Text className="text-attention-ink">
              {t('goals.monthly.short', { amount: formatAmount(Math.abs(gap)) })}
            </Text>
          </RowMeta>
        ) : (
          // Sans, not mono: "Đủ nhịp" carries diacritics, and the mono face
          // must never touch accented Vietnamese (§5, hard constraint).
          <RowMeta>{t('goals.monthly.onPace')}</RowMeta>
        )
      }
      value={formatAmount(actual)}
      valueTone={short ? 'attention' : 'default'}
    />
  )
}

/** `'2026-08'` → `'08/2026'`. ASCII, so the mono face is safe on it. */
function shortMonth(month: string): string {
  const [year, part] = month.split('-')
  return part ? `${part}/${year}` : month
}
