import { useEffect } from 'react'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EventField, eventSelectTriggerClass } from '@/components/ui/event-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AssetForm } from '@/features/assets/model/assets-form'
import { useMembers } from '@/features/members/hooks/use-members'
import { currentMemberId } from '@/features/members/model/members.types'
import { useAuthStore } from '@/shared/stores/auth-store'

/**
 * Who is responsible for a money source. Extracted so the asset dialog and the
 * onboarding "money sources" step render the same field.
 */
export function AssetClassificationFields({
  form,
  defaultToCurrentMember = true,
}: {
  form: UseFormReturn<AssetForm>
  defaultToCurrentMember?: boolean
}) {
  const { t } = useTranslation()
  const { control, setValue } = form
  const { members } = useMembers()
  const userId = useAuthStore((state) => state.user?.id)
  const holderMemberId = useWatch({ control, name: 'holderMemberId' })
  const creatorMemberId = currentMemberId(members, userId)

  useEffect(() => {
    if (defaultToCurrentMember && !holderMemberId && creatorMemberId) {
      setValue('holderMemberId', creatorMemberId)
    }
  }, [creatorMemberId, defaultToCurrentMember, holderMemberId, setValue])

  return (
    <>
      <Controller
        control={control}
        name="holderMemberId"
        render={({ field }) => (
          <EventField label={t('assets.form.holder')}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={eventSelectTriggerClass}>
                <SelectValue placeholder={t('assets.form.holderPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {members.filter((member) => member.status === 'active').map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EventField>
        )}
      />
    </>
  )
}
