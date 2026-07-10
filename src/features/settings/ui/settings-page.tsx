import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { useSettingsPage } from '@/features/settings/hooks/use-settings-page'
import { DataCard } from '@/features/settings/ui/components/data-card'
import { HouseholdCard } from '@/features/settings/ui/components/household-card'
import { RemindersCard } from '@/features/settings/ui/components/reminders-card'
import { SettingsSummaryStrip } from '@/features/settings/ui/components/settings-summary-strip'
import { SharingCard } from '@/features/settings/ui/components/sharing-card'

export function SettingsPage() {
  const { t } = useTranslation()
  const { safeHousehold, shareAssets, updateFrequency, form, isValid, submit } = useSettingsPage()

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

      <SettingsSummaryStrip
        householdName={safeHousehold.name}
        updateFrequency={updateFrequency}
        shareAssets={shareAssets}
      />

      <form id="settings-form" className="grid gap-4 lg:grid-cols-12" onSubmit={submit} noValidate>
        <div className="space-y-4 lg:col-span-7">
          <HouseholdCard form={form} createdAt={safeHousehold.createdAt} />
          <SharingCard form={form} />
        </div>

        <div className="space-y-4 lg:col-span-5">
          <RemindersCard form={form} />
          <DataCard />
        </div>
      </form>
    </div>
  )
}
