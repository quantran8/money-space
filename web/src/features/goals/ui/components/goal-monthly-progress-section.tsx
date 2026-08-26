import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/ui/empty-state'
import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import type { GoalMonthProgress } from '@money-space/core/features/goals/api/goals.repository'
import { useGoalMonthlyProgress } from '@money-space/core/features/goals/hooks/use-goal-monthly-progress'
import { formatAmount } from '@money-space/core/features/goals/model/goals-form'
import { cn } from '@money-space/core/shared/lib/utils'

const PAGE_SIZE = 5
const CHART_MONTHS = 6

/**
 * "Nhịp góp" — how much actually went into this goal, month by month, against
 * the pace the household declared.
 *
 * The goal's headline figure answers *how much is behind this now*. This answers
 * the question a household actually asks month to month — "we meant to set aside
 * 10tr; did we?" — and because each month is the difference between two frozen
 * snapshots, it already accounts for everything: money added, money spent back
 * out of the backing assets, and the assets repricing.
 *
 * Three readings of the same data, in the order the question gets asked: where
 * the running month stands right now, whether the recent months hold a rhythm,
 * and then the full record for anyone who wants to check a specific month. The
 * table is paginated rather than scrolled — a household checking last March
 * should not have to drag through a year to reach it.
 *
 * The month still running gets a row too, measured to right now. Without it a
 * household mid-month sees its 10tr target and nothing else, and has to wait for
 * the month to close to learn where it stands. That row says what is LEFT to go
 * rather than what is missing: an unfinished month is not a shortfall.
 *
 * A short month is shown with `--attention`, never `--alert`: falling short of a
 * savings pace is information, not an error, and the product does not deliver
 * verdicts on how a household spent its own money (design.md §16).
 */
export function GoalMonthlyProgressSection({ goalId }: { goalId: string }) {
  const { t } = useTranslation()
  const { months, needsShareDecision, isLoading } = useGoalMonthlyProgress(goalId)
  const [page, setPage] = useState(0)

  // The first month on record has no previous month to compare against, so it
  // carries no delta — showing it as a row of dashes says nothing. The running
  // month stays even without one: "this month, so far" is the question being
  // asked, and an honest blank answers it better than hiding the row.
  const rows = useMemo(
    () => months.filter((month) => month.delta !== null || month.inProgress),
    [months],
  )
  // Newest first: the month a household is asking about is almost always a
  // recent one, and page 1 should already hold it.
  //
  // The RUNNING month is excluded outright: a month that has not ended is not
  // history, and listing it as a record invited the row to be read as a result
  // ("thiếu 17,1tr") when it is simply unfinished. It has its own card above,
  // which is the right place for a figure that is still moving.
  const ordered = useMemo(
    () => rows.filter((month) => !month.inProgress).reverse(),
    [rows],
  )

  // A goal backed only by gold has no pace to keep. The server withholds
  // `planned` for it, and showing "0 / 10tr · thiếu 10tr" every month would pass
  // judgement on a plan nobody made — so those two columns come off entirely and
  // what is left is what the goal actually is: value being held.
  const hasPace = months.some((month) => month.planned !== null)
  // The declared rate, for the header. Any month carrying one carries the same
  // one, so the first is representative.
  const plannedRate = months.find((month) => month.planned !== null)?.planned ?? null
  const running = months.find((month) => month.inProgress)
  const chartMonths = rows.slice(-CHART_MONTHS)

  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = ordered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <Panel>
      <PanelHeader
        title={t('goals.monthly.title')}
        meta={
          plannedRate != null
            ? t('goals.monthly.rateMeta', { amount: formatAmount(plannedRate) })
            : undefined
        }
      />

      {/* A wallet feeding this goal also feeds another at the same priority, and
          nobody has said how it divides. The figure below is a share-by-pace
          fallback, not a decision the household made — saying so is what lets
          them go and make it. */}
      {needsShareDecision ? (
        <p className="mt-4 t-body-sm text-ink2">
          {t('goals.monthly.shareUndecided')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-control" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarClock} className="mt-6">
          {t('goals.monthly.empty')}
        </EmptyState>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
            {running ? <RunningMonthCard month={running} /> : <div className="hidden lg:block" />}
            <RecentMonthsChart months={chartMonths} hasPace={hasPace} />
          </div>

          <h3 className="mt-7 t-subtitle">{t('goals.monthly.historyTitle')}</h3>

          {/* A goal in its first month has a running month and nothing else.
              Column headings over an empty body would promise a record that
              does not exist yet. */}
          {ordered.length === 0 ? (
            <EmptyState icon={CalendarClock} className="mt-3">
              {t('goals.monthly.historyEmpty')}
            </EmptyState>
          ) : (
          <Table className="mt-3 min-w-[480px] t-body-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-vi">{t('goals.monthly.columns.month')}</TableHead>
                <TableHead className="label-vi text-right">
                  {t('goals.monthly.columns.actual')}
                </TableHead>
                {hasPace ? (
                  <>
                    <TableHead className="label-vi text-right">
                      {t('goals.monthly.columns.planned')}
                    </TableHead>
                    <TableHead className="label-vi text-right">
                      {t('goals.monthly.columns.gap')}
                    </TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((month) => (
                <MonthRow key={month.month} month={month} hasPace={hasPace} />
              ))}
            </TableBody>
          </Table>
          )}

          {ordered.length > PAGE_SIZE ? (
            <div className="mt-3 flex items-center justify-between gap-3 px-1">
              <span className="font-mono t-caption-sm text-ink3">
                {t('goals.monthly.pageRange', {
                  from: safePage * PAGE_SIZE + 1,
                  to: Math.min(safePage * PAGE_SIZE + PAGE_SIZE, ordered.length),
                  total: ordered.length,
                })}
              </span>
              <div className="flex items-center gap-1">
                <PageButton
                  label={t('goals.monthly.prevPage')}
                  disabled={safePage === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                >
                  <ChevronLeft className="size-4" strokeWidth={1.75} />
                </PageButton>
                <PageButton
                  label={t('goals.monthly.nextPage')}
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                >
                  <ChevronRight className="size-4" strokeWidth={1.75} />
                </PageButton>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* The pace measures what the household DID; the market moving what they
          already hold is a different thing, and the two must never be read as
          one number — that conflation is why a month nobody contributed to could
          read "đủ nhịp". */}
      <p className="mt-4 t-caption-sm text-ink3">{t('goals.monthly.marketNote')}</p>
    </Panel>
  )
}

/**
 * The running month, on its own. Measured to right now, so it states what is
 * LEFT rather than what is missing — an unfinished month cannot be behind.
 */
function RunningMonthCard({ month }: { month: GoalMonthProgress }) {
  const { t } = useTranslation()
  const actual = month.delta ?? 0
  const planned = month.planned
  const percent =
    planned != null && planned > 0 ? Math.min(Math.max((actual / planned) * 100, 0), 100) : null
  const left = planned != null ? Math.max(planned - actual, 0) : null

  return (
    <div className="p-1">
      <p className="t-caption font-medium">
        {t('goals.monthly.currentMonth', { month: monthNumber(month.month) })}
      </p>
      <p className="mt-0.5 font-mono t-caption-sm text-ink3">{t('goals.monthly.inProgress')}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          {/* Two different figures wear this slot, and they must not share a
              label. An OBSERVED delta is money that moved: "đã góp". The
              headroom estimate is capacity the wallets still have — nothing may
              have moved at all — so calling it "đã góp" would claim something
              the number does not say. See `isEstimate` in the repository type.
              Either way the figure is measured against the wallet as it stands,
              with scheduled outflows still in it; what those will cost is
              reported on its own line, never folded into this number. */}
          <p className="t-caption-sm text-ink3">
            {month.isEstimate
              ? t('goals.monthly.couldContribute')
              : t('goals.monthly.contributed')}
          </p>
          <p className="money-number mt-1 t-metric">{formatAmount(actual)}</p>
        </div>
        {planned != null ? (
          <div className="pb-1 text-right">
            <p className="t-caption-sm text-ink3">{t('goals.monthly.monthlyRate')}</p>
            <p className="money-number mt-1 t-body-sm">{formatAmount(planned)}</p>
          </div>
        ) : null}
      </div>

      {percent !== null ? (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-committed"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          aria-label={t('goals.monthly.monthProgressAria', {
            actual: formatAmount(actual),
            planned: formatAmount(planned ?? 0),
          })}
        >
          <div className="seg h-full rounded-full bg-action" style={{ width: `${percent}%` }} />
        </div>
      ) : null}

      <p className="mt-4 t-caption leading-5 text-ink2">
        {left === null ? (
          t('goals.monthly.noRate')
        ) : month.isEstimate ? (
          t('goals.monthly.estimateNote')
        ) : left > 0 ? (
          <Trans
            i18nKey="goals.monthly.leftThisMonth"
            values={{ amount: formatAmount(left) }}
            components={[<strong key="amount" className="num font-medium text-ink" />]}
          />
        ) : (
          t('goals.monthly.metThisMonth')
        )}
      </p>
    </div>
  )
}

/**
 * The last few months as bars, against the declared rate.
 *
 * Bars are scaled against the tallest of (what went in, the rate), so a month
 * that beat the rate is not clipped at the dashed line — overshooting is worth
 * seeing, and a bar capped at 100% would hide it.
 */
function RecentMonthsChart({
  months,
  hasPace,
}: {
  months: GoalMonthProgress[]
  hasPace: boolean
}) {
  const { t } = useTranslation()
  const planned = months.find((month) => month.planned !== null)?.planned ?? null
  const peak = Math.max(
    ...months.map((month) => Math.max(month.delta ?? 0, 0)),
    planned ?? 0,
    1,
  )
  // Where the rate line sits, as a share of the well's plotting height. Kept
  // under 100% so the line never rides the very top edge.
  const planShare = planned != null && planned > 0 ? (planned / peak) * 100 : null

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-4">
        <p className="t-caption font-medium">{t('goals.monthly.recentMonths')}</p>
        {hasPace ? (
          <div className="hidden items-center gap-4 t-caption-sm text-ink3 sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-[2px] bg-action" />
              {t('goals.monthly.legendActual')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-px w-4 bg-ink3" />
              {t('goals.monthly.legendPlanned')}
            </span>
          </div>
        ) : null}
      </div>

      <div className="relative mt-5 h-[168px] rounded-control bg-wash px-4 pb-7 pt-6 sm:px-6">
        {planShare !== null ? (
          <>
            <div
              className="absolute right-4 left-4 border-t border-dashed border-protect sm:right-6 sm:left-6"
              style={{ bottom: `calc(28px + ${planShare} * (100% - 52px) / 100)` }}
            />
            <div
              className="absolute right-4 font-mono t-caption-sm text-ink3 sm:right-6"
              style={{ bottom: `calc(32px + ${planShare} * (100% - 52px) / 100)` }}
            >
              {formatAmount(planned ?? 0)}
            </div>
          </>
        ) : null}

        <div className="flex h-full items-end justify-between gap-2">
          {months.map((month) => {
            const value = Math.max(month.delta ?? 0, 0)
            const height = (value / peak) * 100
            return (
              <div
                key={month.month}
                className="group flex h-full flex-1 flex-col items-center justify-end"
                title={t(
                  month.inProgress
                    ? 'goals.monthly.barTitleInProgress'
                    : 'goals.monthly.barTitle',
                  { month: monthNumber(month.month), amount: formatAmount(month.delta ?? 0) },
                )}
              >
                <div
                  className={cn(
                    'seg w-full max-w-[42px] rounded-t-[5px] bg-action transition-opacity group-hover:opacity-80',
                    // A month still running is partial by definition — it reads
                    // lighter so a half-height bar is not mistaken for a miss.
                    month.inProgress && 'opacity-60',
                  )}
                  style={{ height: `${Math.max(height, value > 0 ? 4 : 0)}%` }}
                />
                <span className="mt-2 font-mono t-caption-sm text-ink3">
                  {monthNumber(month.month)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * One CLOSED month. The running month never reaches here — it is not history —
 * so this needs no "still going" branch: every row is a settled result.
 */
/**
 * One CLOSED month. The running month never reaches here — it is not history —
 * so this needs no "still going" branch: every row is a settled result.
 */
function MonthRow({ month, hasPace }: { month: GoalMonthProgress; hasPace: boolean }) {
  const { t } = useTranslation()
  const short = month.gap !== null && month.gap < 0

  return (
    <TableRow>
      <TableCell className="font-mono t-caption-sm text-ink3">{month.month}</TableCell>
      <TableCell
        className={cn(
          'num text-right font-medium',
          // A negative month means more went out of the backing assets than came
          // in — the signal, shown as it is.
          (month.delta ?? 0) < 0 && 'text-attention',
        )}
      >
        {month.delta === null ? '—' : formatAmount(month.delta)}
      </TableCell>
      {hasPace ? (
        <>
          <TableCell className="num text-right text-ink2">
            {month.planned === null ? '—' : formatAmount(month.planned)}
          </TableCell>
          <TableCell className={cn('num text-right', short ? 'text-attention' : 'text-ink2')}>
            {month.gap === null
              ? '—'
              : short
                ? t('goals.monthly.short', { amount: formatAmount(Math.abs(month.gap)) })
                : t('goals.monthly.onPace')}
          </TableCell>
        </>
      ) : null}
    </TableRow>
  )
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-control text-ink2 transition-colors hover:bg-canvas disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

/** `'2026-08'` → `'08'`. */
function monthNumber(month: string): string {
  return month.split('-')[1] ?? month
}
