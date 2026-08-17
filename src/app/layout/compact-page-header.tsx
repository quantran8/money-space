import type { ReactNode } from 'react'

type CompactPageHeaderProps = {
  title: string
  actions?: ReactNode
}

/**
 * Page heading for every screen: one title line naming what the page is for,
 * plus its primary actions. No eyebrow, no description — the page itself
 * explains what it holds.
 */
export function CompactPageHeader({ title, actions }: CompactPageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 pb-1 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="page-title text-[30px] leading-[1.15] sm:text-[34px]">{title}</h1>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </header>
  )
}
