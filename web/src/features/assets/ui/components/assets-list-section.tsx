import { Search, SearchX, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/ui/empty-state'
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
  sectionForAsset,
  sectionMatchesLiquidity,
  sectionOrder,
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
  onBuyMore: (assetId: string) => void
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
 * The cards are not one per liquidity bucket: `other`-type holdings get their
 * own, rather than being filed under `Tiết kiệm` alongside real deposits (see
 * `sectionForAsset`). The liquidity filter above still asks the three-bucket
 * question, so narrowing to `Tiết kiệm` keeps both of that bucket's cards.
 *
 * Two cards per row: `usable_now` beside `not_immediately_usable`, then `other`
 * beside `long_term`. `long_term` used to span the full width and split its rows
 * into two inner columns; sharing its row with `other` is what keeps the four
 * cards on one 2×2 grid instead of leaving a half-empty row above it.
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
  onBuyMore,
  onDelete,
}: AssetsListSectionProps) {
  const { t } = useTranslation()
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  )

  const groups = useMemo(
    () =>
      sectionOrder.map((section) => {
        const items = assets.filter((asset) => sectionForAsset(asset) === section)
        return {
          section,
          items,
          subtotal: items.reduce(
            (sum, asset) => sum + (computeCurrentValue(asset, asOf) ?? 0),
            0,
          ),
        }
      }),
    [assets, asOf],
  )

  /* Which absence this is. "Nothing recorded yet" and "the filter excluded it"
     look identical in an empty card but mean opposite things to a household —
     the first is a prompt to add, the second is a prompt to clear the filter. */
  const isFiltered = query.trim().length > 0 || liquidityFilter !== 'all'

  const toolbar = (
    <div className="flex items-center gap-2">
      <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-control border border-committed bg-card px-3 sm:w-[250px]">
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
          className="h-10 w-[112px] px-3 t-body-sm"
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
        <EmptyState icon={SearchX} className="s-head-body">
          {t('assets.toolbar.empty')}
        </EmptyState>
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
        {groups.map(({ section, items, subtotal }) => {
          /* The one case where dropping the card is still right: the reader
             narrowed to a single bucket on purpose, so the others are not
             an absence worth reporting — they are the filter working. */
          if (!sectionMatchesLiquidity(section, liquidityFilter)) return null

          const isEmpty = items.length === 0

          return (
            <Panel key={section}>
              <PanelHeader
                title={t(`options.assetSection.${section}`)}
                meta={t('assets.demo.sourceCount', { count: items.length })}
              />

              <p className="money-number mt-4 t-figure">{formatVndScale(subtotal)}</p>
              <p className="mt-1 t-caption text-ink3">
                {t('assets.strip.share', {
                  value: total > 0 ? Math.round((subtotal / total) * 100) : 0,
                })}
              </p>

              {isEmpty ? (
                /* The card stays in the grid rather than being dropped, so the
                   groups are always in the same place and the reader learns
                   "nothing here" instead of having to notice a card is missing.
                   The subtotal above is a truthful 0đ, so the only thing to
                   replace is the row list. */
                <EmptyState icon={isFiltered ? SearchX : Wallet} className="mt-5 py-6">
                  {isFiltered
                    ? t('assets.toolbar.groupEmpty')
                    : t('assets.toolbar.groupNoneYet')}
                </EmptyState>
              ) : (
                <div className="mt-5 space-y-2">
                  {items.map((asset) => (
                    <SourceRow
                      key={asset.id}
                      asset={asset}
                      asOf={asOf}
                      memberById={memberById}
                      onOpen={onOpen}
                      onEdit={onEdit}
                      onSell={onSell}
                      onBuyMore={onBuyMore}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
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
  onBuyMore,
  onDelete,
}: {
  asset: Asset
  asOf: string
  memberById: Map<string, MemberItem>
  onOpen: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell: (assetId: string) => void
  onBuyMore: (assetId: string) => void
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
      onBuyMore={onBuyMore}
      onDelete={onDelete}
    />
  )
}
