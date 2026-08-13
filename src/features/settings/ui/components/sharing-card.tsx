import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
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
    <Panel>
      <PanelHeader title={t('settings.privacy.title')} meta={t('household.merged.newDataOnly')} />

      <div className="mt-7 space-y-1">
        <div className="rounded-sunk px-3 py-3 transition-colors hover:bg-sunk sm:grid sm:grid-cols-[1fr_260px] sm:items-center sm:gap-6 sm:px-4">
          <div>
            <p className="text-[13px] font-medium">{t('settings.privacy.assetsTitle')}</p>
            <p className="mt-1 text-[11px] leading-5 text-ink2">
              {t('settings.privacy.assetsDescription')}
            </p>
          </div>
          <Controller
            control={control}
            name="shareAssets"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-3 h-10 text-[12px] sm:mt-0">
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

        <div className="rounded-sunk px-3 py-3 transition-colors hover:bg-sunk sm:grid sm:grid-cols-[1fr_260px] sm:items-center sm:gap-6 sm:px-4">
          <div>
            <p className="text-[13px] font-medium">{t('settings.privacy.upcomingTitle')}</p>
            <p className="mt-1 text-[11px] leading-5 text-ink2">
              {t('settings.privacy.upcomingDescription')}
            </p>
          </div>
          <Controller
            control={control}
            name="shareUpcoming"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-3 h-10 text-[12px] sm:mt-0">
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

        <div className="flex items-center justify-between gap-4 rounded-sunk px-3 py-3 transition-colors hover:bg-sunk sm:px-4">
          <div>
            <p className="text-[13px] font-medium">{t('settings.privacy.notesTitle')}</p>
            <p className="mt-1 text-[11px] leading-5 text-ink2">
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
    </Panel>
  )
}
