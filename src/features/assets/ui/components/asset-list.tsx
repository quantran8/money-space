import { HandCoins, MoreVertical, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  computeCurrentValue,
  computeMaturityValue,
  isSellableAssetType,
  type Asset,
} from '@/features/assets/model/assets'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetListProps = {
  assets: Asset[]
  asOf: string
  onOpen?: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell?: (assetId: string) => void
  onDelete: (assetId: string) => void
}

export function AssetList({ assets, asOf, onOpen, onEdit, onSell, onDelete }: AssetListProps) {
  const { t } = useTranslation()

  return (
    <div className="divide-y divide-border">
      {assets.map((asset) => {
        const value = computeCurrentValue(asset, asOf)
        const isAutoPriced = asset.valuationMode !== 'manual'
        const priceMissing = value === null
        const isSold = asset.status === 'sold'
        const canSell = !isSold && isSellableAssetType(asset.type)

        return (
          <div
            key={asset.id}
            className="grid gap-3 py-5 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1.35fr)_minmax(100px,.7fr)_minmax(110px,.65fr)_36px] md:items-center"
          >
            <button
              type="button"
              onClick={() => onOpen?.(asset.id)}
              className="min-w-0 flex-1 cursor-pointer text-left"
              aria-label={asset.name}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{asset.name}</p>
                <Badge variant="outline">{t(`options.assetType.${asset.type}`)}</Badge>
                {isAutoPriced ? (
                  <Badge className="bg-[hsla(var(--accent),0.12)] text-[hsl(var(--accent))]">
                    <Sparkles className="mr-1 size-3" />
                    {t('assets.list.autoPriced')}
                  </Badge>
                ) : null}
                {isSold ? (
                  <Badge className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    {t('options.assetStatus.sold')}
                  </Badge>
                ) : null}
              </div>

              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
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
            </button>

            <p className="text-xs font-medium text-[hsl(var(--accent))]">
              {t(`options.liquidity.${asset.liquidity}`)}
            </p>
            <p
              className={
                isSold
                  ? 'money-number text-lg font-semibold text-muted-foreground line-through md:text-right'
                  : 'money-number text-lg font-semibold md:text-right'
              }
            >
              {priceMissing ? t('assets.list.priceUnavailable') : formatVndShort(value ?? 0)}
            </p>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={t('common.actions')}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(asset.id)}>
                    <Pencil className="size-4" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  {canSell && onSell ? (
                    <DropdownMenuItem onSelect={() => onSell(asset.id)}>
                      <HandCoins className="size-4" />
                      {t('assets.sale.action')}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                    onSelect={() => onDelete(asset.id)}
                  >
                    <Trash2 className="size-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </div>
  )
}
