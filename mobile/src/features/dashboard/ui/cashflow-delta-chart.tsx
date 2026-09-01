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
 * The interpolation is MONOTONE, matching the web. Stepping was literally truer
 * to the mechanism — a balance holds flat, then moves the day something is paid
 * — and it was still dropped: at 30 points across a phone's width the risers
 * read as noise, and the question this chart answers is how deep the dip goes
 * and roughly when. The exact per-day sequence is already answered, precisely,
 * by the event rows beside it, so the chart was paying for precision the
 * section provides elsewhere.
 *
 * Monotone specifically, not a plain spline: monotone interpolation never
 * overshoots, so the curve cannot dip below the lowest data point or rise above
 * the highest. That matters here — the low-point dot must remain the visual
 * minimum, and a smoothed curve must not invent a trough no cashflow event
 * produced.
 *
 * Hand-drawn with `react-native-svg`, the same approach as the asset chart: a
 * path, a zero rule and one dot is the whole requirement, and a charting
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

    const path = monotonePath(coordinates)

    return { coordinates, path, zeroY: y(0) }
  }, [points, width])

  if (points.length < 2) return null

  const low = geometry && lowestIndex >= 0 ? geometry.coordinates[lowestIndex] : undefined

  return (
    <View className="rounded-control bg-wash p-4">
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
        <Text className="font-mono t-caption-sm text-ink3">
          {formatDayMonth(points[0].date)}
        </Text>
        <Text className="font-mono t-caption-sm text-ink3">
          {formatDayMonth(points[points.length - 1].date)}
        </Text>
      </View>
    </View>
  )
}

/**
 * A monotone cubic path through the points (Fritsch–Carlson tangents).
 *
 * The tangent at each point is a weighted harmonic mean of the neighbouring
 * secant slopes, and it is forced to ZERO wherever the slopes change sign —
 * i.e. at a local peak or trough. That is the property the chart needs: the
 * curve cannot overshoot past a data point, so the rendered minimum is the real
 * minimum and the low-point dot always sits on it.
 */
function monotonePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`

  // Secant slope of each segment.
  const slopes = points.slice(0, -1).map((point, index) => {
    const dx = points[index + 1].x - point.x
    return dx === 0 ? 0 : (points[index + 1].y - point.y) / dx
  })

  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0]
    if (index === points.length - 1) return slopes[slopes.length - 1]
    const previous = slopes[index - 1]
    const next = slopes[index]
    // A sign change means this point is a local extreme: a flat tangent is what
    // stops the curve from sailing past it.
    if (previous * next <= 0) return 0
    return (previous + next) / 2
  })

  // Clamp the tangents so no segment can overshoot its own secant.
  for (let index = 0; index < slopes.length; index += 1) {
    if (slopes[index] === 0) {
      tangents[index] = 0
      tangents[index + 1] = 0
      continue
    }
    const a = tangents[index] / slopes[index]
    const b = tangents[index + 1] / slopes[index]
    const magnitude = Math.hypot(a, b)
    if (magnitude > 3) {
      tangents[index] = ((3 / magnitude) * a) * slopes[index]
      tangents[index + 1] = ((3 / magnitude) * b) * slopes[index]
    }
  }

  let path = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const dx = (next.x - current.x) / 3
    const c1x = current.x + dx
    const c1y = current.y + dx * tangents[index]
    const c2x = next.x - dx
    const c2y = next.y - dx * tangents[index + 1]
    path += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`
  }
  return path
}
