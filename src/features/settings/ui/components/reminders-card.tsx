import { Bell } from 'lucide-react'
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
  )
}
