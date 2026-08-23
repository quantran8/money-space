import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Switches stay `rounded-full` (design.md §2.3), and the thumb carries no shadow
 * since nothing inside the page floats (§2.3).
 *
 * OFF is the state that has to be readable. A `--sunk` track with a `--panel`
 * thumb is ~1.05:1 against a panel — on a white dialog the control vanishes, so
 * the user cannot tell there is a switch at all, let alone which way it sits.
 * The thumb therefore carries the state: `--ink3` when off (3.3:1 against the
 * panel, the same weight a native unchecked control uses) and panel-white on the
 * accent track when on. The hairline ring only draws the pill's boundary; it is
 * not what makes the state legible.
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-ink3/40 bg-sunk transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent data-[state=checked]:bg-accent',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-ink3 ring-0 transition-[transform,background-color] data-[state=checked]:translate-x-5 data-[state=checked]:bg-panel data-[state=unchecked]:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
