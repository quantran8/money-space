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
    <div className="grid gap-5 lg:grid-cols-12">
      <Card className="p-6 sm:p-7 lg:col-span-4">
        <div className="mb-6">
          <h2 className="section-title text-2xl font-semibold">
            {t('assets.charts.compositionTitle')}
          </h2>
        </div>
        <AssetCompositionChart totals={totals} />
      </Card>

      <Card className="overflow-hidden p-6 sm:p-7 lg:col-span-8">
        <div className="mb-6">
          <h2 className="section-title text-2xl font-semibold">{t('assets.charts.trendTitle')}</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{t('assets.charts.trendSubtitle')}</p>
        </div>
        <AssetTrendChart snapshots={snapshots} />
      </Card>
    </div>
  )
}
