import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * A pulsing placeholder block shown while data from an API is loading.
 *
 * Fills with `--sunk`, the same recessed surface the loaded content will sit on
 * (design.md §2.1), so the placeholder does not introduce a fourth tone. Size
 * and radius are controlled by the caller via `className` (e.g.
 * `h-4 w-40 rounded-full`).
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-sunk bg-sunk', className)}
      {...props}
    />
  )
}
