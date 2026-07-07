import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import {
  computeCurrentValue,
  computeMaturityValue,
  type Asset,
} from '@/features/assets/model/assets'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetListProps = {
  assets: Asset[]
  asOf: string
}

export function AssetList({ assets, asOf }: AssetListProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {assets.map((asset) => {
        const value = computeCurrentValue(asset, asOf)
        const isAutoPriced = asset.valuationMode !== 'manual'
        const priceMissing = value === null

        return (
          <div
            key={asset.id}
            className="surface-muted flex items-center justify-between rounded-3xl px-4 py-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{asset.name}</p>
                <Badge variant="outline">{t(`options.assetType.${asset.type}`)}</Badge>
                <Badge>{t(`options.liquidity.${asset.liquidity}`)}</Badge>
                {isAutoPriced ? (
                  <Badge className="bg-[hsla(var(--accent),0.12)] text-[hsl(var(--accent))]">
                    <Sparkles className="mr-1 size-3" />
                    {t('assets.list.autoPriced')}
                  </Badge>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {asset.note || t('common.noNote')}
              </p>

              {asset.marketPosition ? (
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {asset.marketPosition.symbol} ·{' '}
                  {t('assets.list.held', {
                    quantity: asset.marketPosition.quantity,
                    unit: asset.marketPosition.unit,
                  })}
                </p>
              ) : null}

              {asset.calculationTerm?.maturityDate ? (
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {t('assets.list.maturity', { value: asset.calculationTerm.maturityDate })} ·{' '}
                  {asset.calculationTerm.interestRate}%/yr
                  {(() => {
                    const maturity = computeMaturityValue(asset.calculationTerm!)
                    return maturity !== null ? ` → ${formatVndShort(maturity)}` : ''
                  })()}
                </p>
              ) : null}
            </div>

            <p className="money-number shrink-0 pl-3 text-2xl">
              {priceMissing ? t('assets.list.priceUnavailable') : formatVndShort(value ?? 0)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
