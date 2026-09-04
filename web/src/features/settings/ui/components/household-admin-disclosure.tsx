import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/form-22'
import { Panel } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'

type HouseholdAdminDisclosureProps = {
  members: MemberItem[]
  onInvite: () => void
  onRemoveMember: (memberId: string) => void
  onDeleteHousehold: () => void
}

/**
 * The three operations that are not about money.
 *
 * Everything else in the app is open to both partners, because what makes a
 * change accountable is the journal entry it leaves. These three are different:
 * each either cannot be undone or changes who is in the room, so each is
 * restricted to whoever created the household — and each is kept out of the
 * everyday view, because a shared finance app should not greet you with a
 * delete button.
 *
 * Collapsed by default, using the same `Disclosure` the asset form uses for its
 * secondary fields, and speaking the danger-zone visual language already
 * established in `data-card.tsx` (whose delete row this absorbs, so the
 * operation lives in exactly one place).
 */
export function HouseholdAdminDisclosure({
  members,
  onInvite,
  onRemoveMember,
  onDeleteHousehold,
}: HouseholdAdminDisclosureProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')

  const removable = members.filter((member) => member.status !== 'invited')

  return (
    <Panel>
      <Disclosure
        open={open}
        onToggle={() => setOpen((value) => !value)}
        label={t('household.admin.toggle')}
      >
        <div className="mt-5 space-y-3">
          <AdminRow
            title={t('household.admin.invite.title')}
            description={t('household.admin.invite.description')}
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={onInvite}
            >
              {t('members.invite.action')}
            </Button>
          </AdminRow>

          <AdminRow
            title={t('household.admin.removeMember.title')}
            description={t('household.admin.removeMember.description')}
          >
            <div className="flex shrink-0 items-center gap-2">
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="h-9 min-w-[160px] t-caption">
                  <SelectValue placeholder={t('household.admin.removeMember.pick')} />
                </SelectTrigger>
                <SelectContent>
                  {removable.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!selectedMemberId}
                className="bg-card text-alert-ink hover:bg-alert-tint hover:text-alert-ink"
                onClick={() => selectedMemberId && onRemoveMember(selectedMemberId)}
              >
                {t('common.remove')}
              </Button>
            </div>
          </AdminRow>

          <div className="pt-2">
            <p className="label text-alert-ink">{t('common.dangerZone')}</p>
            <div className="mt-3">
              <AdminRow
                title={t('settings.data.delete')}
                description={t('settings.data.deleteDescription')}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 bg-card text-alert-ink hover:bg-alert-tint hover:text-alert-ink"
                  onClick={onDeleteHousehold}
                >
                  {t('settings.data.deleteAction')}
                </Button>
              </AdminRow>
            </div>
          </div>
        </div>
      </Disclosure>
    </Panel>
  )
}

function AdminRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="sunk flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="t-body-sm font-medium">{title}</p>
        <p className="mt-1 t-caption-sm leading-5 text-ink2">{description}</p>
      </div>
      {children}
    </div>
  )
}
