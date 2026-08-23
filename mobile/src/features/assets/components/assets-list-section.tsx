import { View } from 'react-native'
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
 * The household's money sources.
 *
 * The web renders these as a six-column table that scrolls sideways below
 * 840px. On a phone that table becomes grouped rows (§8): the columns a table
 * would give — owner, liquidity, freshness — fold into one metadata line under
 * the name, and the amount keeps the right edge where a column of them still
 * lines up. Nothing scrolls horizontally, and money never truncates.
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
  query: string
  onQueryChange: (value: string) => void
  liquidityFilter: AssetLiquidity | 'all'
  onLiquidityFilterChange: (value: AssetLiquidity | 'all') => void
  onOpen: (assetId: string) => void
  onAdd: () => void
}) {
  const { t } = useTranslation()
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))
  const isFiltered = query.trim().length > 0 || liquidityFilter !== 'all'

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
      ) : assets.length > 0 ? (
        <View className="mt-2">
          {assets.map((asset) => {
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
                // Vietnamese, so the sans face — mono must never touch
                // diacritics (§5, hard constraint), and every part of this line
                // (type, holder, liquidity, freshness) is accented Vietnamese.
                meta={
                  <RowMeta>
                    {[
                      t(`options.assetType.${asset.type}`),
                      holder,
                      t(`options.liquidity.${asset.liquidity}`),
                      freshness.label,
                    ].join(' · ')}
                  </RowMeta>
                }
                // `formatVndShort`, not `formatVndCell`: the cell formatter
                // drops the unit on the promise that a column header carries
                // it, and grouped rows have no header to carry it.
                //
                // Never `0đ` for "no price yet" — they are different facts.
                value={value === null ? t('assets.list.priceUnavailable') : formatVndShort(value)}
                // A sold asset is kept for history, so it stays in the list but
                // reads as past tense rather than as a live holding.
                valueMeta={isSold ? t('options.assetStatus.sold') : undefined}
                valueTone={isSold ? 'muted' : freshness.stale ? 'attention' : 'default'}
                onPress={() => onOpen(asset.id)}
              />
            )
          })}
        </View>
      ) : isFiltered ? (
        // "Nothing matched" and "nothing recorded" are different facts, and
        // offering "add a source" to someone whose filter simply excluded
        // everything answers a question they did not ask.
        <EmptyState className="mt-4" message={t('assets.toolbar.empty')} />
      ) : (
        <EmptyState
          className="mt-4"
          message={t('assets.toolbar.noneYet')}
          action={t('assets.demo.addSource')}
          onAction={onAdd}
        />
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
