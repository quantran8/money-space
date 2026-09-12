import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { PieChartPro } from 'react-native-gifted-charts'

import { liquidityOrder } from '@money-space/core/features/assets/model/assets'
import type { AssetTotals } from '@money-space/core/features/assets/model/assets-form'
import { formatVndScale, formatVndShort } from '@money-space/core/shared/lib/format-money'

import { GroupedRow, Label, Money, Panel, PanelHeader, RowMetaMono, Sunk } from '@/components/ui'
import { liquidityColors } from '@/theme/tokens'

const RING_RADIUS = 78
const RING_INNER_RADIUS = 54

/**
 * Net worth, and what the assets side of it is made of.
 *
 * ONE strip for both tabs (the web made the same call): net worth is the reason
 * the two halves share a route, so it must not flicker when the tab changes.
 *
 * The three liquidity buckets draw as a donut, matching the web. The labelled
 * rows below it STAY: the reading task here ("how much is usable now") is a
 * lookup, which a figure answers and an arc does not, so the ring adds the
 * proportion rather than replacing the numbers.
 *
 * Encoded by weight within one hue, not by three competing hues (§5.4) —
 * `liquidityColors` is an ordinal azure ramp, and amber stays reserved for
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
        <Money className="mt-1.5" step="metric">
          {formatVndScale(netWorth)}
        </Money>
        <RowMetaMono>{t('assets.demo.netWorthNote')}</RowMetaMono>
      </View>

      <View className="mt-5 flex-row gap-2">
        <Sunk className="flex-1 p-3.5">
          <Label>{t('assets.demo.assets')}</Label>
          <Money className="mt-1" step="subtitle">
            {formatVndScale(total)}
          </Money>
          <RowMetaMono>{t('assets.demo.assetCount', { count: assetCount })}</RowMetaMono>
        </Sunk>
        <Sunk className="flex-1 p-3.5">
          <Label>{t('assets.demo.debt')}</Label>
          <Money className="mt-1" step="subtitle">
            {formatVndScale(totalDebt)}
          </Money>
          <RowMetaMono>{t('assets.demo.debtCount', { count: debtCount })}</RowMetaMono>
        </Sunk>
      </View>

      {/* The composition, when there is anything to compose. A ring of one
          segment says nothing, and a ring of nothing is not an honest zero — it
          is "no data yet", which the list's own empty state already covers. */}
      {bucketTotal > 0 ? (
        <View className="mt-5">
          <View
            className="items-center"
            accessibilityRole="image"
            accessibilityLabel={liquidityOrder
              .map(
                (bucket) =>
                  `${t(`options.liquidity.${bucket}`)}: ${formatVndShort(totals[bucket])}`,
              )
              .join(', ')}
          >
            {/* NO curved edges. `edgesRadius` / `curvedStartEdges` render each
                cap as a separate filled Path prefixed with the library's
                `initial` variable — which `getDonutPath` overwrites while
                mapping, so by the time the caps draw it holds a leftover
                segment's coordinates. Every cap is then filled against a stray
                line and paints over its neighbours (the overlapping nubs). */}
            <PieChartPro
              data={liquidityOrder
                .filter((bucket) => Math.max(totals[bucket], 0) > 0)
                .map((bucket) => ({
                  value: Math.max(totals[bucket], 0),
                  color: liquidityColors[bucket],
                }))}
              donut
              radius={RING_RADIUS}
              innerRadius={RING_INNER_RADIUS}
              isAnimated={false}
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="t-caption text-ink3">{t('assets.summary.total')}</Text>
                  <Text
                    className="mt-1 t-subhead font-medium text-ink"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatVndShort(bucketTotal)}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* The rows stay: liquidity is a LOOKUP ("how much is usable now"),
              and identity is never colour-alone (§24). The ring adds the
              proportion; it does not replace the figures. */}
          <View className="mt-4">
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
