import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-28 w-full rounded-[22px] border bg-white px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none transition placeholder:text-[hsl(var(--muted-foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] aria-[invalid=true]:border-[hsl(var(--status-red))] aria-[invalid=true]:focus-visible:ring-[hsl(var(--status-red))]',
        className,
      )}
      {...props}
    />
  )
}
