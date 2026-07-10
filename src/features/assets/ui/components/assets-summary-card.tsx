import { Landmark } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MetricCell } from '@/components/ui/metric-cell'
import { SubSection } from '@/components/ui/sub-section'
import type { AssetTotals } from '@/features/assets/model/assets-form'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetsSummaryCardProps = {
  totals: AssetTotals
  total: number
}

export function AssetsSummaryCard({ totals, total }: AssetsSummaryCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('assets.summary.eyebrow')}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{t('assets.summary.title')}</h2>
        </div>
        <Landmark className="size-5 text-[hsl(var(--accent))]" />
      </div>

      <div className="space-y-4">
        <SubSection
          title={t('assets.summary.liquidityGroup')}
          aside={
            <Badge className="bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]">
              {t('assets.summary.healthy')}
            </Badge>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <MetricCell
              label={t('assets.summary.usableNow')}
              value={formatVndShort(totals.usable_now)}
            />
            <MetricCell
              label={t('assets.summary.reserve')}
              value={formatVndShort(totals.not_immediately_usable)}
            />
          </div>
        </SubSection>

        <SubSection title={t('assets.summary.holdingsGroup')}>
          <div className="grid grid-cols-2 gap-3">
            <MetricCell
              label={t('assets.summary.longTerm')}
              value={formatVndShort(totals.long_term)}
            />
            <MetricCell label={t('assets.summary.total')} value={formatVndShort(total)} />
          </div>
        </SubSection>
      </div>
    </Card>
  )
}
