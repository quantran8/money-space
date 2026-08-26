import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Lightweight checkbox styled to the design system. Uses the native input with
 * `accent-*` coloring to stay dependency-free while matching the app palette.
 *
 * No border: the control sits on the ink ramp via the native accent colour
 * (design.md §2.2). Radius is `rounded-control` (8px), the smallest token.
 */
const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        data-slot="checkbox"
        className={cn(
          'size-4 shrink-0 rounded-control accent-accent outline-none transition focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
