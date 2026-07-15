import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { Settings } from '@/features/settings/model/settings-form'

type RemindersCardProps = {
  form: UseFormReturn<Settings>
}

export function RemindersCard({ form }: RemindersCardProps) {
  const { t } = useTranslation()
  const { control } = form

  return (
    <Card>
      <div className="mb-5">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('settings.reminders.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-xl font-semibold">
            {t('settings.reminders.title')}
          </h2>
      </div>

      <div className="divide-y divide-border">
        <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
          <div>
            <p className="text-sm font-medium">{t('settings.reminders.upcomingTitle')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
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

        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-medium">{t('settings.reminders.updatesTitle')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
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

        <div className="flex items-center justify-between gap-4 py-4 pb-0">
          <div>
            <p className="text-sm font-medium">{t('settings.reminders.accessTitle')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {t('settings.reminders.accessDescription')}
            </p>
          </div>
          <Controller
            control={control}
            name="reminderAccess"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>
    </Card>
  )
}
