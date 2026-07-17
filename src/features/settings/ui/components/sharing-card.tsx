import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { sharingLevels, type Settings } from '@/features/settings/model/settings-form'

type SharingCardProps = {
  form: UseFormReturn<Settings>
}

export function SharingCard({ form }: SharingCardProps) {
  const { t } = useTranslation()
  const { control } = form

  return (
    <Card>
      <div className="mb-6">
        <h2 className="section-title text-xl font-semibold">
          {t('settings.privacy.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {t('settings.privacy.description')}
        </p>
      </div>

      <div className="divide-y divide-border">
        <div className="grid gap-4 py-5 first:pt-0 sm:grid-cols-[1fr_240px] sm:items-center">
          <div>
            <p className="text-sm font-medium">{t('settings.privacy.assetsTitle')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {t('settings.privacy.assetsDescription')}
            </p>
          </div>
          <Controller
            control={control}
            name="shareAssets"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-xl bg-muted/45">
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

        <div className="grid gap-4 py-5 sm:grid-cols-[1fr_240px] sm:items-center">
          <div>
            <p className="text-sm font-medium">{t('settings.privacy.upcomingTitle')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {t('settings.privacy.upcomingDescription')}
            </p>
          </div>
          <Controller
            control={control}
            name="shareUpcoming"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-xl bg-muted/45">
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

        <div className="flex items-center justify-between gap-4 py-5 pb-0">
          <div>
            <p className="text-sm font-medium">{t('settings.privacy.notesTitle')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
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
  )
}
