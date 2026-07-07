import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
        className,
      )}
    >
      <div>
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
        <h1 className="page-title mt-1 text-4xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
