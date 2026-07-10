import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { AssetCompositionChart } from '@/features/assets/ui/components/asset-composition-chart'
import { AssetTrendChart } from '@/features/assets/ui/components/asset-trend-chart'
import type { AssetTotals } from '@/features/assets/model/assets-form'
import type { AssetSnapshotPoint } from '@/features/assets/model/assets.types'

type AssetsChartsProps = {
  totals: AssetTotals
  snapshots: AssetSnapshotPoint[]
}

export function AssetsCharts({ totals, snapshots }: AssetsChartsProps) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-5">
        <div className="mb-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('assets.charts.compositionEyebrow')}
          </p>
          <h2 className="section-title mt-1 text-2xl font-semibold">
            {t('assets.charts.compositionTitle')}
          </h2>
        </div>
        <AssetCompositionChart totals={totals} />
      </Card>

      <Card className="lg:col-span-7">
        <div className="mb-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('assets.charts.trendEyebrow')}
          </p>
          <h2 className="section-title mt-1 text-2xl font-semibold">
            {t('assets.charts.trendTitle')}
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {t('assets.charts.trendSubtitle')}
          </p>
        </div>
        <AssetTrendChart snapshots={snapshots} />
      </Card>
    </div>
  )
}
