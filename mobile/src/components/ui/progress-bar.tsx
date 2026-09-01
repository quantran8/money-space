import { useState } from 'react'
import { View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

import type { LayoutChangeEvent } from 'react-native'

/**
 * How far along something is, drawn as hairline ticks rather than a solid fill,
 * so the filled run reads as a measured stretch of scale instead of a block of
 * colour (§4).
 *
 * Geometry is a FIXED PITCH — a 2px tick every 6px — not a fixed tick count.
 * A fixed count has to divide the container, so the gap grows with the width:
 * at 40 ticks a 280px bar gaps 6px while a 720px bar gaps 17px, and the same
 * component reads dense in a card and sparse in a wide panel. Holding the pitch
 * instead keeps ink density constant (~33%) at every width, which is what makes
 * two bars on the same screen look like the same control.
 *
 * The tick is 2px, not 1px: at 1px the mark is lighter than the gap on every
 * display, and the row reads as empty space with flecks in it rather than as a
 * scale.
 *
 * The web draws this with a `repeating-linear-gradient`. RN has no repeating
 * gradient, so the run is MEASURED (`onLayout`) and the ticks are rendered as
 * an array of views. Track and fill are the same array painted twice, so their
 * ticks are always in phase and the fill is the same scale in a second colour —
 * a tick never slides or half-appears as the value changes.
 *
 * The fill is `--data-primary`: progress is DATA, and v5 §4 keeps the action
 * colour out of data state. Being 40% of the way to a goal is not something to
 * press and not something to worry about.
 */

const TICK_WIDTH = 2
const TICK_PITCH = 6

export function ProgressBar({
  /** 0–100. Clamped here so a caller cannot overflow the track. */
  percent,
  label,
  height = 6,
  tone = 'data',
  className,
}: {
  percent: number
  /** Screen-reader description — colour is never the only channel (§9). */
  label?: string
  height?: number
  tone?: 'data' | 'attention'
  className?: string
}) {
  const [width, setWidth] = useState(0)

  const value = Math.min(Math.max(Number.isFinite(percent) ? percent : 0, 0), 100)
  const fillColor = tone === 'attention' ? colors.attention : colors.dataPrimary

  const tickCount = width > 0 ? Math.ceil(width / TICK_PITCH) : 0
  // Ticks are laid out from the LEFT of the track and the fill CLIPS them, so
  // the run is cut rather than resampled as the value changes.
  const filledWidth = (width * value) / 100

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      onLayout={onLayout}
      className={cn('w-full overflow-hidden', className)}
      style={{ height }}
    >
      <Ticks count={tickCount} height={height} color={colors.committed} />

      <View
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: filledWidth }}
      >
        <Ticks count={tickCount} height={height} color={fillColor} />
      </View>
    </View>
  )
}

/** One run of ticks at the fixed pitch, anchored to the left edge. */
function Ticks({ count, height, color }: { count: number; height: number; color: string }) {
  return (
    <View className="absolute inset-y-0 left-0 flex-row" style={{ height }}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            width: TICK_WIDTH,
            marginRight: TICK_PITCH - TICK_WIDTH,
            height,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  )
}
