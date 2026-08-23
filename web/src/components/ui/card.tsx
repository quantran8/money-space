import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * A panel surface (design.md §2.1–2.3).
 *
 * No border and no shadow: sections are separated by the lightness step from
 * `--app` to `--panel`, which is the only mechanism left once strokes were
 * removed (§2.2). Radius is 14px, not the v3.x 28px.
 *
 * New screens should prefer `Panel` from `@/components/ui/panel`, which also
 * carries the §7.1 padding rhythm. This stays for the many existing callers.
 */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-panel bg-panel p-5 text-ink sm:p-8', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm leading-6 text-muted-foreground', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn(className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  )
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
