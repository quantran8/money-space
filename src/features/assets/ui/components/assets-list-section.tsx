import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AssetList } from '@/features/assets/ui/components/asset-list'
import { FilterChip } from '@/features/assets/ui/components/filter-chip'
import { liquidityOrder, type Asset, type AssetLiquidity } from '@/features/assets/model/assets'

type AssetsListSectionProps = {
  assets: Asset[]
  isLoading?: boolean
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
  isLoading = false,
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
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('assets.list.eyebrow')}</p>
            <h2 className="section-title mt-1 text-2xl font-semibold">{t('assets.list.title')}</h2>
          </div>
          <p className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground">
            {t('assets.list.count', { count: assets.length })}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('assets.toolbar.searchPlaceholder')}
            className="h-12 rounded-2xl pl-11"
          />
        </div>

          <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 xl:pb-0">
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
      </div>

      <div className="p-5 sm:p-7">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="surface-muted flex items-center justify-between rounded-3xl px-4 py-4"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40 rounded-full" />
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : assets.length > 0 ? (
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
      </div>
    </Card>
  )
}
