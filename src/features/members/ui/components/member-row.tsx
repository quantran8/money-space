import { useTranslation } from 'react-i18next'

import { StatusChip } from '@/components/ui/status-chip'
import type { MemberItem } from '@/features/members/model/members.types'

type MemberRowProps = {
  member: MemberItem
  /** How many money sources this person is responsible for. */
  holdsCount: number
}

/**
 * One person in the household.
 *
 * This used to be a permissions row: two Selects for role and access level,
 * with the owner's hard-coded as read-only. None of that exists any more —
 * both partners have the same rights, so there is nothing here to grant.
 *
 * What replaces it is the question the product actually cares about: not "who
 * is allowed what" but "who is responsible for what". Removing a member and
 * inviting one live in the household admin disclosure, away from the everyday
 * view, because they change who is in the room rather than what is in it.
 */
export function MemberRow({ member, holdsCount }: MemberRowProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-sunk px-3 py-3 transition-colors hover:bg-sunk sm:px-4">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-sunk text-[12px] font-medium">
            {member.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[13px] font-medium">{member.name}</p>
              {member.status === 'invited' ? (
                <span className="rounded-full bg-attention-tint px-2 py-1 text-[10px] text-attention">
                  {t('members.list.pending')}
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-[11px] text-ink3">{member.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-end">
          <p className="text-[12px] text-ink2">
            {t('members.list.holdsSources', { count: holdsCount })}
          </p>
          <StatusChip tone={member.status === 'active' ? 'accent' : 'attention'}>
            {member.status === 'active'
              ? t('members.list.active')
              : t('members.list.pending')}
          </StatusChip>
        </div>
      </div>
    </article>
  )
}
