import { useEffect } from 'react'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Field, fieldControlReset, fieldShell } from '@/components/ui/form-22'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AssetForm } from '@money-space/core/features/assets/model/assets-form'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { currentMemberId } from '@money-space/core/features/members/model/members.types'
import { useAuthStore } from '@money-space/core/shared/stores/auth-store'

/**
 * Who is RESPONSIBLE for a money source — never who spent from it (§0.2, §16.4).
 *
 * Built from the §22 field kit (`Field` + `fieldShell`), like every other field
 * in the asset dialog. It used to use `EventField`, which put a mono uppercase
 * `.label` inside a taller sunk block — so this one row sat at a different
 * height, with a different label case and a different control size, from the
 * fields directly above it. §22.4 names that label style specifically as the
 * thing a form must not use.
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
    <Controller
      control={control}
      name="holderMemberId"
      render={({ field }) => (
        <Field label={t('assets.form.holder')}>
          <div className={fieldShell}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={fieldControlReset}>
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
          </div>
        </Field>
      )}
    />
  )
}
