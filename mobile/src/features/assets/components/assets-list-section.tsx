import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  computeCurrentValue,
  isSellableAssetType,
  liquidityOrder,
  sectionForAsset,
  sectionMatchesLiquidity,
  sectionOrder,
  toneForValueChange,
  type Asset,
  type AssetLiquidity,
} from '@money-space/core/features/assets/model/assets'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'
import {
  formatPercentSigned,
  formatVndCellSigned,
  formatVndShort,
} from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import {
  ActionSheet,
  EmptyState,
  Field,
  GroupedRow,
  Panel,
  PanelHeader,
  Select,
  Skeleton,
  type ActionSheetItem,
} from '@/components/ui'
import { AssetTypeIcon } from '@/features/assets/components/asset-type-icon'

/**
 * The household's money sources, one card per liquidity group.
 *
 * A single flat list sorted the household's sources by nothing in particular
 * and made "how much can I actually reach" a question you answered by reading
 * a `Thanh khoản` label down every row. The grouping the donut above already
 * uses now shapes the list itself, so each card answers that question with a
 * subtotal before a single row is read — and `Thanh khoản` stops being part of
 * each row's metadata, because it has become the heading.
 *
 * The cards are not one per liquidity bucket: `other`-type holdings get their
 * own group rather than being filed under `Tiết kiệm` alongside real deposits
 * (see `sectionForAsset`). The filter above still asks the three-bucket
 * question, so narrowing to `Tiết kiệm` keeps both of that bucket's groups.
 *
 * The web lays the four groups out on a 2x2 grid, `other` beside `long_term`.
 * There is no wide breakpoint here: the groups stack in one column, in
 * `sectionOrder`.
 *
 * Rows stay grouped rows (§8): the columns a table would give — owner,
 * freshness — fold into one metadata line under the name, and the amount keeps
 * the right edge where a column of them still lines up. Nothing scrolls
 * horizontally, and money never truncates.
 *
 * The heading and its toolbar sit on the CANVAS, above the cards — a group is
 * its own card, so a panel wrapping all of them would put a card inside a card
 * and lose the separation the grouping exists for.
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
  onAdd,
  onEdit,
  onDelete,
  onSell,
  onBuyMore,
}: {
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
  onAdd: () => void
  onEdit: (assetId: string) => void
  onDelete: (assetId: string) => void
  /** Omitted → the entry is not offered. */
  onSell?: (assetId: string) => void
  onBuyMore?: (assetId: string) => void
}) {
  const { t } = useTranslation()
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  /* Which absence this is. "Nothing recorded yet" and "the filter excluded it"
     look identical in an empty card but mean opposite things to a household —
     the first is a prompt to add, the second is a prompt to clear the filter. */
  const isFiltered = query.trim().length > 0 || liquidityFilter !== 'all'

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

  /** Edit / buy more / sell / delete, gated exactly as on the web. */
  const rowActions = (asset: Asset): ActionSheetItem[] => {
    const isSold = asset.status === 'sold'
    const items: ActionSheetItem[] = [
      { key: 'edit', label: t('common.edit'), onPress: () => onEdit(asset.id) },
    ]

    // Buying more re-averages a cost basis, so it needs a position to average
    // INTO — a balance asset has none.
    if (!isSold && asset.marketPosition && onBuyMore) {
      items.push({
        key: 'buy',
        label: t('assets.purchase.title'),
        onPress: () => onBuyMore(asset.id),
      })
    }
    if (!isSold && isSellableAssetType(asset.type) && onSell) {
      items.push({ key: 'sell', label: t('assets.sale.action'), onPress: () => onSell(asset.id) })
    }

    items.push({
      key: 'delete',
      label: t('common.delete'),
      onPress: () => onDelete(asset.id),
      destructive: true,
    })
    return items
  }

  /** One source row, shared by every group. */
  const renderAsset = (asset: Asset) => {
    const value = computeCurrentValue(asset, asOf)
    const isSold = asset.status === 'sold'
    const holder =
      (asset.holderMemberId ? memberNameById.get(asset.holderMemberId) : undefined) ??
      t('assets.demo.householdOwner')
    const freshness = formatFreshness(asset.valueUpdatedAt, t)
    const change = asset.valueChange ?? null
    // Percent, not đồng: it compares across rows of very different sizes.
    const dayChange = change
      ? change.deltaPercent === null
        ? formatVndCellSigned(change.delta)
        : formatPercentSigned(change.deltaPercent)
      : null
    const dayChangeTone = change
      ? ({ positive: 'positive', alert: 'alert', default: 'muted' } as const)[
          toneForValueChange(change.delta)
        ]
      : 'muted'

    return (
      <GroupedRow
        key={asset.id}
        title={asset.name}
        // The type is the leading GLYPH now, so this line is free for the two
        // things that actually vary between rows: who holds it, and how old the
        // figure is. Liquidity is the card's heading, never repeated per row.
        leading={<AssetTypeIcon type={asset.type} />}
        meta={
          <View className="flex-row items-center gap-2">
            <View
              accessible
              accessibilityLabel={t('assets.demo.heldBy', { name: holder })}
              className="items-center justify-center rounded-pill bg-wash"
              style={{ width: 24, height: 24 }}
            >
              <Text className="t-caption-sm font-medium text-ink2">{initialsOf(holder)}</Text>
            </View>
            <Text
              className={cn('t-caption', freshness.stale ? 'text-attention-ink' : 'text-ink3')}
              numberOfLines={1}
            >
              {freshness.label}
            </Text>
          </View>
        }
        // `formatVndShort`, not `formatVndCell`: the cell formatter drops the
        // unit on the promise that a column header carries it, and grouped rows
        // have no header to carry it.
        //
        // Never `0đ` for "no price yet" — they are different facts.
        value={value === null ? t('assets.list.priceUnavailable') : formatVndShort(value)}
        // A sold asset is kept for history, so it stays in the list but reads as
        // past tense rather than as a live holding. Staleness is NOT toned here:
        // it qualifies the figure's AGE, which the meta line already says — an
        // amber amount would read as "this money needs attention".
        // Sold wins the slot: a live delta on a closed holding would say it is
        // still moving. The delta's tone is about DIRECTION, not attention,
        // which is why colour is allowed here where amber is not.
        valueMeta={isSold ? t('options.assetStatus.sold') : (dayChange ?? undefined)}
        valueTone={isSold ? 'muted' : 'default'}
        valueMetaTone={isSold || !change ? 'muted' : dayChangeTone}
        right={
          <ActionSheet
            title={asset.name}
            accessibilityLabel={t('assets.demo.optionsFor', { name: asset.name })}
            items={rowActions(asset)}
          />
        }
        onPress={() => onOpen(asset.id)}
      />
    )
  }

  /* Search beside the filter on one row, as on the web: the filter is four
     short options, so a full-width control each would push the first card off
     the screen. */
  const toolbar = (
    <View className="flex-row items-center gap-2">
      <Field
        className="flex-1"
        value={query}
        onChangeText={onQueryChange}
        placeholder={t('assets.demo.search')}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <Select
        className="w-[124px]"
        value={liquidityFilter}
        onChange={onLiquidityFilterChange}
        options={[
          { value: 'all' as const, label: t('assets.toolbar.all') },
          ...liquidityOrder.map((liquidity) => ({
            value: liquidity,
            label: t(`options.liquidity.${liquidity}`),
          })),
        ]}
      />
    </View>
  )

  if (isLoading) {
    return (
      <View className="gap-3">
        <Text className="t-title text-ink">{t('assets.demo.sources')}</Text>
        {toolbar}
        <Panel>
          <View className="gap-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} height={56} />
            ))}
          </View>
        </Panel>
      </View>
    )
  }

  // Every group empty means the search or the filter matched nothing — three
  // empty cards would say that three times over, so say it once.
  if (assets.length === 0) {
    return (
      <View className="gap-3">
        <Text className="t-title text-ink">{t('assets.demo.sources')}</Text>
        {toolbar}
        <Panel>
          {isFiltered ? (
            <EmptyState message={t('assets.toolbar.empty')} />
          ) : (
            <EmptyState
              message={t('assets.toolbar.noneYet')}
              action={t('assets.demo.addSource')}
              onAction={onAdd}
            />
          )}
        </Panel>
      </View>
    )
  }

  return (
    <View className="gap-3">
      <Text className="t-title text-ink">{t('assets.demo.sources')}</Text>
      {toolbar}

      {/* `s-card-gap` (12): the groups read as one surface, not as unrelated
          objects. */}
      <View className="s-card-gap">
        {groups.map(({ section, items, subtotal }) => {
          /* The one case where dropping the card is still right: the reader
             narrowed to a single bucket on purpose, so the others are not an
             absence worth reporting — they are the filter working. */
          if (!sectionMatchesLiquidity(section, liquidityFilter)) return null

          return (
            <Panel key={section}>
              <PanelHeader
                title={t(`options.assetSection.${section}`)}
                right={
                  <Text className="t-caption text-ink3">
                    {t('assets.demo.sourceCount', { count: items.length })}
                  </Text>
                }
              />

              {/* The subtotal answers "how much can I reach" before a single
                  row is read. A truthful 0đ for an empty group. */}
              <Text className="mt-4 t-figure text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                {formatVndShort(subtotal)}
              </Text>
              <Text className="mt-1 t-caption text-ink3">
                {t('assets.strip.share', {
                  value: total > 0 ? Math.round((subtotal / total) * 100) : 0,
                })}
              </Text>

              {items.length === 0 ? (
                /* The card stays in place rather than being dropped, so the
                   groups are always in the same order and the reader learns
                   "nothing here" instead of having to notice one is missing. */
                <EmptyState
                  className="mt-5"
                  icon="wallet-outline"
                  message={
                    isFiltered
                      ? t('assets.toolbar.groupEmpty')
                      : t('assets.toolbar.groupNoneYet')
                  }
                />
              ) : (
                <View className="mt-5">{items.map(renderAsset)}</View>
              )}
            </Panel>
          )
        })}
      </View>
    </View>
  )
}

/** "Quân Trần" → "QT"; a single word → its first two letters. */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * How old the figure is. Stale past 30 days — the value is still shown, never
 * dimmed; the caveat is what says it might have moved (§6.2).
 */
function formatFreshness(
  value: string | undefined,
  t: (key: string, params?: Record<string, unknown>) => string,
) {
  if (!value) return { label: t('time.never'), stale: true }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { label: t('time.never'), stale: true }
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
  if (days === 0) return { label: t('time.today'), stale: false }
  return { label: t('time.daysAgo', { count: days }), stale: days > 30 }
}
