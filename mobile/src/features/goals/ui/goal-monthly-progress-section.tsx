import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { GoalMonthProgress } from '@money-space/core/features/goals/api/goals.repository'
import { useGoalMonthlyProgress } from '@money-space/core/features/goals/hooks/use-goal-monthly-progress'
import { formatAmount } from '@money-space/core/features/goals/model/goals-form'

import {
  CaveatNote,
  GroupedRow,
  Panel,
  PanelHeader,
  ProgressBar,
  RowMeta,
  Skeleton,
  Sunk,
} from '@/components/ui'

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
              className="text-[12px] text-ink3"
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
          <Skeleton height={92} className="rounded-sunk" />
          <Skeleton height={44} className="rounded-sunk" />
        </View>
      ) : rows.length === 0 ? (
        <Sunk className="mt-5">
          <Text className="text-[14px] leading-5 text-ink2">{t('goals.monthly.empty')}</Text>
        </Sunk>
      ) : (
        <>
          {running ? <RunningMonthCard month={running} /> : null}

          <Text className="mt-6 text-[14px] font-medium text-ink">
            {t('goals.monthly.historyTitle')}
          </Text>

          {closed.length === 0 ? (
            // A goal in its first month has a running month and nothing else.
            // A heading over an empty body would promise a record that does not
            // exist yet.
            <Sunk className="mt-3">
              <Text className="text-[14px] text-ink2">{t('goals.monthly.historyEmpty')}</Text>
            </Sunk>
          ) : (
            <View className="mt-2">
              {closed.map((month) => (
                <ClosedMonthRow key={month.month} month={month} />
              ))}
            </View>
          )}

          {/* Assets repricing is not the household saving. Said once, under the
              rows it qualifies. */}
          <Text className="mt-4 text-[11px] leading-4 text-ink3">
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
          <Text className="text-[11px] text-ink3">
            {month.isEstimate
              ? t('goals.monthly.couldContribute')
              : t('goals.monthly.contributed')}
          </Text>
          <Text
            className="mt-1 text-[28px] font-medium text-ink"
            style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.84 }}
          >
            {formatAmount(actual)}
          </Text>
        </View>

        {planned != null ? (
          <View className="items-end">
            <Text className="text-[11px] text-ink3">{t('goals.monthly.monthlyRate')}</Text>
            <Text
              className="mt-1 text-[14px] font-medium text-ink"
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

      <Text className="mt-3 text-[12px] leading-5 text-ink2">
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
            <Text className="text-attention">
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
