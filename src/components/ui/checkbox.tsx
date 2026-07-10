import * as React from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * Lightweight checkbox styled to the design system. Uses the native input with
 * `accent-*` coloring to stay dependency-free while matching the app palette.
 */
const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        data-slot="checkbox"
        className={cn(
          'size-4 shrink-0 rounded-[6px] border border-input accent-[hsl(var(--primary))] outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
