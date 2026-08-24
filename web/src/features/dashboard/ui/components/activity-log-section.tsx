import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  actorInitials,
  describeEntry,
  describeImpact,
} from '@money-space/core/features/activity/model/activity-copy'
import type { ActivityEntry } from '@money-space/core/features/activity/model/activity.types'
import { formatVndScale, formatVndSigned } from '@money-space/core/shared/lib/format-money'
import { formatRelativeDay } from '@money-space/core/shared/lib/format-relative-day'

/**
 * Home section 5 — Nhật ký (§12.5, §2.14).
 *
 * The three most recent changes TO THE PICTURE — a balance update, a new
 * upcoming item, a reserve change. Never individual purchases: logging those
 * would turn the product into the expense tracker it explicitly is not (§0.2).
 *
 * The `impact` column is mandatory. It is what separates this from a technical
 * audit log — if a change cannot describe how it moved the picture, that is a
 * reason not to log it at all (§14.10).
 *
 * With no permission hierarchy left between partners, this section is also the
 * accountability mechanism: nothing stops either person changing anything, so
 * what makes a change answerable is that it shows up here.
 */
export function ActivityLogSection({ entries }: { entries: ActivityEntry[] }) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('home.activity.title')}
        action={
          <Link to="/activity" className="text-[13px] text-action">
            {t('home.activity.viewAll')}
          </Link>
        }
      />

      {entries.length === 0 ? (
        <p className="mt-6 py-4 text-[13px] text-ink2">{t('home.activity.empty')}</p>
      ) : (
        <ul className="mt-6 -mx-2.5 text-[14px]">
          {entries.map((entry) => {
            const impact = describeImpact(entry, t, formatVndSigned)
            return (
              <li key={entry.id} className="flex items-baseline gap-4 px-2.5 py-2.5">
                <span className="w-20 shrink-0 font-mono text-[11px] text-ink3">
                  {formatRelativeDay(entry.occurredAt, t)}
                </span>
                <span className="w-6 shrink-0 font-mono text-[11px] text-ink3">
                  {actorInitials(entry)}
                </span>
                <span className="flex-1">{describeEntry(entry, t)}</span>
                {entry.amount === null ? null : (
                  <span className="num w-24 text-right text-ink2">
                    {formatVndScale(entry.amount)}
                  </span>
                )}
                {impact ? (
                  <span className="hidden w-40 text-right text-[12px] text-ink3 sm:block">
                    {impact}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
