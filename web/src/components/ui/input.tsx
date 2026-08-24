import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Inputs have NO border and sit on `--sunk` (design.md §2.2, §3). The recessed
 * fill is what marks the field as editable now that strokes are gone.
 *
 * The invalid state is the one place a control gets an outline back: it carries
 * state, not decoration, so `--alert` reads as a ring (§5.2).
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        'flex h-11 w-full rounded-control bg-wash px-4 py-2 text-sm text-ink outline-none transition placeholder:text-ink3 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-alert',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
