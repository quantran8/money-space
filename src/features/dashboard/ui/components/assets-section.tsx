import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader, TotalRow } from '@/components/ui/panel'
import type { AssetHoldingRow } from '@/features/dashboard/model/home-derivations'
import { formatVndCell, formatVndScale } from '@/shared/lib/format-money'

/**
 * Home section 4a — Tài sản (design.md §9.1, §9.2).
 *
 * Half of the ONLY paired block on Home. Assets and debts sit side by side
 * because either one alone is a misleading picture — 3,2 tỷ tài sản reads very
 * differently next to 1,4 tỷ nợ (§13).
 *
 * Three columns only: Mục · Loại · Giá trị. No per-asset change, no allocation
 * chart, no net worth — those belong to the Tài sản page (§14, §5.3). This
 * section answers "what do we own", nothing more.
 */
export function AssetsSection({
  rows,
  totalAssets,
  totalCount,
}: {
  rows: AssetHoldingRow[]
  totalAssets: number
  totalCount: number
}) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('home.assets.title')}
        action={
          <Link to="/assets" className="text-[13px] text-accent">
            {t('home.assets.viewAll')}
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="mt-7 py-6 text-[13px] text-ink2">{t('home.assets.empty')}</p>
      ) : (
        <>
          <div className="mt-7 -mx-2.5 overflow-x-auto">
            <table className="table-dense w-full min-w-[360px] text-[14px]">
              <thead>
                <tr className="label">
                  <th className="pb-3 text-left font-normal">{t('home.assets.column.item')}</th>
                  <th className="pb-3 text-left font-normal">{t('home.assets.column.type')}</th>
                  {/* §10.4: unit in the header, bare numbers in the cells. */}
                  <th className="pb-3 text-right font-normal">
                    {t('home.assets.column.valueUnit')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5">{row.name}</td>
                    <td className="py-2.5 text-ink2">{t(`options.assetType.${row.type}`)}</td>
                    <td className="num py-2.5 text-right">{formatVndCell(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The table is capped, so the total would otherwise look wrong (§2.16). */}
          {totalCount > rows.length ? (
            <p className="mt-3 font-mono text-[10px] text-ink3">
              {t('home.assets.more', { count: totalCount - rows.length })}
            </p>
          ) : null}

          <TotalRow label={t('home.assets.total')} value={formatVndScale(totalAssets)} />
        </>
      )}
    </Panel>
  )
}
