import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The bar is drawn as hairline ticks rather than a solid fill, so the filled run
 * reads as a measured stretch of scale instead of a block of colour (§4).
 *
 * Geometry is a FIXED PITCH — a 2px tick every 6px — not a fixed tick count.
 * A fixed count has to divide the container, so the gap grows with the column:
 * at 40 ticks a 280px bar gaps 6px while a 720px bar gaps 17px, and the same
 * component reads dense in a card and sparse in a wide panel. Holding the pitch
 * instead keeps ink density constant (~33%) at every width, which is what makes
 * two bars on the same screen look like the same control.
 *
 * The tick is 2px, not 1px: at 1px the mark is lighter than the gap on every
 * display, and the row reads as empty space with flecks in it rather than as a
 * scale.
 *
 * Track and fill share one background definition and differ only in colour, so
 * their ticks are always in phase — the fill is the same scale, painted over.
 * Both are anchored to the LEFT edge of the track (`background-position: 0 0`)
 * rather than to their own box, so shrinking the fill clips the run of ticks
 * instead of resampling it: a tick never slides or half-appears as the value
 * animates.
 *
 * The fill takes `currentColor`, so a caller retints the bar with any text
 * colour (`text-positive`, `text-attention-ink`, …) without touching this file.
 */
const TICK_WIDTH = 2
const TICK_PITCH = 6

const TICKS = `repeating-linear-gradient(to right, currentColor 0 ${TICK_WIDTH}px, transparent ${TICK_WIDTH}px ${TICK_PITCH}px)`

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const percent = Math.min(100, Math.max(0, value || 0))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn('relative h-6 w-full overflow-hidden text-data-primary', className)}
      value={value}
      {...props}
    >
      {/* Unfilled scale. Sits under the fill so the two rows of ticks align. */}
      <div
        aria-hidden
        data-slot="progress-track"
        className="absolute inset-0 text-committed"
        style={{ backgroundImage: TICKS }}
      />
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%`, backgroundImage: TICKS }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
