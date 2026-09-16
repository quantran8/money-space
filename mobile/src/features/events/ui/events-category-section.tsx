import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { PieChartPro } from 'react-native-gifted-charts'

import type {
  CategoryBreakdown,
  MemberBreakdownRow,
} from '@money-space/core/features/events/model/events-form'
import { formatVndScale, formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { Panel, PanelHeader, Segmented, Skeleton } from '@/components/ui'
import { CategoryDisc } from '@/features/events/ui/components/category-disc'
import { colors } from '@/theme/tokens'

/**
 * Arcs the ring draws before the rest collapse into one "+N nhóm khác" segment.
 * Matches the web — a ring cut into twelve is a colour wheel, not a reading.
 */
const VISIBLE_SLICES = 5

/** The collapsed tail's fill, so "everything else" never out-weighs a real category. */
const REST_COLOR = colors.ink3

const RADIUS = 86
const INNER_RADIUS = 58

type Direction = 'outflow' | 'inflow'

type Segment = {
  key: string
  label: string
  color: string
  total: number
  share: number
  iconKey: string | null
  isRest: boolean
}

/**
 * What the month's money was made of, by category.
 *
 * COMPOSITION, not a verdict — it states that spending was 42% sinh hoạt and
 * stops there (§0.2, §16.4). It reads the WHOLE month on purpose, so it does
 * not follow the timeline's person/type filters below; the header says "Cả
 * tháng" rather than leaving the reader to infer the scope.
 *
 * Direction is a toggle rather than two rings: side by side the smaller one
 * reads as an afterthought padding the card.
 *
 * The phone keeps the ring the web draws — unlike the liquidity donut's three
 * fixed buckets, categories are unbounded and the reading task here genuinely
 * is a share ("what was this month mostly"), which a column of figures answers
 * slowly. The web's member-totals block is NOT ported: it is four figures that
 * belong with the summary panel, not with a composition.
 */
export function EventsCategorySection({
  spending,
  income,
  isLoading = false,
}: {
  spending: CategoryBreakdown
  income: CategoryBreakdown
  /** Kept for parity with the web's props; the phone renders totals elsewhere. */
  byMember?: MemberBreakdownRow[]
  isLoading?: boolean
}) {
  const { t } = useTranslation()
  const [direction, setDirection] = useState<Direction>('outflow')
  const breakdown = direction === 'outflow' ? spending : income

  return (
    <Panel>
      {/* "Cả tháng" is not decoration: this block ignores the timeline's
          person/type filters, and an unstated scope makes two readings of
          different populations look like one. */}
      <PanelHeader
        title={t('events.byCategory.title')}
        right={<Text className="t-caption text-ink3">{t('events.byCategory.meta')}</Text>}
      />

      {/* Both directions stay offered even when one is empty — a control that
          disappears reads as a rendering fault. */}
      <Segmented
        className="mt-5"
        value={direction}
        onChange={setDirection}
        label={t('events.byCategory.title')}
        options={[
          { value: 'outflow', label: t('events.byCategory.outflow') },
          { value: 'inflow', label: t('events.byCategory.inflow') },
        ]}
      />

      {isLoading ? (
        <View className="mt-6 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-control" />
          ))}
        </View>
      ) : (
        <CategoryComposition breakdown={breakdown} />
      )}
    </Panel>
  )
}

function CategoryComposition({ breakdown }: { breakdown: CategoryBreakdown }) {
  const { t } = useTranslation()

  // The ring and the legend read the SAME array, so a segment can never appear
  // in one and not the other.
  const segments = useMemo<Segment[]>(() => {
    const visible: Segment[] = breakdown.slices.slice(0, VISIBLE_SLICES).map((slice) => ({
      key: slice.categoryId,
      label: slice.label,
      color: slice.color ?? colors.dataPrimary,
      total: slice.total,
      share: slice.share,
      iconKey: slice.iconKey,
      isRest: false,
    }))

    const rest = breakdown.slices.slice(VISIBLE_SLICES)
    if (rest.length === 0) return visible

    // Summed, not dropped: the arcs and the rows must add up to the total
    // stated beside them.
    const restTotal = rest.reduce((sum, slice) => sum + slice.total, 0)
    return [
      ...visible,
      {
        key: '__rest__',
        label: t('events.byCategory.others', { count: rest.length }),
        color: REST_COLOR,
        total: restTotal,
        share: breakdown.total > 0 ? restTotal / breakdown.total : 0,
        iconKey: null,
        isRest: true,
      },
    ]
  }, [breakdown, t])

  if (segments.length === 0) {
    return (
      <Text className="mt-6 t-body-sm text-ink2">
        {breakdown.direction === 'outflow'
          ? t('events.byCategory.emptyOutflow')
          : t('events.byCategory.emptyInflow')}
      </Text>
    )
  }

  /* A zero-value segment still renders its rounded caps, so it would appear as
     a stray nub holding open a gap of its own. It stays in the legend — a
     household reading "0" learns something — but not in the arc. */
  const arcSegments = segments.filter((segment) => segment.total > 0)

  const ariaLabel = segments
    .map((segment) =>
      t('events.byCategory.share', { percent: Math.round(segment.share * 100) }) +
      ` ${segment.label} ${formatVndShort(segment.total)}`,
    )
    .join(', ')

  return (
    <View className="mt-6">
      <View accessibilityRole="image" accessibilityLabel={ariaLabel} className="items-center">
        {/* NO curved edges. `edgesRadius` / `curvedStartEdges` render each cap
            as a separate filled Path prefixed with the library's `initial`
            variable — which `getDonutPath` overwrites while mapping, so by the
            time the caps draw it holds a leftover segment's coordinates. Every
            cap is then filled against a stray line and paints over its
            neighbours. Square joins are the honest render here. */}
        <PieChartPro
          data={arcSegments.map((segment) => ({
            value: segment.total,
            color: segment.color,
          }))}
          donut
          radius={RADIUS}
          innerRadius={INNER_RADIUS}
          // `initialAngle` 0 already starts at 12 o'clock sweeping clockwise,
          // where a reader expects a composition to begin.
          isAnimated={false}
          // No tooltip: the legend below already states every label, amount and
          // share, and inside this ring it would land on the centre total.
          centerLabelComponent={() => (
            <View className="items-center">
              <Text className="t-caption text-ink3">{t('events.byCategory.total')}</Text>
              <Text
                className="mt-1 t-subhead font-medium text-ink"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatVndScale(breakdown.total)}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Legend + direct labels: identity is never colour-alone (§24). */}
      <View className="mt-6">
        {segments.map((segment, index) => (
          <LegendRow key={segment.key} segment={segment} isFirst={index === 0} />
        ))}
      </View>
    </View>
  )
}

function LegendRow({ segment, isFirst }: { segment: Segment; isFirst: boolean }) {
  const { t } = useTranslation()
  const label = segment.isRest
    ? segment.label
    : segment.label || t('events.byCategory.uncategorized')

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 py-3',
        !isFirst && 'border-t border-divider',
      )}
    >
      {segment.isRest ? (
        // The collapsed tail is not a category, so it takes a plain swatch
        // rather than a disc with a glyph that would claim it is one.
        <View
          className="ml-3 size-2.5 rounded-full"
          style={{ backgroundColor: segment.color }}
        />
      ) : (
        /* The category's own disc, the same one the timeline row draws, so the
           two surfaces name a category identically. */
        <CategoryDisc
          visual={{ iconKey: segment.iconKey, iconColor: segment.color }}
          size={36}
        />
      )}

      <Text
        className={cn('flex-1 t-body-sm', segment.isRest ? 'text-ink2' : 'text-ink')}
        numberOfLines={1}
      >
        {label}
      </Text>

      <Text
        className={cn('t-body-sm text-ink', !segment.isRest && 'font-medium')}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatVndShort(segment.total)}
      </Text>
      <Text
        className="w-10 text-right font-mono t-caption text-ink3"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {t('events.byCategory.share', { percent: Math.round(segment.share * 100) })}
      </Text>
    </View>
  )
}
