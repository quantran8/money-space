import type { ReactNode } from 'react'

type CompactPageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
}

/** Compact page heading used by the ledger-style secondary screens. */
export function CompactPageHeader({ eyebrow, title, description, actions }: CompactPageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 pb-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="label">{eyebrow}</p>
        <h1 className="page-title mt-2 text-[30px] leading-[1.15] sm:text-[34px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[680px] text-[13px] leading-6 text-ink2">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </header>
  )
}
