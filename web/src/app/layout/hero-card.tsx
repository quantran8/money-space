import type { ReactNode } from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The hero card (v5 01-foundations §3, 02-components §1).
 *
 * The ONLY surface that may use `--hero`. It is a card inside the page, not a
 * page background: everything else — shell, content, other cards — sits on
 * `--canvas`.
 *
 * It carries page identity and context, nothing more. Not 4–6 KPI boxes, not
 * duplicate money values, not a full chart or a management table: the canonical
 * answer gets its own card below (§3).
 *
 * Text is `--ink` (11.7:1 on `--hero`). White is not an option — it reaches
 * 1.63:1, failing even the large-text threshold.
 */
export function HeroCard({
  eyebrow,
  title,
  context,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  /** One line of scope or freshness — never a second heading. */
  context?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'hero-surface flex flex-wrap items-end justify-between gap-4 p-6 lg:p-8',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? <p className="text-[16px] text-ink2 lg:text-[20px]">{eyebrow}</p> : null}
        <h1 className="page-title text-[36px] leading-[1.02] lg:text-[56px]">{title}</h1>
        {context ? <div className="mt-1 text-[14px] text-ink">{context}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </section>
  )
}
