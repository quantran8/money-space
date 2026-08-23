import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import type { AssetValuePoint } from '@money-space/core/features/assets/hooks/use-asset-detail'
import type { AssetLiquidity } from '@money-space/core/features/assets/model/assets'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import { liquidityColors } from '@/theme/tokens'

const HEIGHT = 132

/** A moment the household changed what it HOLDS, as opposed to the market moving. */
export type AssetValueMarker = {
  isoDate: string
  label: string
}

/**
 * An asset's value over time.
 *
 * **This is the one chart in the assets feature that earns its place on a
 * phone** (§9). The other two the web draws do not, and are deliberately absent:
 *
 *  - the liquidity donut is three numbers, which a labelled bar and three rows
 *    answer better in less space (see `assets-summary.tsx`);
 *  - the household trend chart repeats what this one says per asset, and a
 *    multi-series area on 335pt is unreadable before it is informative.
 *
 * This one stays because the reading task is genuinely a SHAPE: "has this been
 * climbing or sliding", which a column of dated figures does not answer at a
 * glance. It renders only with ≥2 points — one point is not a trend, and a
 * chart drawn to look financial is exactly what §9 forbids.
 *
 * Hand-drawn with `react-native-svg` rather than pulling in a charting library:
 * a polyline, an area fill and a few dots is the whole requirement, and a chart
 * library would arrive with its own palette, its own tooltips and its own idea
 * of a grid — none of which survive contact with v4.2.
 */
export function AssetValueChart({
  points,
  liquidity,
  markers = [],
}: {
  points: AssetValuePoint[]
  liquidity: AssetLiquidity
  markers?: AssetValueMarker[]
}) {
  const { t } = useTranslation()
  const [width, setWidth] = useState(0)
  const color = liquidityColors[liquidity]

  const geometry = useMemo(() => {
    if (points.length < 2 || width <= 0) return null

    const values = points.map((point) => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    // A flat series still has to draw somewhere: without a span it would divide
    // by zero and collapse onto the top edge.
    const span = max - min || Math.abs(max) || 1
    const padY = 10

    const x = (index: number) => (index / (points.length - 1)) * width
    const y = (value: number) =>
      HEIGHT - padY - ((value - min) / span) * (HEIGHT - padY * 2)

    const coordinates = points.map((point, index) => ({
      x: x(index),
      y: y(point.value),
      isoDate: point.isoDate,
      value: point.value,
    }))

    const line = coordinates
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ')

    // The fill closes down to the baseline so the line reads as a quantity
    // rather than as a path.
    const area = `${line} L${width.toFixed(2)},${HEIGHT} L0,${HEIGHT} Z`

    return { coordinates, line, area }
  }, [points, width])

  /**
   * Snap each marker to the plotted point it belongs to. A marker outside the
   * visible range has nowhere to sit, so it is dropped rather than clamped onto
   * an edge it did not happen at.
   */
  const plotted = useMemo(() => {
    if (!geometry) return []
    return markers
      .map((marker) => geometry.coordinates.find((point) => point.isoDate >= marker.isoDate))
      .filter((point): point is NonNullable<typeof point> => point !== undefined)
  }, [geometry, markers])

  if (points.length < 2) {
    return (
      <View className="items-center justify-center rounded-sunk bg-sunk px-4 py-10">
        <Text className="text-center text-[13px] text-ink2">
          {t('assets.detail.chart.empty')}
        </Text>
      </View>
    )
  }

  const first = points[0]
  const last = points[points.length - 1]

  return (
    <View className="rounded-sunk bg-sunk p-4">
      <View
        style={{ height: HEIGHT }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessibilityRole="image"
        // §9: a chart carries a text summary. Screen readers get the reading,
        // not a shape they cannot see.
        accessibilityLabel={t('assets.detail.chart.rangeAria', {
          name: t('assets.detail.chart.title'),
          range: `${formatVndShort(first.value)} → ${formatVndShort(last.value)}`,
        })}
      >
        {geometry ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="assetValueFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.18} />
                <Stop offset="1" stopColor={color} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            <Path d={geometry.area} fill="url(#assetValueFill)" />
            <Path
              d={geometry.line}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />

            {/* Holding changes: hollow and neutral-stroked, deliberately NOT in
                the line's colour, so a purchase never reads as part of the
                value move it interrupts. */}
            {plotted.map((point) => (
              <Circle
                key={point.isoDate}
                cx={point.x}
                cy={point.y}
                r={3.5}
                fill="#FFFFFF"
                stroke="#707780"
                strokeWidth={2}
              />
            ))}
          </Svg>
        ) : null}
      </View>

      {/* The axis, as two labelled ends rather than a tick scale: on 300pt a
          full axis is four overlapping numbers, and the endpoints are what the
          reader actually compares. */}
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-mono text-[11px] text-ink3">{displayDate(first.isoDate)}</Text>
        <Text className="font-mono text-[11px] text-ink3">{displayDate(last.isoDate)}</Text>
      </View>
    </View>
  )
}

/** `23/08` — ASCII, so the mono face is safe. */
function displayDate(iso: string): string {
  const [, month, day] = iso.split('-')
  return month && day ? `${day.slice(0, 2)}/${month}` : ''
}
