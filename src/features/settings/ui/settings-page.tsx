import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Database, Download, Home, Save, Shield } from 'lucide-react'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import { Switch } from '@/components/ui/switch'
import { useMembers } from '@/features/members/hooks/use-members'
import { supportedLanguages } from '@/i18n/config'
import type { AppLanguage } from '@/i18n/config'
import { localizedRequiredText } from '@/shared/lib/validation'

type SharingLevel = 'overview' | 'grouped' | 'detailed'

type Settings = {
  householdName: string
  currency: 'VND' | 'USD' | 'EUR'
  updateFrequency: 'weekly' | 'biweekly' | 'monthly'
  language: AppLanguage
  reminderPayments: boolean
  reminderUpdate: boolean
  shareAssets: SharingLevel
  shareUpcoming: SharingLevel
  hidePrivateNotes: boolean
}

const sharingLevels: SharingLevel[] = ['overview', 'grouped', 'detailed']

function isCurrency(value: string): value is Settings['currency'] {
  return value === 'VND' || value === 'USD' || value === 'EUR'
}

function isFrequency(value: string): value is Settings['updateFrequency'] {
  return value === 'weekly' || value === 'biweekly' || value === 'monthly'
}

export function SettingsPage() {
  const { i18n, t } = useTranslation()
  const { household } = useMembers()
  const safeHousehold = household ?? {
    name: '',
    currency: 'VND',
    updateFrequency: 'weekly',
    createdAt: '',
  }
  const settingsSchema = useMemo(
    () =>
      z.object({
        householdName: localizedRequiredText(t, t('settings.household.name'), 60),
        currency: z.enum(['VND', 'USD', 'EUR']),
        updateFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
        language: z.enum(supportedLanguages),
        reminderPayments: z.boolean(),
        reminderUpdate: z.boolean(),
        shareAssets: z.enum(['overview', 'grouped', 'detailed']),
        shareUpcoming: z.enum(['overview', 'grouped', 'detailed']),
        hidePrivateNotes: z.boolean(),
      }),
    [t],
  )
  const initialSettings: Settings = {
    householdName: safeHousehold.name,
    currency: isCurrency(safeHousehold.currency) ? safeHousehold.currency : 'VND',
    updateFrequency: isFrequency(safeHousehold.updateFrequency) ? safeHousehold.updateFrequency : 'weekly',
    language: i18n.resolvedLanguage === 'en' ? 'en' : 'vi',
    reminderPayments: true,
    reminderUpdate: true,
    shareAssets: 'grouped',
    shareUpcoming: 'detailed',
    hidePrivateNotes: true,
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
    mode: 'onChange',
  })

  function handleSave(values: Settings) {
    void i18n.changeLanguage(values.language)
    // Re-baseline the form so it reflects the saved state.
    reset(values)
    toast.success(t('settings.header.saved'))
  }

  const shareAssets = watch('shareAssets')
  const updateFrequency = watch('updateFrequency')

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

      <SummaryStrip className="sm:grid-cols-3 xl:grid-cols-3">
        <SummaryTile
          label={t('settings.strip.household')}
          value={<span className="section-title text-2xl">{safeHousehold.name}</span>}
        />
        <SummaryTile
          label={t('settings.strip.rhythm')}
          value={
            <span className="section-title text-2xl">
              {t(`options.frequency.${updateFrequency}`)}
            </span>
          }
        />
        <SummaryTile
          label={t('settings.strip.sharing')}
          value={
            <span className="section-title text-2xl">{t(`options.sharing.${shareAssets}`)}</span>
          }
          inverted
        />
      </SummaryStrip>

      <form
        id="settings-form"
        className="grid gap-4 lg:grid-cols-12"
        onSubmit={handleSubmit(handleSave)}
        noValidate
      >
        <div className="space-y-4 lg:col-span-7">
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
                {t('settings.household.createdAt', { date: safeHousehold.createdAt })}
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('settings.privacy.eyebrow')}
                </p>
                <h2 className="section-title mt-1 text-2xl font-semibold">
                  {t('settings.privacy.title')}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  {t('settings.privacy.description')}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-[hsla(var(--status-green),0.12)]">
                <Shield className="size-5 text-[hsl(var(--status-green))]" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-4 rounded-3xl surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{t('settings.privacy.assetsTitle')}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {t('settings.privacy.assetsDescription')}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="shareAssets"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="sm:w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sharingLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {t(`options.sharing.${level}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-4 rounded-3xl surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{t('settings.privacy.upcomingTitle')}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {t('settings.privacy.upcomingDescription')}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="shareUpcoming"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="sm:w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sharingLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {t(`options.sharing.${level}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-3xl surface-muted p-4">
                <div>
                  <p className="font-medium">{t('settings.privacy.notesTitle')}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {t('settings.privacy.notesDescription')}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="hidePrivateNotes"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('settings.reminders.eyebrow')}
                </p>
                <h2 className="section-title mt-1 text-2xl font-semibold">
                  {t('settings.reminders.title')}
                </h2>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)]">
                <Bell className="size-5 text-[hsl(var(--accent))]" />
              </div>
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
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('settings.data.eyebrow')}
                </p>
                <h2 className="section-title mt-1 text-xl font-semibold">
                  {t('settings.data.title')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  {t('settings.data.description')}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)]">
                <Database className="size-5 text-[hsl(var(--accent))]" />
              </div>
            </div>

            <div className="space-y-3">
              <Button type="button" variant="secondary" className="w-full">
                <Download className="mr-2 size-4" />
                {t('settings.data.export')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-[hsla(var(--status-red),0.3)] text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.06)]"
              >
                {t('settings.data.delete')}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
