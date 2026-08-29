import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Inputs sit on WHITE and are marked by a 1px `--committed` border, not by a
 * recessed fill. A card is already `--card` white, so a wash-filled control
 * inside it read as a second surface level rather than as a field; the stroke
 * does that job without spending a lightness step.
 *
 * There is no hover state — the control is not actionable until it has focus,
 * and a hover fill only competes with the focus signal. Focus is the one state
 * that needs a visual, and it takes `--data-primary` (a blue border plus a soft
 * ring) rather than a heavy ink outline, which at this radius reads as a
 * disabled slab.
 *
 * The invalid state keeps the outline form, in `--alert`: it carries state, not
 * decoration (§5.2). Disabled is the ONLY variant that gets a fill, and it is
 * `--field-disabled`, not `--wash`: wash is the surface of a control you can
 * still use.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        'flex h-11 w-full rounded-control border border-committed bg-card px-4 py-2 t-body-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink3',
        'focus-visible:border-data-primary focus-visible:shadow-[0_0_0_3px_rgba(115,164,215,0.16)]',
        'disabled:cursor-not-allowed disabled:border-divider disabled:bg-field-disabled disabled:text-ink3 disabled:opacity-100',
        'aria-[invalid=true]:border-alert-ink aria-[invalid=true]:shadow-[0_0_0_3px_var(--alert-tint)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
