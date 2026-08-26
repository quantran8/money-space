import type { LucideIcon } from 'lucide-react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The canonical "nothing here yet" block (v5 §26).
 *
 * Two rules it exists to hold:
 *
 * NO SURFACE. An empty state sits DIRECTLY inside the card that would have
 * held the data. Nine of these were wrapped in a wash rectangle, which §2.4
 * reserves for control surfaces — a card inside a card, saying nothing the
 * spacing was not already saying.
 *
 * THE ICON CARRIES THE EMPTINESS. §26: the icon says "there is nothing here",
 * so the text is free to say the thing the icon cannot — which of the two
 * absences this is. "No records yet" and "the filter excluded everything" look
 * identical in a bare sentence and mean opposite things: one asks the
 * household to add, the other to clear a filter.
 */
export function EmptyState({
  icon: Icon,
  children,
  action,
  className,
}: {
  /** Lucide icon. Pick one that names the missing thing, not a generic slate. */
  icon: LucideIcon
  /** One short line. Say what is absent, not why the screen looks bare. */
  children: React.ReactNode
  /** The one thing that resolves the absence, when there is one. */
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-8 text-center', className)}>
      <Icon className="size-6 text-ink3" strokeWidth={1.5} aria-hidden />
      <p className="max-w-[42ch] t-body-sm leading-5 text-ink2">{children}</p>
      {action}
    </div>
  )
}
