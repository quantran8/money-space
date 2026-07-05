import type { SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-11 w-full rounded-[22px] border bg-white px-4 py-2 text-sm text-[hsl(var(--foreground))] outline-none transition focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
        className,
      )}
      {...props}
    />
  )
}
