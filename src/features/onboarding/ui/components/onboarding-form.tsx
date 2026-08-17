import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/shared/lib/utils'
import { currencyOptions, type OnboardingForm as OnboardingFormValues } from '@/features/onboarding/model/onboarding-form'

type OnboardingFormProps = {
  form: UseFormReturn<OnboardingFormValues>
  isCreating: boolean
  onSubmit: () => void
}

/**
 * One field, and everything else folded away.
 *
 * The name is the only answer that cannot be guessed. The currency defaults to
 * VND and is changed by a rounding error of households, so it lives behind
 * "Tuỳ chọn" rather than doubling the length of the only screen standing
 * between the user and the app.
 */
export function OnboardingForm({ form, isCreating, onSubmit }: OnboardingFormProps) {
  const { t } = useTranslation()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const {
    control,
    register,
    formState: { errors },
  } = form

  return (
    <div>
      <h1 className="page-title text-[31px] leading-[1.2] sm:text-[38px]">
        {t('onboarding.form.title')}
      </h1>

      <form className="mt-8" onSubmit={onSubmit} noValidate>
        <label htmlFor="household-name" className="mb-2 block text-[13px] text-ink2">
          {t('onboarding.form.nameLabel')}
        </label>
        <Input
          id="household-name"
          maxLength={40}
          placeholder={t('onboarding.form.namePlaceholder')}
          autoComplete="off"
          aria-invalid={!!errors.name}
          className="text-base"
          {...register('name')}
        />
        {errors.name?.message ? (
          <p className="mt-2 text-[12px] font-medium text-alert">{errors.name.message}</p>
        ) : null}

        <button
          type="button"
          onClick={() => setOptionsOpen((open) => !open)}
          aria-expanded={optionsOpen}
          aria-controls="onboarding-options"
          className="mt-4 flex min-h-11 items-center gap-2 rounded-control text-[13px] font-medium text-accent"
        >
          {t('onboarding.form.options')}
          <ChevronDown
            className={cn('size-4 transition-transform', optionsOpen && 'rotate-180')}
            strokeWidth={1.8}
            aria-hidden
          />
        </button>

        {optionsOpen ? (
          <div id="onboarding-options" className="mt-2">
            <label className="mb-2 block text-[13px] text-ink2" id="onboarding-currency-label">
              {t('onboarding.form.currencyLabel')}
            </label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-labelledby="onboarding-currency-label">
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
          </div>
        ) : null}

        {/* Stays enabled with the field empty (design.md §22.10): clicking is how
            the user finds out what is missing, and a dead button says nothing. */}
        <div className="mt-8 flex justify-end">
          <Button type="submit" className="h-11 px-[18px] text-[14px]" disabled={isCreating}>
            {isCreating ? t('onboarding.form.submitting') : t('onboarding.form.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
