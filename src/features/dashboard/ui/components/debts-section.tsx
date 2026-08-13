import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader, TotalRow } from '@/components/ui/panel'
import type { DebtSummary } from '@/features/dashboard/model/home-derivations'
import { formatVndCell, formatVndScale, formatMonthYear } from '@/shared/lib/format-money'

/**
 * Home section 4b — Nợ (design.md §9.1, §9.2).
 *
 * The other half of the paired block. Debt is shown as a BALANCE and a next
 * payment, never as a warning: an outstanding mortgage is a normal state for a
 * couple in this segment, and colouring it as alert would turn a fact into a
 * verdict (§16).
 *
 * `Kỳ tới` comes from the forecast timeline, so this date and the one in "Ba
 * mươi ngày tới" are always the same number (see buildDebtRows).
 *
 * The progress bar shows repayment on the LARGEST debt only. Averaging progress
 * across debts of different sizes produces a figure that describes none of them.
 */
export function DebtsSection({ summary }: { summary: DebtSummary }) {
  const { t } = useTranslation()
  const { rows, totalOutstanding, totalCount, largest } = summary

  return (
    <Panel>
      <PanelHeader
        title={t('home.debts.title')}
        action={
          <Link to="/debts" className="text-[13px] text-accent">
            {t('home.debts.viewAll')}
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="mt-7 py-6 text-[13px] text-ink2">{t('home.debts.empty')}</p>
      ) : (
        <>
          <div className="mt-7 -mx-2.5 overflow-x-auto">
            <table className="table-dense w-full min-w-[360px] text-[14px]">
              <thead>
                <tr className="label">
                  <th className="pb-3 text-left font-normal">{t('home.debts.column.item')}</th>
                  <th className="pb-3 text-left font-normal">{t('home.debts.column.nextDue')}</th>
                  {/* §10.4: unit in the header, bare numbers in the cells. */}
                  <th className="pb-3 text-right font-normal">
                    {t('home.debts.column.outstandingUnit')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5">
                      {row.lenderName ? `${row.name} · ${row.lenderName}` : row.name}
                    </td>
                    <td className="py-2.5 font-mono text-[12px] text-ink3">
                      {row.nextPayment
                        ? t('home.debts.nextDue', {
                            date: formatDayMonth(row.nextPayment.date),
                            amount: formatVndScale(row.nextPayment.amount),
                          })
                        : t('home.debts.noNextDue')}
                    </td>
                    <td className="num py-2.5 text-right">{formatVndCell(row.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalCount > rows.length ? (
            <p className="mt-3 font-mono text-[10px] text-ink3">
              {t('home.debts.more', { count: totalCount - rows.length })}
            </p>
          ) : null}

          {largest ? (
            <div className="mt-7">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[13px] text-ink2">
                  {t('home.debts.repaidOn', { name: largest.name })}
                </p>
                <span className="num font-mono text-[11px] text-ink3">
                  {largest.repaidPercent}%
                </span>
              </div>
              {/* Neutral ink, not accent: repayment progress is a fact, not a win. */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hair">
                <div
                  className="h-full rounded-full bg-ink3"
                  style={{ width: `${largest.repaidPercent}%` }}
                />
              </div>
              {largest.expectedFinalDueDate ? (
                <p className="mt-2.5 font-mono text-[11px] text-ink3">
                  {t('home.debts.payoffEta', {
                    date: formatMonthYear(largest.expectedFinalDueDate),
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          <TotalRow label={t('home.debts.total')} value={formatVndScale(totalOutstanding)} />
        </>
      )}
    </Panel>
  )
}

/** "10/09" — ASCII only, so it is safe in the mono face (§10.1). */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
