import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { liquidityOrder } from '@money-space/core/features/assets/model/assets'
import type { AssetTotals } from '@money-space/core/features/assets/model/assets-form'
import { formatVndScale, formatVndShort } from '@money-space/core/shared/lib/format-money'

import { GroupedRow, Label, Money, Panel, PanelHeader, RowMetaMono, Sunk } from '@/components/ui'
import { liquidityColors } from '@/theme/tokens'

/**
 * Net worth, and what the assets side of it is made of.
 *
 * ONE strip for both tabs (the web made the same call): net worth is the reason
 * the two halves share a route, so it must not flicker when the tab changes.
 *
 * **No pie chart here, deliberately.** The web draws the three liquidity
 * buckets as a donut. Three slices on a 375pt screen answer nothing the labelled
 * rows below do not — v4.2 §9 renders a chart only when it beats a list, and
 * the reading task here ("how much is usable now") is a lookup, not a shape.
 * The weight bar keeps the one thing the donut did add: the proportions, at a
 * glance. Encoded by weight, not hue (§5.4) — amber stays reserved for
 * attention.
 */
export function AssetsSummary({
  totals,
  total,
  assetCount,
  totalDebt,
  debtCount,
  asOf,
}: {
  totals: AssetTotals
  total: number
  assetCount: number
  /** From the debts tab, which another screen owns. 0 until it lands. */
  totalDebt: number
  debtCount: number
  asOf: string
}) {
  const { t } = useTranslation()

  const netWorth = total - totalDebt
  const bucketTotal = liquidityOrder.reduce((sum, bucket) => sum + Math.max(totals[bucket], 0), 0)

  return (
    <Panel>
      {/* One thing beside the title (§2.1): the scope date, not an action —
          the screen header already carries the action. */}
      <PanelHeader title={t('assets.demo.overview')} right={<RowMetaMono>{displayDate(asOf)}</RowMetaMono>} />

      {/* Net worth is the section's anchor, so it sits above the strip rather
          than being one tile styled larger inside it. */}
      <View className="mt-6">
        <Label>{t('assets.demo.netWorth')}</Label>
        {/* Money can be NEGATIVE and is never clamped — a household that owes
            more than it holds is exactly who needs to see the real figure. */}
        <Money className="mt-1.5" size={34}>
          {formatVndScale(netWorth)}
        </Money>
        <RowMetaMono>{t('assets.demo.netWorthNote')}</RowMetaMono>
      </View>

      <View className="mt-5 flex-row gap-2">
        <Sunk className="flex-1 p-3.5">
          <Label>{t('assets.demo.assets')}</Label>
          <Money className="mt-1" size={18}>
            {formatVndScale(total)}
          </Money>
          <RowMetaMono>{t('assets.demo.assetCount', { count: assetCount })}</RowMetaMono>
        </Sunk>
        <Sunk className="flex-1 p-3.5">
          <Label>{t('assets.demo.debt')}</Label>
          <Money className="mt-1" size={18}>
            {formatVndScale(totalDebt)}
          </Money>
          <RowMetaMono>{t('assets.demo.debtCount', { count: debtCount })}</RowMetaMono>
        </Sunk>
      </View>

      {/* The composition, when there is anything to compose. A bar of one
          segment says nothing, and a bar of nothing is not an honest zero — it
          is "no data yet", which the list's own empty state already covers. */}
      {bucketTotal > 0 ? (
        <View className="mt-5">
          <View
            className="h-2.5 flex-row overflow-hidden rounded-full"
            accessibilityRole="image"
            accessibilityLabel={liquidityOrder
              .map(
                (bucket) =>
                  `${t(`options.liquidity.${bucket}`)}: ${formatVndShort(totals[bucket])}`,
              )
              .join(', ')}
          >
            {liquidityOrder.map((bucket) => {
              const share = Math.max(totals[bucket], 0) / bucketTotal
              if (share <= 0) return null
              return (
                <View
                  key={bucket}
                  style={{ flex: share, backgroundColor: liquidityColors[bucket] }}
                />
              )
            })}
          </View>

          <View className="mt-2">
            {liquidityOrder.map((bucket) => (
              <GroupedRow
                key={bucket}
                title={t(`options.liquidity.${bucket}`)}
                value={formatVndShort(totals[bucket])}
                valueTone={bucket === 'usable_now' ? 'default' : 'muted'}
                right={
                  <View
                    className="ml-2 h-2 w-2 rounded-full"
                    style={{ backgroundColor: liquidityColors[bucket] }}
                  />
                }
              />
            ))}
          </View>
        </View>
      ) : null}
    </Panel>
  )
}

/** `23/08/2026` — ASCII, so `RowMetaMono` is safe. */
function displayDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}
