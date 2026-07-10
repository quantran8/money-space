import { ChevronRight } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InviteSection } from '@/features/onboarding/ui/components/invite-section'
import { OwnerNote } from '@/features/onboarding/ui/components/owner-note'
import { currencyOptions, type OnboardingForm as OnboardingFormValues } from '@/features/onboarding/model/onboarding-form'

type OnboardingFormProps = {
  form: UseFormReturn<OnboardingFormValues>
  isCreating: boolean
  onSubmit: () => void
}

export function OnboardingForm({ form, isCreating, onSubmit }: OnboardingFormProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors, isValid },
  } = form

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <p className="text-sm font-medium text-[hsl(var(--accent))]">
          {t('onboarding.form.eyebrow')}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          {t('onboarding.form.title')}
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-[hsl(var(--muted-foreground))]">
          {t('onboarding.form.description')}
        </p>
      </div>

      <form className="mt-8 space-y-7" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label>{t('onboarding.form.nameLabel')}</Label>
          <Input
            maxLength={40}
            placeholder={t('onboarding.form.namePlaceholder')}
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name?.message ? (
            <p className="text-xs font-medium text-[hsl(var(--status-red))]">
              {errors.name.message}
            </p>
          ) : (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {t('onboarding.form.nameHint')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('onboarding.form.currencyLabel')}</Label>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
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
          <p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            {t('onboarding.form.currencyHint')}
          </p>
        </div>

        <InviteSection
          register={register('inviteEmail')}
          error={errors.inviteEmail?.message}
          invalid={!!errors.inviteEmail}
        />

        <OwnerNote />

        <div className="flex flex-col-reverse gap-3 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            {t('onboarding.form.footerNote')}
          </p>
          <Button type="submit" size="lg" className="shrink-0" disabled={!isValid || isCreating}>
            {isCreating ? t('onboarding.form.submitting') : t('onboarding.form.submit')}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
