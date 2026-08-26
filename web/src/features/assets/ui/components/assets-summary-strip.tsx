import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader, PanelSplit } from '@/components/ui/panel'
import { AssetCompositionChart } from '@/features/assets/ui/components/asset-composition-chart'
import type { AssetTotals } from '@money-space/core/features/assets/model/assets-form'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

type AssetsSummaryStripProps = {
  total: number
  totals: AssetTotals
  totalDebt: number
  asOf: string
}

/**
 * Net worth, and the one detail that is genuinely different from it.
 *
 * This used to be three metrics of equal weight — assets, debt, net worth —
 * side by side. Two of them were the arithmetic of the third, so the block
 * asked the household to do the subtraction before it could answer the question
 * it was there to answer. Net worth is now the single hero figure, with assets
 * and debt demoted to the line beneath it, and the space that bought back goes
 * to the liquidity split: how much of the total is actually reachable, which is
 * the thing the headline cannot tell you.
 */
export function AssetsSummaryStrip({
  total,
  totals,
  totalDebt,
  asOf,
}: AssetsSummaryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const updatedAt = new Date(asOf).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Panel>
      <PanelHeader title={t('assets.demo.netWorth')} meta={updatedAt} />

      <PanelSplit>
        <div>
          <p className="money-number t-hero">{formatVndScale(total - totalDebt)}</p>
          {/* The two operands, stated once and small: they explain the figure
              above without competing with it. */}
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 t-caption text-ink3">
            <span>{t('assets.demo.totalAssets', { value: formatVndScale(total) })}</span>
            <span>{t('assets.demo.totalDebt', { value: formatVndScale(totalDebt) })}</span>
          </p>
        </div>

        <div>
          <h3 className="t-subtitle">{t('assets.demo.byLiquidity')}</h3>
          <div className="mt-5">
            <AssetCompositionChart totals={totals} />
          </div>
        </div>
      </PanelSplit>
    </Panel>
  )
}
