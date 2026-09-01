import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  computeCurrentValue,
  liquidityOrder,
  type Asset,
  type AssetLiquidity,
} from '@money-space/core/features/assets/model/assets'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import {
  EmptyState,
  Field,
  GroupedRow,
  Panel,
  PanelHeader,
  RowMeta,
  Segmented,
  Skeleton,
} from '@/components/ui'

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
 * The web puts `usable_now` and `not_immediately_usable` side by side and
 * splits `long_term` into two inner columns. There is no wide breakpoint here:
 * the groups stack in one column, in `liquidityOrder`.
 *
 * Rows stay grouped rows (§8): the columns a table would give — owner,
 * freshness — fold into one metadata line under the name, and the amount keeps
 * the right edge where a column of them still lines up. Nothing scrolls
 * horizontally, and money never truncates.
 *
 * Opening a row goes to the detail screen. Edit / sell / remove live THERE
 * rather than behind a per-row menu: a three-dot menu on a 44pt row is a target
 * inside a target, and the actions all need the asset's own context anyway.
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
}) {
  const { t } = useTranslation()
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  /* Which absence this is. "Nothing recorded yet" and "the filter excluded it"
     look identical in an empty card but mean opposite things to a household —
     the first is a prompt to add, the second is a prompt to clear the filter. */
  const isFiltered = query.trim().length > 0 || liquidityFilter !== 'all'

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

  /** One source row, shared by every group. */
  const renderAsset = (asset: Asset) => {
    const value = computeCurrentValue(asset, asOf)
    const isSold = asset.status === 'sold'
    const holder =
      (asset.holderMemberId ? memberNameById.get(asset.holderMemberId) : undefined) ??
      t('assets.demo.householdOwner')
    const freshness = formatFreshness(asset.valueUpdatedAt, t)

    return (
      <GroupedRow
        key={asset.id}
        title={asset.name}
        // Vietnamese, so the sans face — mono must never touch diacritics (§5,
        // hard constraint). Liquidity is gone from this line: the card's own
        // heading now carries it, and repeating it per row said it twice.
        meta={
          <RowMeta>
            {[t(`options.assetType.${asset.type}`), holder, freshness.label].join(' · ')}
          </RowMeta>
        }
        // `formatVndShort`, not `formatVndCell`: the cell formatter drops the
        // unit on the promise that a column header carries it, and grouped rows
        // have no header to carry it.
        //
        // Never `0đ` for "no price yet" — they are different facts.
        value={value === null ? t('assets.list.priceUnavailable') : formatVndShort(value)}
        // A sold asset is kept for history, so it stays in the list but reads as
        // past tense rather than as a live holding.
        valueMeta={isSold ? t('options.assetStatus.sold') : undefined}
        valueTone={isSold ? 'muted' : freshness.stale ? 'attention' : 'default'}
        onPress={() => onOpen(asset.id)}
      />
    )
  }

  return (
    <Panel>
      <PanelHeader title={t('assets.demo.sources')} />

      <Field
        className="mt-4"
        value={query}
        onChangeText={onQueryChange}
        placeholder={t('assets.demo.search')}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {/* Four short options, all visible: a sheet that opens to reveal them
          would cost a tap and hide the alternatives. */}
      <Segmented
        className="mt-3"
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

      {isLoading ? (
        <View className="mt-4 gap-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} height={52} />
          ))}
        </View>
      ) : assets.length === 0 ? (
        // Every group empty means the search or the filter matched nothing —
        // three empty cards would say that three times over, so say it once.
        isFiltered ? (
          <EmptyState className="mt-4" message={t('assets.toolbar.empty')} />
        ) : (
          <EmptyState
            className="mt-4"
            message={t('assets.toolbar.noneYet')}
            action={t('assets.demo.addSource')}
            onAction={onAdd}
          />
        )
      ) : (
        <View className="mt-5 gap-6">
          {groups.map(({ liquidity, items, subtotal }) => {
            /* The one case where dropping the group is still right: the reader
               narrowed to a single one on purpose, so the other two are not an
               absence worth reporting — they are the filter working. */
            if (liquidityFilter !== 'all' && liquidityFilter !== liquidity) return null

            return (
              <View key={liquidity}>
                <View className="flex-row items-baseline justify-between gap-3">
                  <Text className="t-subtitle text-ink">
                    {t(`options.liquidity.${liquidity}`)}
                  </Text>
                  <Text className="t-caption text-ink3">
                    {t('assets.demo.sourceCount', { count: items.length })}
                  </Text>
                </View>

                {/* The subtotal answers "how much can I reach" before a single
                    row is read. A truthful 0đ for an empty group. */}
                <Text
                  className="mt-2 t-figure text-ink"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatVndShort(subtotal)}
                </Text>
                <Text className="mt-1 t-caption text-ink3">
                  {t('assets.strip.share', {
                    value: total > 0 ? Math.round((subtotal / total) * 100) : 0,
                  })}
                </Text>

                {items.length === 0 ? (
                  /* The group stays in place rather than being dropped, so the
                     three are always in the same order and the reader learns
                     "nothing here" instead of having to notice one is missing. */
                  <EmptyState
                    className="mt-3"
                    message={
                      isFiltered
                        ? t('assets.toolbar.groupEmpty')
                        : t('assets.toolbar.groupNoneYet')
                    }
                  />
                ) : (
                  <View className="mt-2">{items.map(renderAsset)}</View>
                )}
              </View>
            )
          })}
        </View>
      )}
    </Panel>
  )
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
