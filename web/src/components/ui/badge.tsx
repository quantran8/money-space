import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Badges stay `rounded-full` (design.md §2.3) and sit on a sunk fill rather than
 * a stroke — the v4.0 system separates by lightness, not by borders (§2.2).
 * Colour is reserved for something the user must act on (§5.2), which is why the
 * neutral `secondary` fill is the default.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 t-caption font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-action text-action-inverse',
        secondary: 'bg-wash text-ink2',
        destructive: 'bg-alert text-white',
        outline: 'bg-wash text-ink',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
