import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[28px] border bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)]',
        className,
      )}
      {...props}
    />
  )
}
