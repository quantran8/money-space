import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-[hsl(var(--secondary))] px-3 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]',
        className,
      )}
      {...props}
    />
  )
}
