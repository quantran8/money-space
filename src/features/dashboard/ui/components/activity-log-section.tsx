import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { formatVndScale } from '@/shared/lib/format-money'

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
 * No API exposes this feed yet, so Home renders the section's frame with an
 * empty state rather than fabricating entries.
 */
export type ActivityEntry = {
  id: string
  /** Already-relative label, e.g. "hôm nay". */
  when: string
  /** Initials of the member who made the change. ASCII only — it sits in mono. */
  actorInitials: string
  description: string
  amount?: number
  /** How the picture moved, e.g. "thanh khoản +2,4 tr". */
  impact?: string
}

export function ActivityLogSection({ entries }: { entries: ActivityEntry[] }) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('home.activity.title')}
        action={
          <Link to="/events" className="text-[13px] text-accent">
            {t('home.activity.viewAll')}
          </Link>
        }
      />

      {entries.length === 0 ? (
        <p className="mt-6 py-4 text-[13px] text-ink2">{t('home.activity.empty')}</p>
      ) : (
        <ul className="mt-6 -mx-2.5 text-[14px]">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-4 px-2.5 py-2.5">
              <span className="w-20 shrink-0 font-mono text-[11px] text-ink3">{entry.when}</span>
              <span className="w-6 shrink-0 font-mono text-[11px] text-ink3">
                {entry.actorInitials}
              </span>
              <span className="flex-1">{entry.description}</span>
              {entry.amount === undefined ? null : (
                <span className="num w-24 text-right text-ink2">{formatVndScale(entry.amount)}</span>
              )}
              {entry.impact ? (
                <span className="hidden w-36 text-right text-[12px] text-ink3 sm:block">
                  {entry.impact}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
