import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        'flex h-11 w-full rounded-[22px] border border-input bg-card px-4 py-2 text-sm text-foreground shadow-none outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[hsl(var(--status-red))] aria-[invalid=true]:focus-visible:ring-[hsl(var(--status-red))]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
