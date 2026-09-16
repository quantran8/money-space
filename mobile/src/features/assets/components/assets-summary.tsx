import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { PieChartPro } from 'react-native-gifted-charts'

import {
  isPreviousDayOf,
  liquidityOrder,
  toneForValueChange,
} from '@money-space/core/features/assets/model/assets'
import type { AssetTotals } from '@money-space/core/features/assets/model/assets-form'
import type { AssetValueChangeTotal } from '@money-space/core/features/assets/model/assets.types'
import {
  formatPercentSigned,
  formatVndScale,
  formatVndShort,
} from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { GroupedRow, Money, Panel, PanelHeader, RowMetaMono } from '@/components/ui'
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
  totalDebt,
  asOf,
  valueChange = null,
}: {
  totals: AssetTotals
  total: number
  /** From the debts tab, which another screen owns. 0 until it lands. */
  totalDebt: number
  asOf: string
  /** Assets tab only: a market move says nothing about the debts half. */
  valueChange?: AssetValueChangeTotal | null
}) {
  const { t } = useTranslation()

  const netWorth = total - totalDebt
  // Scale, not exact: this sits beside the hero and is never reconciled here.
  const dayChangeText = valueChange
    ? `${valueChange.delta > 0 ? '+' : valueChange.delta < 0 ? '−' : ''}${formatVndScale(Math.abs(valueChange.delta))}${
        valueChange.deltaPercent === null
          ? ''
          : ` · ${formatPercentSigned(valueChange.deltaPercent)}`
      }`
    : ''
  // Two-sided colouring — see memory/asset-valuation.md.
  const dayChangeToneClass = valueChange
    ? {
        positive: 'text-positive-ink',
        alert: 'text-alert-ink',
        default: 'text-ink3',
      }[toneForValueChange(valueChange.delta)]
    : 'text-ink3'
  const bucketTotal = liquidityOrder.reduce((sum, bucket) => sum + Math.max(totals[bucket], 0), 0)

  return (
    <Panel>
      {/* One thing beside the title (§2.1): the scope date, not an action —
          the screen header already carries the action. */}
      <PanelHeader
        title={t('assets.demo.netWorth')}
        right={<RowMetaMono>{displayDate(asOf)}</RowMetaMono>}
      />

      {/* Money can be NEGATIVE and is never clamped — a household that owes
          more than it holds is exactly who needs to see the real figure. */}
      <Money className="mt-6" step="hero">
        {formatVndScale(netWorth)}
      </Money>

      {/* The two operands, stated once and small: they explain the figure above
          without competing with it. Tiles gave them a weight that made the page
          read as three figures instead of one answer. */}
      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className="t-caption text-ink3">
          {t('assets.demo.totalAssets', { value: formatVndScale(total) })}
        </Text>
        <Text className="t-caption text-ink3">
          {t('assets.demo.totalDebt', { value: formatVndScale(totalDebt) })}
        </Text>
        {valueChange ? (
          <Text className={cn('t-caption', dayChangeToneClass)}>
            {isPreviousDayOf(valueChange.previousDate ?? '', asOf)
              ? t('assets.summary.dayChange', { value: dayChangeText })
              : t('assets.summary.changeSince', {
                  date: displayDate(valueChange.previousDate ?? ''),
                  value: dayChangeText,
                })}
            {/* The total covers only the holdings that had a baseline. */}
            {valueChange.missingCount > 0
              ? ` ${t('assets.summary.dayChangePartial', { count: valueChange.missingCount })}`
              : ''}
          </Text>
        ) : null}
      </View>

      {/* The composition, when there is anything to compose. A ring of one
          segment says nothing, and a ring of nothing is not an honest zero — it
          is "no data yet", which the list's own empty state already covers. */}
      {bucketTotal > 0 ? (
        <View className="mt-7">
          <Text className="t-subtitle text-ink">{t('assets.demo.byLiquidity')}</Text>

          <View
            className="mt-5 items-center"
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
          <View className="mt-6">
            {liquidityOrder.map((bucket) => (
              <GroupedRow
                key={bucket}
                title={t(`options.liquidity.${bucket}`)}
                // The swatch LEADS the row, as on the web: it is the key to the
                // ring above, so it sits where the eye enters the line.
                leading={
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: liquidityColors[bucket] }}
                  />
                }
                value={formatVndShort(totals[bucket])}
                // The share the ring draws, in words — a proportion read off an
                // arc is an estimate, and this is the figure behind it.
                right={
                  <Text
                    className="w-10 text-right t-caption text-ink3"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {bucketTotal > 0
                      ? Math.round((Math.max(totals[bucket], 0) / bucketTotal) * 100)
                      : 0}
                    %
                  </Text>
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
