import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Same rules as `Input`: no border, `--sunk` fill (design.md §2.2, §3). Radius
 * is `rounded-sunk` (10px) rather than the control 8px because the box is tall
 * enough to read as a sunk block.
 */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-28 w-full rounded-sunk bg-sunk px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink3 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-alert',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
