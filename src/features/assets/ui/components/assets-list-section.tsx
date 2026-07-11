import { Search, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AssetList } from '@/features/assets/ui/components/asset-list'
import { FilterChip } from '@/features/assets/ui/components/filter-chip'
import { liquidityOrder, type Asset, type AssetLiquidity } from '@/features/assets/model/assets'

type AssetsListSectionProps = {
  assets: Asset[]
  asOf: string
  query: string
  onQueryChange: (value: string) => void
  liquidityFilter: AssetLiquidity | 'all'
  onLiquidityFilterChange: (value: AssetLiquidity | 'all') => void
  onOpen: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell: (assetId: string) => void
  onDelete: (assetId: string) => void
}

export function AssetsListSection({
  assets,
  asOf,
  query,
  onQueryChange,
  liquidityFilter,
  onLiquidityFilterChange,
  onOpen,
  onEdit,
  onSell,
  onDelete,
}: AssetsListSectionProps) {
  const { t } = useTranslation()

  return (
    <Card className="lg:col-span-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('assets.list.eyebrow')}</p>
          <h2 className="section-title mt-1 text-2xl font-semibold">{t('assets.list.title')}</h2>
        </div>
        <Wallet className="size-5 text-[hsl(var(--accent))]" />
      </div>

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('assets.toolbar.searchPlaceholder')}
            className="pl-11"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            label={t('assets.toolbar.all')}
            active={liquidityFilter === 'all'}
            onClick={() => onLiquidityFilterChange('all')}
          />
          {liquidityOrder.map((liquidity) => (
            <FilterChip
              key={liquidity}
              label={t(`options.liquidity.${liquidity}`)}
              active={liquidityFilter === liquidity}
              onClick={() => onLiquidityFilterChange(liquidity)}
            />
          ))}
        </div>
      </div>

      {assets.length > 0 ? (
        <AssetList
          assets={assets}
          asOf={asOf}
          onOpen={onOpen}
          onEdit={onEdit}
          onSell={onSell}
          onDelete={onDelete}
        />
      ) : (
        <p className="rounded-3xl bg-[hsl(var(--muted))] px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('assets.toolbar.empty')}
        </p>
      )}
    </Card>
  )
}
