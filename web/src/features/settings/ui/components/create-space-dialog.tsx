import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Field, TextField } from '@/components/ui/form-22'
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
import { currencyOptions } from '@money-space/core/features/onboarding/model/onboarding-form'
import type { CreateSpace } from '@money-space/core/features/settings/hooks/use-create-space'

export function CreateSpaceDialog({ space }: { space: CreateSpace }) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors },
  } = space.form

  return (
    <ResponsiveDialog open={space.open} onOpenChange={space.onOpenChange}>
      <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-[460px]">
        <ResponsiveDialogHeader className="px-5 pb-4 pr-16 pt-5 text-left sm:px-8 sm:pr-16 sm:pt-7">
          <ResponsiveDialogTitle className="t-subhead font-medium tracking-[-0.015em]">
            {t('settings.spaces.create.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 t-body-sm text-ink3">
            {t('settings.spaces.create.description')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={(e) => void space.submit(e)} noValidate>
          <div className="space-y-4 px-5 pb-5 sm:px-8 sm:pb-7">
            <TextField
              id="space-name"
              label={t('onboarding.form.nameLabel')}
              placeholder={t('onboarding.form.namePlaceholder')}
              maxLength={40}
              autoComplete="off"
              error={errors.name?.message}
              {...register('name')}
            />
            <Field label={t('onboarding.form.currencyLabel')} htmlFor="space-currency">
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="space-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {t(`onboarding.currencies.${currency}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <ResponsiveDialogFooter fullBleed className="gap-2.5 px-5 py-3 sm:px-8">
            <Button type="submit" className="px-5" disabled={space.isCreating}>
              {space.isCreating ? t('onboarding.form.submitting') : t('settings.spaces.create.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
