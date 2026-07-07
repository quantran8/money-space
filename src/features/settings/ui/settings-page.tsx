import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Home, Save, SlidersHorizontal } from 'lucide-react'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PageHeader } from '@/app/layout/page-header'
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
import { Switch } from '@/components/ui/switch'
import { useMembers } from '@/features/members/hooks/use-members'
import { supportedLanguages } from '@/i18n/config'
import type { AppLanguage } from '@/i18n/config'
import { localizedRequiredText } from '@/shared/lib/validation'

type Settings = {
  householdName: string
  currency: 'VND' | 'USD' | 'EUR'
  updateFrequency: 'weekly' | 'biweekly' | 'monthly'
  language: AppLanguage
  reminderPayments: boolean
  reminderUpdate: boolean
}

function isCurrency(value: string): value is Settings['currency'] {
  return value === 'VND' || value === 'USD' || value === 'EUR'
}

function isFrequency(value: string): value is Settings['updateFrequency'] {
  return value === 'weekly' || value === 'biweekly' || value === 'monthly'
}

export function SettingsPage() {
  const { i18n, t } = useTranslation()
  const { household } = useMembers()
  const settingsSchema = useMemo(
    () =>
      z.object({
        householdName: localizedRequiredText(t, t('settings.household.name'), 60),
        currency: z.enum(['VND', 'USD', 'EUR']),
        updateFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
        language: z.enum(supportedLanguages),
        reminderPayments: z.boolean(),
        reminderUpdate: z.boolean(),
      }),
    [t],
  )
  const initialSettings: Settings = {
    householdName: household.name,
    currency: isCurrency(household.currency) ? household.currency : 'VND',
    updateFrequency: isFrequency(household.updateFrequency) ? household.updateFrequency : 'weekly',
    language: i18n.resolvedLanguage === 'en' ? 'en' : 'vi',
    reminderPayments: true,
    reminderUpdate: true,
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitSuccessful, isDirty },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
    mode: 'onChange',
  })

  function handleSave(values: Settings) {
    void i18n.changeLanguage(values.language)
    // Re-baseline the form so isDirty/isSubmitSuccessful reflect the saved state.
    reset(values)
  }

  const saved = isSubmitSuccessful && !isDirty

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('settings.header.eyebrow')}
        title={t('settings.header.title')}
        description={t('settings.header.description')}
        actions={
          <Button type="submit" form="settings-form" disabled={!isValid}>
            <Save className="mr-2 size-4" />
            {t('settings.header.save')}
          </Button>
        }
      />

      {saved ? (
        <div className="rounded-3xl border border-[hsla(var(--status-green),0.3)] bg-[hsla(var(--status-green),0.08)] px-4 py-3 text-sm font-medium text-[hsl(var(--status-green))]">
          {t('settings.header.saved')}
        </div>
      ) : null}

      <form
        id="settings-form"
        className="grid gap-4 lg:grid-cols-12"
        onSubmit={handleSubmit(handleSave)}
        noValidate
      >
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('settings.household.eyebrow')}</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">{t('settings.household.title')}</h2>
            </div>
            <Home className="size-5 text-[hsl(var(--accent))]" />
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
              <FormField label={t('settings.household.frequency')} error={errors.updateFrequency?.message}>
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
                        <SelectItem value="biweekly">{t('options.frequency.biweekly')}</SelectItem>
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
              {t('settings.household.createdAt', { date: household.createdAt })}
            </div>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('settings.reminders.eyebrow')}</p>
                <h2 className="section-title mt-1 text-2xl font-semibold">{t('settings.reminders.title')}</h2>
              </div>
              <Bell className="size-5 text-[hsl(var(--accent))]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-3xl surface-muted p-4">
                <div>
                  <p className="font-medium">{t('settings.reminders.upcomingTitle')}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {t('settings.reminders.upcomingDescription')}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="reminderPayments"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-3xl surface-muted p-4">
                <div>
                  <p className="font-medium">{t('settings.reminders.updatesTitle')}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {t('settings.reminders.updatesDescription')}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="reminderUpdate"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-[hsl(var(--accent))]" />
              <h3 className="text-lg font-semibold">{t('settings.danger.title')}</h3>
            </div>
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {t('settings.danger.description')}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full border-[hsla(var(--status-red),0.3)] text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.06)]"
            >
              {t('settings.danger.action')}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
