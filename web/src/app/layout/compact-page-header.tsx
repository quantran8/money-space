import type { ReactNode } from 'react'

type CompactPageHeaderProps = {
  title: string
  actions?: ReactNode
  /**
   * One control that scopes the whole page, rendered under the title.
   *
   * Only for a control the page's every figure depends on — the period picker
   * on Sắp tới. It is NOT a subtitle slot: prose under a page title is the
   * filler §11.1 keeps out of `PanelHeader`, and the same reasoning applies
   * here.
   */
  scope?: ReactNode
}

/**
 * Page heading for every screen: one title line naming what the page is for,
 * plus its primary actions. No eyebrow, no description — the page itself
 * explains what it holds.
 *
 * Sits on `--canvas` like everything else. Only Home uses a `HeroCard`, because
 * only Home has page identity worth a surface of its own (v5 §3).
 */
export function CompactPageHeader({ title, actions, scope }: CompactPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="t-page-tracking t-metric leading-[1.08] lg:t-figure">{title}</h1>
        {scope ? <div className="mt-4">{scope}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </header>
  )
}
