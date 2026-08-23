import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle, Line, Path } from 'react-native-svg'

import type { DeltaPoint } from '@money-space/core/features/dashboard/model/home-derivations'

import { Label } from '@/components/ui'
import { formatDayMonth } from '@/features/dashboard/lib/home-dates'
import { colors } from '@/theme/tokens'

const HEIGHT = 104

/**
 * Thirty days of cash flow, drawn as CHANGE SINCE TODAY (§12.2, §2.8).
 *
 * Two properties make the shape honest, and both come from `buildDeltaSeries`:
 * the baseline is a true zero — today — so the line cannot exaggerate a dip the
 * way an auto-scaled balance axis does, and the reading does not depend on how
 * much money the household happens to hold. Plotting the balance itself gives a
 * flat line pinned near the total, where a month of real movement is a rounding
 * error.
 *
 * The interpolation is a STEP, because a balance does not drift between events:
 * it holds flat and moves on the day something is paid. A smoothed curve would
 * draw money leaving the account on days nothing happened.
 *
 * Hand-drawn with `react-native-svg`, the same approach as the asset chart: a
 * step path, a zero rule and one dot is the whole requirement, and a charting
 * library arrives with its own palette and its own idea of a grid.
 *
 * The caller decides whether this earns its place at all (§9) — below a handful
 * of events the row list already shows the sequence, and a five-point line is
 * decoration.
 */
export function CashflowDeltaChart({
  points,
  /** Index of the low point, or -1 when the month never dips below today. */
  lowestIndex,
  label,
  ariaLabel,
}: {
  points: DeltaPoint[]
  lowestIndex: number
  label: string
  ariaLabel: string
}) {
  const [width, setWidth] = useState(0)

  const geometry = useMemo(() => {
    if (points.length < 2 || width <= 0) return null

    const deltas = points.map((point) => point.delta)
    // Zero is always in frame: it is the line every other point is read
    // against, so a month entirely below today must still show its baseline.
    const min = Math.min(0, ...deltas)
    const max = Math.max(0, ...deltas)
    const span = max - min || 1
    const padY = 10

    const x = (index: number) => (index / (points.length - 1)) * width
    const y = (delta: number) => HEIGHT - padY - ((delta - min) / span) * (HEIGHT - padY * 2)

    const coordinates = points.map((point, index) => ({
      x: x(index),
      y: y(point.delta),
    }))

    // A step, not a polyline: hold the previous level across to the new x, then
    // move vertically on the day it actually changes.
    const path = coordinates
      .map((point, index) =>
        index === 0
          ? `M${point.x.toFixed(2)},${point.y.toFixed(2)}`
          : `H${point.x.toFixed(2)} V${point.y.toFixed(2)}`,
      )
      .join(' ')

    return { coordinates, path, zeroY: y(0) }
  }, [points, width])

  if (points.length < 2) return null

  const low = geometry && lowestIndex >= 0 ? geometry.coordinates[lowestIndex] : undefined

  return (
    <View className="rounded-sunk bg-sunk p-4">
      {/* §10.4: the unit is declared once, here, so the axis ends stay bare. */}
      <Label>{label}</Label>

      <View
        className="mt-2"
        style={{ height: HEIGHT }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessibilityRole="image"
        // §9: a chart owes a text reading to anyone who cannot see the shape.
        accessibilityLabel={ariaLabel}
      >
        {geometry ? (
          <Svg width={width} height={HEIGHT}>
            {/* Today. Every point on the line is read against this. */}
            <Line
              x1={0}
              y1={geometry.zeroY}
              x2={width}
              y2={geometry.zeroY}
              stroke={colors.hair}
              strokeWidth={1}
            />

            <Path
              d={geometry.path}
              stroke={colors.ink2}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* The low point, amber — a month that never dips below today has
                no low point worth marking, and `buildDeltaSeries` says so with
                -1 rather than pointing at the least-high day. */}
            {low ? (
              <Circle cx={low.x} cy={low.y} r={3.5} fill={colors.attention} />
            ) : null}
          </Svg>
        ) : null}
      </View>

      {/* Two labelled ends rather than a tick scale: at this width a full axis
          is overlapping numbers, and the endpoints are what gets compared. */}
      <View className="mt-1.5 flex-row items-center justify-between">
        <Text className="font-mono text-[11px] text-ink3">
          {formatDayMonth(points[0].date)}
        </Text>
        <Text className="font-mono text-[11px] text-ink3">
          {formatDayMonth(points[points.length - 1].date)}
        </Text>
      </View>
    </View>
  )
}
