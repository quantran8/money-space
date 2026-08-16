import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type XAxisTickContentProps,
} from 'recharts'

import { Label, Panel, PanelHeader, PanelSplit, Sunk } from '@/components/ui/panel'
import {
  buildDeltaSeries,
  buildTimelineRows,
  type DeltaPoint,
  type TimelineRow,
} from '@/features/dashboard/model/home-derivations'
import type { ForecastResult } from '@/features/forecast/model/forecast.types'
import { chartAxis, chartGrid, chartSeparator } from '@/shared/constants/colors'
import { formatVndCell, formatVndCellSigned, formatVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * The chart earns its place only once the sequence stops being readable as a
 * list. Below this many events the table beside it already shows the shape, and
 * a five-point line is decoration (§2.8).
 */
const MIN_EVENTS_FOR_CHART = 6

/**
 * Home section 2 — Ba mươi ngày tới (§12.2).
 *
 * One section, not two: the summary and the events are the same function, so
 * there is deliberately no separate "Những khoản sắp tới" block (§2.7).
 *
 * The lowest projected balance leads because it is the one number that says
 * whether the next month works. The table's `Còn lại` column carries the
 * running balance — that column is what turns a list of events into a sequence.
 */
export function UpcomingSection({ forecast }: { forecast: ForecastResult }) {
  const { t } = useTranslation()

  const { rows, totalCount } = buildTimelineRows(forecast)
  const { points, lowestIndex } = buildDeltaSeries(forecast)

  const lowest = forecast.lowestProjectedBalance
  const dip = forecast.startingLiquidBalance - lowest

  const showChart = totalCount >= MIN_EVENTS_FOR_CHART && points.length > 1

  return (
    <Panel>
      <PanelHeader
        title={t('home.upcoming.title')}
        meta={t('home.upcoming.meta', {
          range: `${formatDayMonth(forecast.asOfDate)} — ${formatDayMonth(forecast.horizonEndDate)}`,
          count: totalCount,
        })}
      />

      <PanelSplit>
        <div>
          <Label>{t('home.upcoming.lowestLabel')}</Label>

          {/* MAY BE NEGATIVE — never clamped. */}
          <p
            className={cn(
              'num mt-2 text-[30px] font-medium tracking-[-.03em]',
              lowest < 0 && 'text-alert',
            )}
          >
            {formatVndScale(lowest)}
          </p>

          <p className="mt-3 text-[13px] leading-5 text-ink2">
            {dip > 0 ? (
              <>
                {t('home.upcoming.lowestNoteDipBefore', {
                  date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                })}{' '}
                <span className="num font-medium text-ink">{formatVndScale(dip)}</span>.
              </>
            ) : (
              t('home.upcoming.lowestNoteNoDip', {
                date: formatDayMonth(forecast.lowestProjectedBalanceDate),
              })
            )}
          </p>

          {showChart ? (
            <Sunk className="mt-6 p-4">
              <Label>{t('home.upcoming.chartLabel')}</Label>
              <CashflowDeltaChart
                points={points}
                lowestIndex={lowestIndex}
                ariaLabel={t('home.upcoming.chartAria', {
                  lowest: formatVndScale(lowest),
                  date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                  ending: formatVndScale(forecast.endingProjectedBalance),
                })}
              />
            </Sunk>
          ) : null}
        </div>

        <div>
          {rows.length === 0 ? (
            <p className="py-6 text-[13px] text-ink2">{t('home.upcoming.empty')}</p>
          ) : (
            <>
              {/* A real <table> with a real <thead> — not a div grid (§24). */}
              <div className="-mx-2.5 hidden lg:block">
                <table className="table-dense w-full text-[13px]">
                  <thead>
                    <tr className="label">
                      <th className="pb-3 text-left font-normal">{t('home.upcoming.column.date')}</th>
                      <th className="pb-3 text-left font-normal">{t('home.upcoming.column.item')}</th>
                      {/* §10.4: the unit is declared ONCE here, not repeated
                          in every cell. */}
                      <th className="pb-3 text-right font-normal">
                        {t('home.upcoming.column.amountUnit')}
                      </th>
                      <th className="pb-3 text-right font-normal">
                        {t('home.upcoming.column.remainingUnit')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key}>
                        <td className="py-2.5 font-mono text-[11px] whitespace-nowrap text-ink3">
                          {formatDayMonth(row.date)}
                        </td>
                        <td className="py-2.5">
                          {row.name}
                          {row.unconfirmed ? (
                            <span className="ml-2 font-mono text-[11px] text-attention">
                              {t('home.upcoming.needsConfirm')}
                            </span>
                          ) : null}
                        </td>
                        <td
                          className={cn(
                            'num py-2.5 text-right whitespace-nowrap',
                            row.signedAmount > 0 && 'text-accent',
                          )}
                        >
                          {formatVndCellSigned(row.signedAmount)}
                        </td>
                        <td className="num py-2.5 text-right whitespace-nowrap text-ink2">
                          {row.runningBalance === undefined
                            ? '·'
                            : formatVndCell(row.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Below lg the four columns stop fitting, and a horizontally
                  scrolled table hides the running balance — the one column the
                  section exists for. Each event becomes its own block instead. */}
              <div className="space-y-2 lg:hidden">
                {rows.map((row) => (
                  <TimelineCard key={row.key} row={row} />
                ))}
              </div>
            </>
          )}

          <div className="mt-4">
            <Link
              to="/upcoming"
              className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent"
            >
              {totalCount > rows.length
                ? t('home.upcoming.more', { count: totalCount - rows.length })
                : t('home.upcoming.viewTimeline')}
            </Link>
          </div>
        </div>
      </PanelSplit>
    </Panel>
  )
}

function TimelineCard({ row }: { row: TimelineRow }) {
  const { t } = useTranslation()

  return (
    <Sunk className="flex items-start justify-between gap-4 p-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{row.name}</p>
        <p className="mt-1 font-mono text-[11px] text-ink3">
          {formatDayMonth(row.date)}
          {row.unconfirmed ? ` · ${t('home.upcoming.needsConfirm')}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('num text-[13px]', row.signedAmount > 0 && 'text-accent')}>
          {formatVndCellSigned(row.signedAmount)} {t('units.million')}
        </p>
        {row.runningBalance === undefined ? null : (
          <p className="num mt-1 text-[11px] text-ink3">
            {t('home.upcoming.remainingShort', {
              value: `${formatVndCell(row.runningBalance)} ${t('units.million')}`,
            })}
          </p>
        )}
      </div>
    </Sunk>
  )
}

/**
 * Thirty days of cash flow, drawn as CHANGE SINCE TODAY (§12.2).
 *
 * Two properties make the shape honest. The baseline is a true zero — today —
 * so the line cannot exaggerate a dip the way an auto-scaled balance axis does,
 * and the reading does not depend on how much money the household happens to
 * hold. And the interpolation is `stepAfter`, because a balance does not drift
 * between events: it holds flat and then moves on the day something is paid.
 * A smoothed curve would draw money leaving the account on days nothing happens.
 */
function CashflowDeltaChart({
  points,
  lowestIndex,
  ariaLabel,
}: {
  points: DeltaPoint[]
  lowestIndex: number
  ariaLabel: string
}) {
  const { t } = useTranslation()

  // Millions, because the axis label declares the unit once (§10.4).
  const data = points.map((point) => ({ ...point, value: point.delta / 1_000_000 }))
  const labels = new Map(data.map((point) => [point.index, formatDayMonth(point.date)]))

  const first = data[0].index
  const last = data[data.length - 1].index
  const middle = data[Math.floor((data.length - 1) / 2)].index

  return (
    <div className="mt-3 h-[116px] w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
          {/* Today. Every point on the line is read against this. */}
          <ReferenceLine y={0} stroke={chartGrid} strokeWidth={1} />

          <XAxis
            dataKey="index"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={[first, middle, last]}
            interval={0}
            axisLine={false}
            tickLine={false}
            height={22}
            // The end ticks sit ON the plot edges, so a centred label is half
            // outside the well and renders clipped. They anchor inward instead.
            tick={({ x, y, payload }: XAxisTickContentProps) => {
              const value = Number(payload.value)
              return (
                <text
                  x={x}
                  y={y}
                  dy={6}
                  fill={chartAxis}
                  fontSize={10}
                  fontFamily="IBM Plex Mono, ui-monospace, monospace"
                  textAnchor={value === first ? 'start' : value === last ? 'end' : 'middle'}
                >
                  {labels.get(value) ?? ''}
                </text>
              )
            }}
          />
          <YAxis hide domain={['auto', 'auto']} />

          <Tooltip
            cursor={{ stroke: chartGrid, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as (typeof data)[number]
              return (
                <div className="panel px-3 py-2 shadow-sm">
                  <p className="font-mono text-[11px] text-ink3">{formatDayMonth(point.date)}</p>
                  <p className="num mt-1 text-[13px] font-medium">
                    {point.delta === 0
                      ? t('home.upcoming.chartSameAsToday')
                      : `${formatVndCellSigned(point.delta)} ${t('units.million')}`}
                  </p>
                </div>
              )
            }}
          />

          <Line
            type="stepAfter"
            dataKey="value"
            stroke="var(--ink2)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number }) =>
              props.index === lowestIndex && props.cx != null && props.cy != null ? (
                <circle
                  key={`low-${props.index}`}
                  cx={props.cx}
                  cy={props.cy}
                  r={3.5}
                  fill="var(--attention)"
                />
              ) : (
                <g key={`dot-${props.index}`} />
              )
            }
            activeDot={{ r: 3.5, fill: 'var(--ink)', stroke: chartSeparator, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
