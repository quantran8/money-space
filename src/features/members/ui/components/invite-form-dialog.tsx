import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { EventField, EventFieldInput } from '@/components/ui/event-field'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
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
    register,
    formState: { errors, isValid },
  } = form

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-ink2">
            {t('members.invite.eyebrow')}
          </p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {t('members.invite.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {t('members.invite.helper')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="mt-6 space-y-4 px-6 pb-6 sm:px-8 sm:pb-8" onSubmit={onSubmit} noValidate>
          <EventField label={t('members.invite.email')} error={errors.email?.message}>
            <EventFieldInput
              type="email"
              placeholder={t('members.invite.emailPlaceholder')}
              {...register('email')}
            />
          </EventField>


          <ResponsiveDialogFooter className="-mx-6 mt-2 border-t border-black/[0.06] px-6 pt-4 sm:-mx-8 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground hover:bg-sunk"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-[hsl(var(--accent))] px-6 text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {isSubmitting ? 'Đang gửi...' : t('members.invite.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
