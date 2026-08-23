import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { MemberItem } from '@money-space/core/features/members/model/members.types'

import { Button, RowMeta, StatusChip } from '@/components/ui'

/**
 * One person in the household.
 *
 * The web renders this as a two-column grid that folds at `lg`. On a phone
 * there is one column, so the row stacks: who they are, then what they are
 * responsible for, then the one action they have — and the action goes on its
 * own line rather than being squeezed beside a name, because a 44pt target
 * next to a truncating name is how both end up unusable.
 *
 * The row shows **responsibility, not permission**. There are no roles in this
 * product: the count of money sources someone looks after is the only
 * asymmetry worth rendering, and it is a fact about the money, not about them.
 *
 * Who gets an exit is decided the same way the web decides it, and it is a
 * backend fact rather than a style choice: the creator's row is what the
 * household guard resolves against, so `DELETE /members/:id` refuses it — an
 * action offered there could only ever produce an error. Everyone else gets
 * one door and it is their own. Taking the other person out of the shared
 * picture is the creator's call, never something either partner can do to the
 * other.
 */
export function MemberRow({
  member,
  holdsCount,
  isOwner,
  isSelf,
  canRemoveOthers,
  onRemove,
}: {
  member: MemberItem
  /** How many money sources this person is responsible for. */
  holdsCount: number
  /** True for whoever created the household; that row has no exit at all. */
  isOwner: boolean
  /** True when this row is the signed-in person. */
  isSelf: boolean
  /** True when the signed-in person created the household. */
  canRemoveOthers: boolean
  onRemove: (memberId: string) => void
}) {
  const { t } = useTranslation()

  const exit = isOwner ? 'none' : isSelf ? 'leave' : canRemoveOthers ? 'remove' : 'none'
  const active = member.status === 'active'

  return (
    <View className="rounded-sunk px-1 py-3">
      <View className="flex-row items-center gap-3">
        {/* Initials are ASCII by construction (core strips the diacritics), so
            the mono face is safe here — and correct: this is metadata. */}
        <View className="h-10 w-10 items-center justify-center rounded-full bg-sunk">
          <Text className="font-mono text-[12px] font-medium text-ink2">{member.initials}</Text>
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-medium text-ink" numberOfLines={1}>
            {member.name || member.email}
          </Text>
          {member.email && member.name ? (
            <Text className="mt-0.5 font-mono text-[11px] text-ink3" numberOfLines={1}>
              {member.email}
            </Text>
          ) : null}
        </View>

        <StatusChip
          tone={active ? 'interactive' : 'attention'}
          label={active ? t('members.list.active') : t('members.list.pending')}
        />
      </View>

      {holdsCount > 0 ? (
        <View className="ml-[52px] mt-1.5">
          <RowMeta>{t('members.list.holdsSources', { count: holdsCount })}</RowMeta>
        </View>
      ) : null}

      {active && exit !== 'none' ? (
        <Button
          className="ml-[44px] mt-1 self-start px-2"
          variant="destructive"
          onPress={() => onRemove(member.id)}
        >
          {exit === 'leave' ? t('members.list.leave') : t('common.remove')}
        </Button>
      ) : null}
    </View>
  )
}
