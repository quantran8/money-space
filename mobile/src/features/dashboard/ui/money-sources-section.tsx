import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BarChart } from 'react-native-gifted-charts'

import type { MoneyLocationMap } from '@money-space/core/features/dashboard/model/home-derivations'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

import { EmptyState, Label, Money, Panel, PanelHeader } from '@/components/ui'
import { colors, TOUCH_TARGET } from '@/theme/tokens'

/**
 * One fill per bar, deepest first, stepping down by RANK.
 *
 * Weight, not hue (§5.4): the largest source is deepest and each one below
 * recedes a step, so the eye lands on the concentration before it reads a
 * figure. Amber stays reserved for `attention`. Past the ramp's length every
 * remaining bar sits at the palest step — by then rank is legible from length.
 *
 * The ramp is the DATA family, never `action`: v5 §4 split interaction from
 * data, and a bar is drawn with `data-primary`, not with the colour of a thing
 * you press.
 */
const RANK_FILL = [colors.dataInk, colors.dataPrimary, colors.protect, colors.committed]

const fillForRank = (index: number): string =>
  RANK_FILL[Math.min(index, RANK_FILL.length - 1)]

/** Row pitch and bar thickness for the horizontal chart. */
const BAR_HEIGHT = 22
const BAR_GAP = 18

/**
 * Home section 4 — Tiền đang ở đâu (§12.4).
 *
 * Ranked horizontal bars: one long bar beside a row of stubs says "nearly
 * everything is in one account" before a figure is read.
 *
 * Sources rank by value alone, with no liquidity split — the question is where
 * the money SITS, and one ordering answers it. The holder is no longer shown
 * per bar; it survives in the chart's accessibility reading.
 */
export function MoneySourcesSection({
  map,
  onViewAll,
}: {
  map: MoneyLocationMap
  onViewAll: () => void
}) {
  const { t } = useTranslation()

  // The shared scale. Every bar is a share of the largest, so lengths compare.
  const largest = map.bars.reduce((max, bar) => Math.max(max, bar.value), 0)

  return (
    <Panel>
      <PanelHeader
        title={t('home.location.title')}
        right={
          map.totalCount > 0 ? (
            <Pressable
              onPress={onViewAll}
              accessibilityRole="button"
              style={{ minHeight: TOUCH_TARGET }}
              className="justify-center active:opacity-70"
            >
              <Text className="t-body-sm font-medium text-action">
                {t('home.location.viewAll', { count: map.totalCount })}
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {map.totalCount === 0 ? (
        <EmptyState className="mt-5" message={t('home.moneyLocation.empty')} />
      ) : (
        <>
          {/* The total sits above the bars, not inside them: a length is read
              as a proportion and the household still needs the figure. */}
          <View className="mt-5">
            <Label>{t('home.location.totalValue')}</Label>
            <Money className="mt-1.5" step="metric">
              {formatVndScale(map.total)}
            </Money>
          </View>

          <View
            className="mt-5"
            accessibilityRole="image"
            // §9: the chart owes a full reading to anyone who cannot see it —
            // the names and amounts the rows used to carry live here now.
            accessibilityLabel={map.bars
              .map(
                (bar) =>
                  `${bar.name}${bar.holder ? `, ${bar.holder}` : ''}, ${formatVndScale(bar.value)}`,
              )
              .join('. ')}
          >
            <BarChart
              horizontal
              data={map.bars.map((bar, index) => ({
                value: bar.value,
                label: bar.name,
                frontColor: fillForRank(index),
              }))}
              // A source too small to draw still gets a visible stub: seeing
              // that it is nearly nothing is the point, seeing nothing is a bug.
              minHeight={3}
              maxValue={largest > 0 ? largest : 1}
              barWidth={BAR_HEIGHT}
              spacing={BAR_GAP}
              initialSpacing={4}
              barBorderRadius={5}
              // The names sit in the axis lane; the amounts follow each bar.
              yAxisLabelWidth={104}
              yAxisTextStyle={{ color: colors.ink2, fontSize: 12 }}
              yAxisThickness={0}
              xAxisThickness={0}
              // The x-axis SCALE is dropped — 335pt gives about four tick
              // labels before they collide, and every bar states its own
              // amount. `hideAxesAndRules` is NOT used: it would take the
              // source names with it.
              hideRules
              hideYAxisText={false}
              showValuesAsTopLabel
              topLabelTextStyle={{ color: colors.ink, fontSize: 12 }}
              isAnimated={false}
              disableScroll
            />
          </View>

          {map.hiddenCount > 0 ? (
            <Text className="mt-4 t-caption leading-5 text-ink3">
              {t('home.location.hidden', { count: map.hiddenCount })}
            </Text>
          ) : null}
        </>
      )}
    </Panel>
  )
}
