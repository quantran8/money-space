import { Mail } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InviteForm } from '@/features/members/model/members-form'

type InviteFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<InviteForm>
  isSubmitting: boolean
  onSubmit: () => void
}

export function InviteFormDialog({
  open,
  onOpenChange,
  form,
  isSubmitting,
  onSubmit,
}: InviteFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors, isValid },
  } = form

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('members.invite.title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t('members.invite.eyebrow')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <FormField label={t('members.invite.email')} error={errors.email?.message}>
            <Input
              type="email"
              placeholder={t('members.invite.emailPlaceholder')}
              aria-invalid={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <FormField label={t('members.invite.role')} error={errors.role?.message}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.role}>
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

          <div className="surface-muted rounded-3xl p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('members.invite.helper')}
          </div>

          <ResponsiveDialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              <Mail className="mr-2 size-4" />
              {isSubmitting ? 'Dang gui...' : t('members.invite.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
