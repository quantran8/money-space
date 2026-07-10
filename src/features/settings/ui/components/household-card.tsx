import { Home } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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
import type { Settings } from '@/features/settings/model/settings-form'

type HouseholdCardProps = {
  form: UseFormReturn<Settings>
  createdAt: string
}

export function HouseholdCard({ form, createdAt }: HouseholdCardProps) {
  const { t } = useTranslation()
  const {
    register,
    control,
    formState: { errors },
  } = form

  return (
    <Card>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('settings.household.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-2xl font-semibold">
            {t('settings.household.title')}
          </h2>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)]">
          <Home className="size-5 text-[hsl(var(--accent))]" />
        </div>
      </div>

      <div className="space-y-4">
        <FormField label={t('settings.household.name')} error={errors.householdName?.message}>
          <Input aria-invalid={!!errors.householdName} {...register('householdName')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label={t('settings.household.currency')} error={errors.currency?.message}>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.currency}>
                    <SelectValue placeholder={t('settings.household.currencyPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">{t('options.currency.VND')}</SelectItem>
                    <SelectItem value="USD">{t('options.currency.USD')}</SelectItem>
                    <SelectItem value="EUR">{t('options.currency.EUR')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField
            label={t('settings.household.frequency')}
            error={errors.updateFrequency?.message}
          >
            <Controller
              control={control}
              name="updateFrequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.updateFrequency}>
                    <SelectValue placeholder={t('settings.household.frequencyPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t('options.frequency.weekly')}</SelectItem>
                    <SelectItem value="biweekly">
                      {t('options.frequency.biweekly')}
                    </SelectItem>
                    <SelectItem value="monthly">{t('options.frequency.monthly')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label={t('settings.household.language')} error={errors.language?.message}>
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.language}>
                    <SelectValue placeholder={t('settings.household.languagePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">{t('options.language.vi')}</SelectItem>
                    <SelectItem value="en">{t('options.language.en')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>

        <div className="surface-muted rounded-3xl p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {t('settings.household.createdAt', { date: createdAt })}
        </div>
      </div>
    </Card>
  )
}
