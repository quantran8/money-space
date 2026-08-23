import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type {
  MoneyLocationBar,
  MoneyLocationMap,
} from '@money-space/core/features/dashboard/model/home-derivations'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

import { EmptyState, Label, Money, Panel, PanelHeader } from '@/components/ui'
import { colors, TOUCH_TARGET } from '@/theme/tokens'

/**
 * One fill per bar, darkest first, stepping down the neutral ramp by RANK.
 *
 * Weight, not hue (§5.4): the largest source carries the interactive colour and
 * each one below recedes a step, so the eye lands on the concentration before
 * it reads a single figure. Amber stays reserved for `attention`. Past the
 * ramp's length every remaining bar sits at the palest step — by then the rank
 * is legible from length alone.
 */
const RANK_FILL = [colors.interactive, colors.ink2, colors.protect, colors.committed]

const fillForRank = (index: number): string =>
  RANK_FILL[Math.min(index, RANK_FILL.length - 1)]

/**
 * Home section 4 — Tiền đang ở đâu (§12.4).
 *
 * Ranked horizontal bars. Bar length carries the same proportional reading an
 * area map would, so CONCENTRATION reads at a glance — one long bar and a row
 * of stubs says "nearly everything is in one account" without a number being
 * read. What the bars add is that every source keeps a full row: a source
 * holding 0,03% still has its name and its amount at full size, which is
 * exactly what an area map cannot label.
 *
 * The web draws this with recharts and a real x-axis. On a phone the axis is
 * dropped: 335pt of width gives about four tick labels before they collide, and
 * each bar already states its own amount on its own row. What the axis was
 * for — comparing lengths as quantities — survives in the shared scale, since
 * every bar is drawn against the same largest value.
 *
 * Sources rank by value alone, with no liquidity split: the question here is
 * where the money SITS, and one continuous ranking answers it without asking
 * the reader to hold two orderings at once. Which sources count as usable is
 * stated in §12.1, where the figure that depends on it lives.
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
              <Text className="text-[13px] font-medium text-interactive">
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
            <Money className="mt-1.5" size={28}>
              {formatVndScale(map.total)}
            </Money>
          </View>

          <View className="mt-5 gap-3.5">
            {map.bars.map((bar, index) => (
              <SourceBar
                key={bar.id}
                bar={bar}
                fill={fillForRank(index)}
                share={largest > 0 ? bar.value / largest : 0}
              />
            ))}
          </View>

          {map.hiddenCount > 0 ? (
            <Text className="mt-4 text-[12px] leading-5 text-ink3">
              {t('home.location.hidden', { count: map.hiddenCount })}
            </Text>
          ) : null}
        </>
      )}
    </Panel>
  )
}

/**
 * One source: its name and who is responsible for it, its amount, and the bar.
 *
 * The name and the amount share a row and the bar sits under both, rather than
 * the web's name-lane / bar / value-lane triple. Three lanes across 335pt gives
 * the bar itself about 120pt, at which point the proportional reading the
 * section exists for is gone — and money in a 68pt lane truncates (§6).
 *
 * The holder is who is RESPONSIBLE for a source, never who spent from it
 * (§0.2, §16.4), and it stays visibly secondary — that is what keeps this a
 * shared picture rather than an attribution.
 */
function SourceBar({
  bar,
  fill,
  share,
}: {
  bar: MoneyLocationBar
  fill: string
  share: number
}) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${bar.name}${bar.holder ? `, ${bar.holder}` : ''}, ${formatVndScale(bar.value)}`}
    >
      <View className="flex-row items-baseline gap-3">
        <View className="flex-1">
          <Text className="text-[13px] text-ink" numberOfLines={1}>
            {bar.name}
          </Text>
          {bar.holder ? (
            <Text className="mt-0.5 text-[11px] text-ink3" numberOfLines={1}>
              {bar.holder}
            </Text>
          ) : null}
        </View>

        <Text
          className="text-[13px] font-medium text-ink"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatVndScale(bar.value)}
        </Text>
      </View>

      <View
        className="mt-1.5 overflow-hidden rounded-full"
        style={{ height: 6, backgroundColor: colors.sunk }}
      >
        <View
          style={{
            height: 6,
            // A source too small to draw still gets a visible stub: seeing that
            // it is nearly nothing is the point, seeing nothing at all is a bug.
            width: `${Math.max(share * 100, 1.5)}%`,
            borderRadius: 6,
            backgroundColor: fill,
          }}
        />
      </View>
    </View>
  )
}
