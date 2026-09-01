import { Text, View } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

import type { CompositionSegment } from '@money-space/core/shared/presentation.types'

export type { CompositionSegment } from '@money-space/core/shared/presentation.types'

/**
 * Money composition ring + legend (v5 02-components §15).
 *
 * Replaces the horizontal segmented strip. A strip spent full section width to
 * say one ratio; the ring says the same thing in a fixed square and gives the
 * headline share a centre to sit in, so the number the block exists to deliver
 * is read before the legend rather than after it.
 *
 * Committed is the neutral grey; flexible carries `--data-primary`, NOT the
 * action colour — composition is data, and v5 §4 keeps the action colour out of
 * data state entirely. Amber stays reserved for `attention`.
 *
 * The legend may repeat the values because it serves the visualisation — that
 * is the one exception to "một dữ kiện, một chỗ" (03-patterns §9).
 *
 * The web draws this with recharts. RN has no recharts, so the arcs are drawn
 * as `stroke-dasharray` segments on one SVG circle: a ring is a stroked circle,
 * and a dash pattern is exactly a run of arcs — no path maths and no per-frame
 * work, which is what keeps it cheap on Hermes.
 */

const SIZE = 170
const STROKE = 24
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** The visual gap between two arcs, in px of circumference. */
const GAP = 6

/**
 * The smallest share that still draws as a visible arc.
 *
 * Seeing that a share is nearly nothing is the point; seeing nothing at all is
 * a bug (§11.4) — flexible money is closest to zero exactly when seeing it
 * matters most. The distortion is bounded and never changes which segment is
 * larger; the legend carries the exact figures either way.
 */
const MIN_SHARE = 0.004

export function MoneyCompositionRing({
  segments,
  ariaLabel,
  formatAmount,
  centerLabel,
  legend = true,
  className,
}: {
  segments: CompositionSegment[]
  /** Must read out every value as words (§24). */
  ariaLabel: string
  formatAmount: (value: number) => string
  /** The word under the centre figure, e.g. "linh hoạt". Caller-translated. */
  centerLabel: string
  /**
   * Render the built-in legend under the ring. Off when the caller has its own
   * — the asset screen pairs the ring with a legend that also lists the goals
   * behind the committed share, which this one cannot express.
   */
  legend?: boolean
  className?: string
}) {
  const fill: Record<CompositionSegment['tone'], string> = {
    committed: colors.committed,
    flexible: colors.dataPrimary,
  }

  // Weights must be non-negative, and a segment that rounds to nothing still
  // needs to be visible (§11.4).
  const weights = segments.map((segment) => Math.max(segment.amount, 0))
  const total = weights.reduce((sum, weight) => sum + weight, 0)

  // Nothing to divide: there is no composition of zero money, so the ring draws
  // as ONE empty track rather than as equal shares. Splitting it evenly stated a
  // 50/50 ratio the household does not have, and the legend still carries the
  // real zeroes.
  const isEmpty = total <= 0

  const shares = segments.map((_, index) =>
    Math.max(weights[index] / (total || 1), MIN_SHARE),
  )

  const headline = segments.find((segment) => segment.tone === 'flexible') ?? segments[0]

  /**
   * Each arc is one dash: its own length, then a gap covering the rest of the
   * ring. The offsets are the RUNNING SUM of the shares before each arc, so
   * every arc starts where the previous one ended.
   *
   * Precomputed rather than accumulated inside the map: mutating a variable
   * while rendering makes the output depend on how many times React calls the
   * component, which is not a guarantee React makes.
   */
  const offsets = shares.reduce<number[]>(
    (acc, share, index) => [...acc, (acc[index - 1] ?? 0) + share],
    [],
  )

  return (
    <View className={cn('items-center', className)}>
      <View
        style={{ width: SIZE, height: SIZE }}
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        <Svg width={SIZE} height={SIZE}>
          {/* -90° puts the first arc at 12 o'clock and sweeps clockwise, which
              is where a reader expects a composition to start. */}
          <G rotation={-90} originX={SIZE / 2} originY={SIZE / 2}>
            {isEmpty ? (
              // One continuous track: a lone arc has no neighbour to be
              // separated from, so it takes no gap and no rounded cap.
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={fill.committed}
                strokeWidth={STROKE}
                fill="none"
              />
            ) : (
              shares.map((share, index) => {
                const length = Math.max(share * CIRCUMFERENCE - GAP, 1)
                // The arcs BEFORE this one, so it starts where they ended.
                const offset = -(offsets[index - 1] ?? 0) * CIRCUMFERENCE
                return (
                  <Circle
                    key={segments[index].key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={fill[segments[index].tone]}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                    strokeDashoffset={offset}
                    fill="none"
                  />
                )
              })
            )}
          </G>
        </Svg>

        {/* The centre figure: the one number the block exists to deliver. */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="t-figure text-ink" style={{ fontVariant: ['tabular-nums'] }}>
            {headline.percentLabel ?? `${headline.percent}%`}
          </Text>
          <Text className="mt-1 t-caption text-ink3">{centerLabel}</Text>
        </View>
      </View>

      {legend ? (
        <View className="mt-6 w-full">
          {segments.map((segment, index) => (
            <View
              key={segment.key}
              className={cn(
                'flex-row items-center gap-3 py-3.5',
                index < segments.length - 1 && 'border-b border-divider',
              )}
            >
              <View
                className="size-2 rounded-full"
                style={{ backgroundColor: fill[segment.tone] }}
              />
              <Text
                className={cn(
                  'flex-1 t-body-sm',
                  segment.tone === 'flexible' ? 'font-medium text-ink' : 'text-ink2',
                )}
                numberOfLines={1}
              >
                {segment.label}
              </Text>
              <Text
                className="t-caption text-ink3"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {segment.percentLabel ?? `${segment.percent}%`}
              </Text>
              <Text
                className={cn(
                  't-body-sm text-right',
                  segment.tone === 'flexible' ? 'font-medium text-ink' : 'text-ink2',
                )}
                style={{ fontVariant: ['tabular-nums'], minWidth: 76 }}
              >
                {formatAmount(segment.amount)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
