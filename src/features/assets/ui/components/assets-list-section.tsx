import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Panel } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AssetList } from '@/features/assets/ui/components/asset-list'
import { liquidityOrder, type Asset, type AssetLiquidity } from '@/features/assets/model/assets'
import type { MemberItem } from '@/features/members/model/members.types'

type AssetsListSectionProps = {
  assets: Asset[]
  members: MemberItem[]
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
  members,
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
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title text-[16px]">{t('assets.demo.sources')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="sunk flex h-10 min-w-0 flex-1 items-center gap-2 px-3 sm:w-[250px]">
            <Search className="size-4 shrink-0 text-ink3" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t('assets.demo.search')}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink3"
            />
          </label>
          <Select
            value={liquidityFilter}
            onValueChange={(value) => onLiquidityFilterChange(value as AssetLiquidity | 'all')}
          >
            <SelectTrigger className="h-10 w-[112px] bg-sunk px-3 text-[13px]" aria-label={t('assets.demo.filter')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('assets.toolbar.all')}</SelectItem>
              {liquidityOrder.map((liquidity) => (
                <SelectItem key={liquidity} value={liquidity}>
                  {t(`options.liquidity.${liquidity}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-7 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-control" />
          ))}
        </div>
      ) : assets.length > 0 ? (
        <AssetList
          assets={assets}
          members={members}
          asOf={asOf}
          onOpen={onOpen}
          onEdit={onEdit}
          onSell={onSell}
          onDelete={onDelete}
        />
      ) : (
        <p className="mt-7 rounded-sunk bg-sunk px-4 py-8 text-center text-[13px] text-ink2">
          {t('assets.toolbar.empty')}
        </p>
      )}
    </Panel>
  )
}
