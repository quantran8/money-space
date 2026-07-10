import { useTranslation } from 'react-i18next'

import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import type { AssetTotals } from '@/features/assets/model/assets-form'
import { liquidityColors } from '@/shared/constants/colors'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetsSummaryStripProps = {
  totals: AssetTotals
  total: number
}

export function AssetsSummaryStrip({ totals, total }: AssetsSummaryStripProps) {
  const { t } = useTranslation()
  return (
    <SummaryStrip>
      <SummaryTile
        label={t('assets.strip.usableNow')}
        value={formatVndShort(totals.usable_now)}
        dotColor={liquidityColors.usable_now}
      />
      <SummaryTile
        label={t('assets.strip.reserve')}
        value={formatVndShort(totals.not_immediately_usable)}
        dotColor={liquidityColors.not_immediately_usable}
      />
      <SummaryTile
        label={t('assets.strip.longTerm')}
        value={formatVndShort(totals.long_term)}
        dotColor={liquidityColors.long_term}
      />
      <SummaryTile label={t('assets.strip.total')} value={formatVndShort(total)} inverted />
    </SummaryStrip>
  )
}
