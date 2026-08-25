import type { ReactNode } from 'react'

type CompactPageHeaderProps = {
  title: string
  actions?: ReactNode
}

/**
 * Page heading for every screen: one title line naming what the page is for,
 * plus its primary actions. No eyebrow, no description — the page itself
 * explains what it holds.
 *
 * Sits on `--canvas` like everything else. Only Home uses a `HeroCard`, because
 * only Home has page identity worth a surface of its own (v5 §3).
 */
export function CompactPageHeader({ title, actions }: CompactPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="t-page-tracking t-metric leading-[1.08] lg:t-figure">{title}</h1>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </header>
  )
}
