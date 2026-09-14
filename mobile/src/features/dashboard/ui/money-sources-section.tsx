import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type {
  HolderGroup,
  MoneyLocationMap,
} from '@money-space/core/features/dashboard/model/home-derivations'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

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

/** Row pitch and bar thickness for the horizontal bars. */
const BAR_HEIGHT = 22
const BAR_GAP = 18
/** The lane holding the source names, and the lane the amounts sit in. */
const NAME_WIDTH = 96
const VALUE_WIDTH = 72
/** A source too small to draw still gets a visible stub: seeing that it is
 *  nearly nothing is the point, seeing nothing is a bug. */
const MIN_BAR = 3

/**
 * One tone per holder, cycled. The disc is a low-alpha FILL and the figure
 * takes the `*-ink` counterpart, which is what a reader has to read (§5.2).
 */
const HOLDER_TONE = [
  { disc: 'rgba(115, 164, 215, 0.14)', ink: colors.dataInk },
  { disc: 'rgba(143, 205, 164, 0.20)', ink: colors.positiveInk },
  { disc: 'rgba(225, 190, 104, 0.16)', ink: colors.attentionInk },
] as const

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
  holderGroups = [],
  onViewAll,
}: {
  map: MoneyLocationMap
  /** The same money grouped by who is responsible for it. */
  holderGroups?: HolderGroup[]
  onViewAll: () => void
}) {
  const { t } = useTranslation()
  const [chartWidth, setChartWidth] = useState(0)

  // The shared scale. Every bar is a share of the largest, so lengths compare.
  const largest = map.bars.reduce((max, bar) => Math.max(max, bar.value), 0)

  // The bars get what is left once the name and amount lanes are taken. The
  // longest bar must still leave its own figure room to be written.
  const plotWidth = Math.max(chartWidth - NAME_WIDTH - VALUE_WIDTH, 1)

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

          <View className="mt-7 flex-row items-center gap-2">
            <MaterialCommunityIcons name="chart-bar" size={16} color={colors.dataPrimary} />
            <Text className="t-subtitle text-ink">{t('home.location.barsTitle')}</Text>
          </View>

          {/* Laid out as rows, not as a rotated chart: gifted-charts places a
              `horizontal` chart's names and an overlay in two different
              coordinate systems, which shifted every amount by a row. */}
          <View
            className="mt-3"
            onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
            accessibilityRole="image"
            // §9: the chart owes a full reading to anyone who cannot see it —
            // the names and amounts the rows carry live here too.
            accessibilityLabel={map.bars
              .map(
                (bar) =>
                  `${bar.name}${bar.holder ? `, ${bar.holder}` : ''}, ${formatVndScale(bar.value)}`,
              )
              .join('. ')}
          >
            {map.bars.map((bar, index) => (
              <View
                key={bar.id}
                // The container already reads every name and amount (§9).
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                className="flex-row items-center"
                style={{ marginTop: index === 0 ? 0 : BAR_GAP }}
              >
                <Text
                  className="t-caption text-ink2"
                  numberOfLines={1}
                  style={{ width: NAME_WIDTH, paddingRight: 8 }}
                >
                  {bar.name}
                </Text>
                <View
                  style={{
                    // Until the panel is measured every bar would draw at the
                    // stub width, so nothing is drawn rather than a false rank.
                    width:
                      chartWidth === 0
                        ? 0
                        : Math.max(
                            plotWidth * (largest > 0 ? bar.value / largest : 0),
                            MIN_BAR,
                          ),
                    height: BAR_HEIGHT,
                    borderRadius: 5,
                    backgroundColor: fillForRank(index),
                  }}
                />
                <Text
                  className="t-caption text-ink"
                  numberOfLines={1}
                  style={{ paddingLeft: 8, fontVariant: ['tabular-nums'] }}
                >
                  {formatVndScale(bar.value)}
                </Text>
              </View>
            ))}
          </View>

          {map.hiddenCount > 0 ? (
            <Text className="mt-4 t-caption leading-5 text-ink3">
              {t('home.location.hidden', { count: map.hiddenCount })}
            </Text>
          ) : null}

          {holderGroups.length > 0 ? <HolderColumn groups={holderGroups} /> : null}
        </>
      )}
    </Panel>
  )
}

/**
 * The same money read a second way — by WHO IS RESPONSIBLE for it (§0.2,
 * §16.4). Responsibility, never "who spent it".
 *
 * The first group is open; the rest are a tap away. A household of two has two
 * rows, so opening all of them would spend the panel on a list it already
 * summarised above.
 */
function HolderColumn({ groups }: { groups: HolderGroup[] }) {
  const { t } = useTranslation()
  const [openKey, setOpenKey] = useState<string | null>(groups[0]?.key ?? null)

  return (
    <View className="mt-7">
      <View className="mb-4 flex-row items-center gap-2">
        <MaterialCommunityIcons name="account-group" size={16} color={colors.dataPrimary} />
        <Text className="t-subtitle text-ink">{t('home.location.holderTitle')}</Text>
      </View>

      {groups.map((group, index) => {
        const tone = HOLDER_TONE[index % HOLDER_TONE.length]!
        const isOpen = openKey === group.key

        return (
          <View key={group.key} className={cn(index > 0 && 'border-t border-divider')}>
            <Pressable
              onPress={() => setOpenKey(isOpen ? null : group.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={{ minHeight: TOUCH_TARGET }}
              className="flex-row items-center gap-3 py-3.5 active:opacity-70"
            >
              <View
                accessible={false}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: tone.disc,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name={group.key === 'shared' ? 'account-multiple' : 'account'}
                  size={16}
                  color={tone.ink}
                />
              </View>

              <View className="min-w-0 flex-1 flex-row items-baseline gap-2">
                <Text className="shrink t-body-sm font-medium text-ink" numberOfLines={1}>
                  {group.name}
                </Text>
                <Text className="t-caption text-ink2">
                  {t('home.coverage.sourceCount', { count: group.sources.length })}
                </Text>
              </View>

              <Text
                className="t-subhead font-medium"
                style={{ color: tone.ink, fontVariant: ['tabular-nums'] }}
              >
                {formatVndScale(group.value)}
              </Text>
              <MaterialCommunityIcons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.ink2}
              />
            </Pressable>

            {isOpen ? (
              <View className="pb-3 pl-12">
                {group.sources.map((source) => (
                  <View key={source.id} className="flex-row items-center gap-4 py-2">
                    <Text className="min-w-0 flex-1 t-body-sm text-ink" numberOfLines={1}>
                      {source.name}
                    </Text>
                    <Text
                      className="t-body-sm font-medium text-ink"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {formatVndScale(source.value)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}
