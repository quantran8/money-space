import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { MemberItem } from '@money-space/core/features/members/model/members.types'

import { Button, EmptyState, Panel, PanelHeader, Skeleton } from '@/components/ui'
import { MemberRow } from '@/features/members/ui/member-row'

/**
 * Who is in the household.
 *
 * A one-person household gets the invite as a full-width prompt rather than a
 * small header action: forming the couple IS the product at that moment, and
 * burying the only way to do it behind a 13px link in a header makes a solo
 * household a dead end. Once there are two people the prompt has done its job
 * and the action shrinks back into the header.
 */
export function MembersSection({
  members,
  isLoading,
  invitedCount,
  holdsByMember,
  ownerMemberId,
  viewerMemberId,
  isViewerOwner,
  onInvite,
  onRemoveMember,
}: {
  members: MemberItem[]
  isLoading: boolean
  invitedCount: number
  /** Money sources each member is responsible for, keyed by member id. */
  holdsByMember: Record<string, number>
  /** Member id of whoever created the household; that row cannot be removed. */
  ownerMemberId?: string
  /** Member id of the signed-in person. */
  viewerMemberId?: string
  /** True when the signed-in person created the household. */
  isViewerOwner: boolean
  onInvite: () => void
  onRemoveMember: (memberId: string) => void
}) {
  const { t } = useTranslation()

  const isSolo = !isLoading && members.length < 2

  return (
    <Panel>
      <PanelHeader
        title={t('household.merged.membersTitle')}
        right={
          !isLoading && !isSolo ? (
            <Button variant="ghost" className="-mr-2 px-2" onPress={onInvite}>
              {t('members.invite.action')}
            </Button>
          ) : members.length > 0 ? (
            <Text className="font-mono t-caption-sm text-ink3">
              {t('members.list.count', { count: members.length })}
            </Text>
          ) : undefined
        }
      />

      {isLoading ? (
        <View className="mt-5 gap-2">
          <Skeleton height={56} className="rounded-control" />
          <Skeleton height={56} className="rounded-control" />
        </View>
      ) : members.length === 0 ? (
        <EmptyState
          className="mt-5"
          message={t('members.list.soloPrompt')}
          action={t('members.invite.action')}
          onAction={onInvite}
        />
      ) : (
        <View className="mt-4">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              holdsCount={holdsByMember[member.id] ?? 0}
              isOwner={member.id === ownerMemberId}
              isSelf={member.id === viewerMemberId}
              canRemoveOthers={isViewerOwner}
              onRemove={onRemoveMember}
            />
          ))}
        </View>
      )}

      {isSolo && members.length > 0 ? (
        <View className="mt-4 rounded-control bg-wash p-4">
          <Text className="t-body-sm leading-5 text-ink2">{t('members.list.soloPrompt')}</Text>
          <Button className="mt-3" onPress={onInvite}>
            {t('members.invite.action')}
          </Button>
        </View>
      ) : invitedCount > 0 ? (
        <View className="mt-4 rounded-control bg-wash px-4 py-3">
          <Text className="t-caption leading-5 text-ink2">
            {t('members.list.invitedCount', { count: invitedCount })}
          </Text>
        </View>
      ) : null}
    </Panel>
  )
}
