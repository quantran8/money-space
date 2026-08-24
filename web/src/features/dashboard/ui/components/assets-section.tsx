import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader, TotalRow } from '@/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AssetHoldingRow } from '@money-space/core/features/dashboard/model/home-derivations'
import { formatVndCell, formatVndScale } from '@money-space/core/shared/lib/format-money'

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
          <Link to="/networth" className="text-[13px] text-action">
            {t('home.assets.viewAll')}
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="mt-7 py-6 text-[13px] text-ink2">{t('home.assets.empty')}</p>
      ) : (
        <>
          <div className="mt-7 -mx-2.5">
            <Table className="min-w-[360px] text-[14px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {/* `.label-vi`: accented Vietnamese headings (§10.1). */}
                  <TableHead className="label-vi">{t('home.assets.column.item')}</TableHead>
                  <TableHead className="label-vi">{t('home.assets.column.type')}</TableHead>
                  {/* §10.4: unit in the header, bare numbers in the cells. */}
                  <TableHead className="label-vi text-right">
                    {t('home.assets.column.valueUnit')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-ink2">
                      {t(`options.assetType.${row.type}`)}
                    </TableCell>
                    <TableCell className="num text-right">{formatVndCell(row.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
