import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader, TotalRow } from '@/components/ui/panel'
import type { MoneyLocationRow } from '@/features/dashboard/model/home-derivations'
import { formatVndCell, formatVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * Home section 4 — Tiền đang ở đâu (§12.4).
 *
 * Five columns: Nơi giữ · Phụ trách · Vai trò · Cập nhật · Số dư, closing on a
 * "Tổng tiền mặt" sunk block.
 *
 * `Phụ trách` asks who is RESPONSIBLE for a source, never who spent from it —
 * that distinction is what keeps this a shared picture rather than a monitoring
 * tool (§0.2, §16.4). The API does not expose a holder yet, so the column
 * renders a neutral placeholder rather than inventing an attribution.
 */
export function MoneySourcesSection({
  rows,
  totalCash,
}: {
  rows: MoneyLocationRow[]
  totalCash: number
}) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('home.location.title')}
        action={
          <Link to="/assets" className="text-[13px] text-accent">
            {t('home.location.viewAll')}
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="mt-7 py-6 text-[13px] text-ink2">{t('home.moneyLocation.empty')}</p>
      ) : (
        <>
          <div className="mt-7 -mx-2.5 overflow-x-auto">
            <table className="table-dense w-full min-w-[560px] text-[14px]">
              <thead>
                <tr className="label">
                  <th className="pb-3 text-left font-normal">{t('home.location.column.place')}</th>
                  <th className="pb-3 text-left font-normal">{t('home.location.column.holder')}</th>
                  <th className="pb-3 text-left font-normal">{t('home.location.column.role')}</th>
                  <th className="pb-3 text-right font-normal">
                    {t('home.location.column.updated')}
                  </th>
                  <th className="pb-3 text-right font-normal">
                    {t('home.location.column.balanceUnit')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3">{row.name}</td>
                    <td className="py-3 text-ink2">{row.holder ?? t('home.location.noHolder')}</td>
                    <td className="py-3 text-ink2">{t(`home.location.role.${row.role}`)}</td>
                    <td
                      className={cn(
                        'py-3 text-right font-mono text-[11px]',
                        row.isStale ? 'text-attention' : 'text-ink3',
                      )}
                    >
                      <RelativeUpdate days={row.daysSinceUpdate} />
                    </td>
                    {/* Bare number — the unit is in the column header (§10.4). */}
                    <td className="num py-3 text-right">{formatVndCell(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TotalRow label={t('home.location.totalCash')} value={formatVndScale(totalCash)} />
        </>
      )}
    </Panel>
  )
}

/**
 * Relative timestamps per §10.5. Always a number, never "gần đây" — and the
 * mono font here only ever sees ASCII-safe short forms via i18n.
 */
function RelativeUpdate({ days }: { days: number | null }) {
  const { t } = useTranslation()

  if (days === null) return <>{t('time.never')}</>
  if (days <= 0) return <>{t('time.today')}</>
  if (days === 1) return <>{t('time.yesterday')}</>
  if (days < 30) return <>{t('time.daysAgo', { count: days })}</>
  return <>{t('time.overAMonth')}</>
}
