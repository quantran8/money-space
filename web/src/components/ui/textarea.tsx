import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Same rules as `Input`: a white `--card` fill marked by a 1px `--committed`
 * stroke, focus in `--data-primary`. Radius is `rounded-control` rather than the
 * control 8px because the box is tall enough to read as a block.
 */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-28 w-full rounded-control border border-committed bg-card px-4 py-3 t-body-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink3 focus-visible:border-data-primary focus-visible:shadow-[0_0_0_3px_rgba(115,164,215,0.16)] disabled:cursor-not-allowed disabled:border-divider disabled:bg-wash disabled:text-ink3 disabled:opacity-100 aria-[invalid=true]:border-alert aria-[invalid=true]:shadow-[0_0_0_3px_var(--alert-tint)]',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
