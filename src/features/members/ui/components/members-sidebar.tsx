import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InviteForm } from '@/features/members/model/members-form'
import type { PermissionLevel } from '@/features/members/model/members'

type MembersSidebarProps = {
  permissionLabels: Record<PermissionLevel, string>
  form: UseFormReturn<InviteForm>
  isSubmitting: boolean
  onSubmit: () => void
}

export function MembersSidebar({
  permissionLabels,
  form,
  isSubmitting,
  onSubmit,
}: MembersSidebarProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors, isValid },
  } = form

  return (
    <aside className="space-y-4 xl:col-span-4">
      <Card>
        <p className="text-sm text-muted-foreground">{t('members.quickInvite.eyebrow')}</p>
        <h2 className="section-title mt-1 text-xl font-semibold">
          {t('members.quickInvite.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('members.invite.helperShort')}
        </p>

        <div className="mt-5 space-y-4">
          <FormField label={t('members.invite.email')} error={errors.email?.message}>
            <Input
              type="email"
              className="rounded-xl bg-muted/45"
              placeholder={t('members.invite.emailPlaceholder')}
              {...register('email')}
            />
          </FormField>
          <FormField label={t('members.invite.role')} error={errors.role?.message}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl bg-muted/45">
                    <SelectValue placeholder={t('members.invite.rolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner">{t('options.role.partner')}</SelectItem>
                    <SelectItem value="viewer">{t('options.role.viewer')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <Button type="button" className="w-full" disabled={!isValid || isSubmitting} onClick={onSubmit}>
            {isSubmitting ? t('members.invite.submitting') : t('members.invite.submit')}
          </Button>
        </div>
      </Card>

      <Card>
        <p className="text-sm text-muted-foreground">{t('members.permissionLevels.eyebrow')}</p>
        <h2 className="section-title mt-1 text-xl font-semibold">
          {t('members.permissionLevels.title')}
        </h2>

        <div className="mt-5 divide-y divide-border">
          {(Object.keys(permissionLabels) as PermissionLevel[]).map((level) => (
            <div key={level} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium">{permissionLabels[level]}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`members.permissionLevels.${level}`)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  )
}
