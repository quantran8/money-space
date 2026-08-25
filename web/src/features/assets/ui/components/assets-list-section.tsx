import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AssetSourceRow } from '@/features/assets/ui/components/asset-source-row'
import {
  computeCurrentValue,
  liquidityOrder,
  type Asset,
  type AssetLiquidity,
} from '@money-space/core/features/assets/model/assets'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

type AssetsListSectionProps = {
  assets: Asset[]
  members: MemberItem[]
  isLoading?: boolean
  asOf: string
  /** Total of ALL assets, not just the filtered ones — the share denominator. */
  total: number
  query: string
  onQueryChange: (value: string) => void
  liquidityFilter: AssetLiquidity | 'all'
  onLiquidityFilterChange: (value: AssetLiquidity | 'all') => void
  onOpen: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell: (assetId: string) => void
  onDelete: (assetId: string) => void
}

/**
 * Money sources, one card per liquidity group.
 *
 * A single flat table sorted the household's sources by nothing in particular
 * and made "how much can I actually reach" a question you answered by reading
 * a `Thanh khoản` column down every row. The grouping the donut above already
 * uses now shapes the list itself, so each card answers that question with a
 * subtotal before a single row is read — and `Thanh khoản` stops being a
 * column, because it has become the heading.
 *
 * `usable_now` and `not_immediately_usable` share a row on wide screens;
 * `long_term` spans the full width beneath them, since it is normally the
 * longest list.
 */
export function AssetsListSection({
  assets,
  members,
  isLoading = false,
  asOf,
  total,
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
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  )

  const groups = useMemo(
    () =>
      liquidityOrder.map((liquidity) => {
        const items = assets.filter((asset) => asset.liquidity === liquidity)
        return {
          liquidity,
          items,
          subtotal: items.reduce(
            (sum, asset) => sum + (computeCurrentValue(asset, asOf) ?? 0),
            0,
          ),
        }
      }),
    [assets, asOf],
  )

  const toolbar = (
    <div className="flex items-center gap-2">
      <label className="sunk flex h-10 min-w-0 flex-1 items-center gap-2 px-3 sm:w-[250px]">
        <Search className="size-4 shrink-0 text-ink3" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('assets.demo.search')}
          className="min-w-0 flex-1 bg-transparent t-body-sm outline-none placeholder:text-ink3"
        />
      </label>
      <Select
        value={liquidityFilter}
        onValueChange={(value) => onLiquidityFilterChange(value as AssetLiquidity | 'all')}
      >
        <SelectTrigger
          className="h-10 w-[112px] bg-wash px-3 t-body-sm"
          aria-label={t('assets.demo.filter')}
        >
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
  )

  if (isLoading) {
    return (
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="t-title">{t('assets.demo.sources')}</h2>
          {toolbar}
        </div>
        <div className="s-head-body space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-control" />
          ))}
        </div>
      </Panel>
    )
  }

  // Every group empty means the search or the filter matched nothing — the
  // three empty cards would say that three times over, so say it once.
  if (assets.length === 0) {
    return (
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="t-title">{t('assets.demo.sources')}</h2>
          {toolbar}
        </div>
        <p className="s-head-body rounded-control bg-wash px-4 py-8 text-center t-body-sm text-ink2">
          {t('assets.toolbar.empty')}
        </p>
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="t-title">{t('assets.demo.sources')}</h2>
        {toolbar}
      </div>

      <div className="s-card-gap grid lg:grid-cols-2">
        {groups.map(({ liquidity, items, subtotal }) => {
          // A group with nothing in it is dropped rather than shown empty: the
          // filter above already explains the absence, and an empty card in the
          // middle of the grid reads as a loading failure.
          if (items.length === 0) return null

          return (
            <Panel
              key={liquidity}
              className={liquidity === 'long_term' ? 'lg:col-span-2' : undefined}
            >
              <PanelHeader
                title={t(`options.liquidity.${liquidity}`)}
                meta={t('assets.demo.sourceCount', { count: items.length })}
              />

              <p className="money-number mt-4 t-figure">{formatVndScale(subtotal)}</p>
              <p className="mt-1 t-caption text-ink3">
                {t('assets.strip.share', {
                  value: total > 0 ? Math.round((subtotal / total) * 100) : 0,
                })}
              </p>

              <div
                className={
                  liquidity === 'long_term'
                    ? 'mt-5 grid gap-x-12 lg:grid-cols-2'
                    : 'mt-5 space-y-2'
                }
              >
                {liquidity === 'long_term'
                  ? splitInHalf(items).map((column, index) => (
                      <div key={index} className="space-y-2">
                        {column.map((asset) => (
                          <SourceRow
                            key={asset.id}
                            asset={asset}
                            asOf={asOf}
                            memberById={memberById}
                            onOpen={onOpen}
                            onEdit={onEdit}
                            onSell={onSell}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    ))
                  : items.map((asset) => (
                      <SourceRow
                        key={asset.id}
                        asset={asset}
                        asOf={asOf}
                        memberById={memberById}
                        onOpen={onOpen}
                        onEdit={onEdit}
                        onSell={onSell}
                        onDelete={onDelete}
                      />
                    ))}
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

function SourceRow({
  asset,
  asOf,
  memberById,
  onOpen,
  onEdit,
  onSell,
  onDelete,
}: {
  asset: Asset
  asOf: string
  memberById: Map<string, MemberItem>
  onOpen: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell: (assetId: string) => void
  onDelete: (assetId: string) => void
}) {
  const { t } = useTranslation()
  const holder = asset.holderMemberId ? memberById.get(asset.holderMemberId) : undefined

  return (
    <AssetSourceRow
      asset={asset}
      asOf={asOf}
      holderLabel={holder?.name ?? t('assets.demo.householdOwner')}
      holderInitials={holder?.initials ?? t('assets.demo.householdInitials')}
      onOpen={onOpen}
      onEdit={onEdit}
      onSell={onSell}
      onDelete={onDelete}
    />
  )
}

/** Balances the long-term card's two columns, first half left. */
function splitInHalf<T>(items: T[]): [T[], T[]] {
  const half = Math.ceil(items.length / 2)
  return [items.slice(0, half), items.slice(half)]
}
