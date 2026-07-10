import { Shield } from 'lucide-react'
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
  )
}
