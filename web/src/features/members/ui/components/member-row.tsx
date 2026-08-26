import { LogOut, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@money-space/core/shared/lib/utils'
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
 * can do to the other. It lives in an overflow menu rather than as a standing
 * red button, because a destructive action does not belong at rest in a row
 * whose job is to state a fact.
 *
 * `-mx-3 px-3` is what keeps the row FLUSH with the panel's content edge while
 * its hover band bleeds 12px past it on both sides. Padding alone would indent
 * every row from the heading above; padding added only on hover would shift the
 * text as the pointer arrives.
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
  const isActive = member.status === 'active'
  const displayName = member.name || member.email

  return (
    <article className="-mx-3 grid min-h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 rounded-control px-3 py-1 transition-colors hover:bg-canvas sm:grid-cols-[minmax(0,1fr)_auto_auto_44px]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-wash t-caption font-medium text-ink2">
          {member.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate t-body-sm font-medium">{member.name}</p>
          <p className="mt-0.5 truncate t-caption text-ink3">{member.email}</p>
        </div>
      </div>

      {/* Below `sm` the two facts drop under the name rather than squeezing
          four columns onto a phone. The indent is not a spacing step — it is
          the avatar (44) plus its gap (12), so the facts line up with the copy
          rather than with the row edge.

          A member with no sources keeps the empty cell from `sm` up, so status
          lands in the same column on every row; on a phone it is a blank line
          instead, so it is dropped there. */}
      <p className="num order-3 col-span-2 pl-[56px] t-caption text-ink3 empty:hidden sm:order-none sm:col-span-1 sm:whitespace-nowrap sm:pl-0 sm:empty:block">
        {holdsCount > 0 ? t('members.list.holdsSources', { count: holdsCount }) : null}
      </p>

      <p className="order-4 col-span-2 flex items-center gap-2 pl-[56px] t-body-sm text-ink2 sm:order-none sm:col-span-1 sm:whitespace-nowrap sm:pl-0">
        <span
          className={cn('size-1.5 shrink-0 rounded-full', isActive ? 'bg-positive' : 'bg-attention')}
        />
        {isActive ? t('members.list.active') : t('members.list.pending')}
      </p>

      {isActive && exit !== 'none' ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="justify-self-end text-ink2"
              aria-label={t('members.list.memberMenu', { name: displayName })}
            >
              <MoreHorizontal className="size-[18px]" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-alert focus:text-alert"
              onSelect={() => onRemove(member.id)}
            >
              {exit === 'leave' ? <LogOut className="size-4" /> : <Trash2 className="size-4" />}
              {exit === 'leave' ? t('members.list.leave') : t('common.remove')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Holds the column so every row's facts line up, whether or not the
        // row has a way out.
        <span className="hidden sm:block sm:size-11" aria-hidden />
      )}
    </article>
  )
}
