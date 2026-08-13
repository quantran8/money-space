import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as React from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * Dividers are all but eliminated in v4.0 (design.md §2.4): never between a
 * heading, a metric, a list row or a table row. What is left is a hairline on
 * `--hair`, kept for the two places §2.4 still allows — mobile bottom nav, and a
 * form group that would be unreadable without a break.
 */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-hair data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
