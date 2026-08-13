import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Label, Panel, PanelHeader, Sunk, TotalRow } from '@/components/ui/panel'
import {
  buildBalanceLine,
  buildTimelineRows,
} from '@/features/dashboard/model/home-derivations'
import type { ForecastResult } from '@/features/forecast/model/forecast.types'
import {
  formatVndCell,
  formatVndCellSigned,
  formatVndScale,
} from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

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
  const { points, lowestIndex } = buildBalanceLine(forecast)

  const reserve = forecast.protectedReserveAmount
  const lowest = forecast.lowestProjectedBalance
  const breachesReserve = reserve > 0 && lowest < reserve

  return (
    <Panel>
      <PanelHeader
        title={t('home.upcoming.title')}
        meta={t('home.upcoming.meta', {
          range: `${formatDayMonth(forecast.asOfDate)} — ${formatDayMonth(forecast.horizonEndDate)}`,
          count: totalCount,
        })}
      />

      <div className="mt-7 grid gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div>
          <Label>{t('home.upcoming.lowestLabel')}</Label>

          {/* MAY BE NEGATIVE — never clamped. */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <span
              className={cn(
                'num text-[30px] font-medium tracking-[-.03em]',
                lowest < 0 ? 'text-alert' : breachesReserve && 'text-attention',
              )}
            >
              {formatVndScale(lowest)}
            </span>
          </div>

          <p className="mt-2 text-[13px] text-ink2">
            {reserve <= 0
              ? t('home.upcoming.lowestNoteNoReserve', {
                  date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                })
              : t(
                  breachesReserve
                    ? 'home.upcoming.lowestNoteBreach'
                    : 'home.upcoming.lowestNote',
                  {
                    date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                    reserve: formatVndScale(reserve),
                  },
                )}
          </p>

          {points.length > 1 ? (
            <Sunk className="mt-5 p-5">
              <BalanceLine points={points} lowestIndex={lowestIndex} ariaLabel={t('home.upcoming.chartAria', {
                lowest: formatVndScale(lowest),
                date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                ending: formatVndScale(forecast.endingProjectedBalance),
              })} />
              <div className="mt-3 flex justify-between gap-2 font-mono text-[10px] text-ink3">
                <span>{t('home.upcoming.chartToday', { value: formatVndScale(forecast.startingLiquidBalance) })}</span>
                <span>{t('home.upcoming.chartLowest', { value: formatVndScale(lowest) })}</span>
                <span>{t('home.upcoming.chartEnding', { value: formatVndScale(forecast.endingProjectedBalance) })}</span>
              </div>
            </Sunk>
          ) : null}
        </div>

        <div>
          {rows.length === 0 ? (
            <p className="py-6 text-[13px] text-ink2">{t('home.upcoming.empty')}</p>
          ) : (
            <>
              {/* A real <table> with a real <thead> — not a div grid (§24). */}
              <div className="-mx-2.5 overflow-x-auto">
                <table className="table-dense w-full min-w-[420px] text-[14px]">
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
                        <td className="py-2.5 font-mono text-[12px] text-ink3">
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
                            'num py-2.5 text-right',
                            row.signedAmount > 0 && 'text-accent',
                          )}
                        >
                          {formatVndCellSigned(row.signedAmount)}
                        </td>
                        <td className="num py-2.5 text-right text-ink2">
                          {row.runningBalance === undefined
                            ? '·'
                            : formatVndCell(row.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <TotalRow
                label={t('home.upcoming.endingLabel')}
                value={formatVndScale(forecast.endingProjectedBalance)}
              />
            </>
          )}

          <div className="mt-4">
            <Link to="/upcoming" className="text-[13px] text-accent">
              {t('home.daysAhead.viewAll')}
            </Link>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/**
 * A single-series line: the household needs the low point, not a chart gallery
 * (§2.8). The low point is marked with an attention dot.
 */
function BalanceLine({
  points,
  lowestIndex,
  ariaLabel,
}: {
  points: { x: number; y: number }[]
  lowestIndex: number
  ariaLabel: string
}) {
  // Inset the plot so the stroke and the low-point marker are not clipped at
  // the edges of the viewBox.
  const PAD = 6
  const project = (point: { x: number; y: number }) => ({
    x: PAD + (point.x / 100) * (300 - PAD * 2),
    y: PAD + (point.y / 100) * (106 - PAD * 2),
  })

  const path = points
    .map(project)
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ')
  const low = points[lowestIndex] ? project(points[lowestIndex]) : undefined

  return (
    // A fixed viewBox with uniform scaling: `preserveAspectRatio="none"` would
    // stretch the low-point dot into an ellipse.
    <svg viewBox="0 0 300 106" className="h-[106px] w-full" role="img" aria-label={ariaLabel}>
      <polyline
        points={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {low ? <circle cx={low.x} cy={low.y} r="3" fill="var(--attention)" /> : null}
    </svg>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
