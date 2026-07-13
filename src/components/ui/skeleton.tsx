import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * A pulsing placeholder block shown while data from an API is loading.
 *
 * Matches the app's calm-finance system: soft muted fill with the same
 * `animate-pulse` treatment used elsewhere. Size and radius are controlled
 * by the caller via `className` (e.g. `h-4 w-40 rounded-full`).
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-[12px] bg-muted', className)}
      {...props}
    />
  )
}
