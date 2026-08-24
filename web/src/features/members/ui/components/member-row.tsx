import { LogOut, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { StatusChip } from '@/components/ui/status-chip'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'

type MemberRowProps = {
  member: MemberItem
  /** How many money sources this person is responsible for. */
  holdsCount: number
  /** True for whoever created the household; that row has no exit at all. */
  isOwner: boolean
  /** True when this row is the signed-in member — the only row they can act on. */
  isSelf: boolean
  /** True when the signed-in member created the household. */
  canRemoveOthers: boolean
  onRemove: (memberId: string) => void
}

/**
 * One person in the household.
 *
 * This used to be a permissions row: two Selects for role and access level,
 * with the owner's hard-coded as read-only. None of that exists any more —
 * both partners have the same rights, so there is nothing here to grant.
 *
 * What replaces it is the question the product actually cares about: not "who
 * is allowed what" but "who is responsible for what".
 *
 * The one action left is the way out, and which way out depends on who is
 * looking. The creator's row has none — the backend refuses to delete it,
 * because the household's guard resolves against that row. Anyone else sees
 * "leave" on their own row and nothing on the other person's: taking a partner
 * out of the shared picture is the creator's call, not something either of them
 * can do to the other.
 */
export function MemberRow({
  member,
  holdsCount,
  isOwner,
  isSelf,
  canRemoveOthers,
  onRemove,
}: MemberRowProps) {
  const { t } = useTranslation()
  const exit = isOwner ? 'none' : isSelf ? 'leave' : canRemoveOthers ? 'remove' : 'none'

  return (
    <article className="rounded-control px-3 py-3 transition-colors hover:bg-wash sm:px-4">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-wash text-[12px] font-medium">
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
          {holdsCount > 0 ? (
            <p className="text-[12px] text-ink2">
              {t('members.list.holdsSources', { count: holdsCount })}
            </p>
          ) : null}
          <StatusChip tone={member.status === 'active' ? 'accent' : 'attention'}>
            {member.status === 'active'
              ? t('members.list.active')
              : t('members.list.pending')}
          </StatusChip>
          {member.status === 'active' && exit !== 'none' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-alert hover:bg-alert-tint hover:text-alert"
              onClick={() => onRemove(member.id)}
              aria-label={
                exit === 'leave'
                  ? t('members.list.leave')
                  : t('common.confirmDelete.description', {
                      name: member.name || member.email,
                    })
              }
            >
              {exit === 'leave' ? (
                <LogOut className="size-3.5" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              {exit === 'leave' ? t('members.list.leave') : t('common.remove')}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
