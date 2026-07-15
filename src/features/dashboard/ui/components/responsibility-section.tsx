import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { ResponsibilityRow } from '@/features/dashboard/model/dashboard'

type ResponsibilitySectionProps = {
  rows: ResponsibilityRow[]
  unassigned: number
}

/**
 * "Ai đang phụ trách?" (mockup `#responsibility`): one row per member showing
 * how many upcoming payments they own, plus a trailing row for anything still
 * unassigned linking to the payments page.
 */
export function ResponsibilitySection({ rows, unassigned }: ResponsibilitySectionProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-[28px] border border-border bg-card p-6 apple-shadow-soft xl:col-span-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {t('dashboard.redesign.responsibility.eyebrow')}
      </p>
      <h3 className="section-title mt-1 text-xl font-semibold">
        {t('dashboard.redesign.responsibility.title')}
      </h3>

      <div className="mt-5 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-3 py-4 first:pt-0">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[hsl(var(--muted))] text-sm font-semibold">
              {row.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{row.name}</p>
              <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                {row.items}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-[hsl(var(--muted-foreground))]">
              {t('dashboard.redesign.responsibility.count', { count: row.count })}
            </span>
          </div>
        ))}

        {unassigned > 0 ? (
          <Link
            to="/payments"
            className="flex w-full items-center justify-between pt-4 text-left transition hover:opacity-75"
          >
            <div>
              <p className="text-sm font-medium">
                {t('dashboard.redesign.responsibility.unassignedTitle')}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {t('dashboard.redesign.responsibility.unassignedLine', { count: unassigned })}
              </p>
            </div>
            <Plus className="size-5 shrink-0 text-[hsl(var(--muted-foreground))]" strokeWidth={1.8} />
          </Link>
        ) : rows.length > 0 ? (
          <p className="pt-4 text-xs text-[hsl(var(--muted-foreground))]">
            {t('dashboard.redesign.responsibility.allAssigned')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
