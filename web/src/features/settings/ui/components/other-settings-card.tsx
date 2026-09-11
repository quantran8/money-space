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
import type { Settings } from '@money-space/core/features/settings/model/settings-form'

type OtherSettingsCardProps = {
  form: UseFormReturn<Settings>
}

/**
 * The two space-wide preferences. Saving lives beside the page title — see
 * `SettingsPage`.
 */
export function OtherSettingsCard({ form }: OtherSettingsCardProps) {
  const { t } = useTranslation()
  const { control } = form

  return (
    <Panel>
      <PanelHeader title={t('settings.other.title')} />

      <div className="s-head-body grid gap-3 sm:grid-cols-2">
        <Field label={t('settings.household.currency')} htmlFor="settings-currency">
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="settings-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VND">{t('options.currency.VND')}</SelectItem>
                  <SelectItem value="USD">{t('options.currency.USD')}</SelectItem>
                  <SelectItem value="EUR">{t('options.currency.EUR')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label={t('settings.household.language')} htmlFor="settings-language">
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="settings-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">{t('options.language.vi')}</SelectItem>
                  <SelectItem value="en">{t('options.language.en')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
    </Panel>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block t-caption font-medium text-ink2">
        {label}
      </label>
      {children}
    </div>
  )
}
