import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { useSettingsPage } from '@/features/settings/hooks/use-settings-page'
import { CategoriesCard } from '@/features/settings/ui/components/categories-card'
import { DataCard } from '@/features/settings/ui/components/data-card'
import { HouseholdCard } from '@/features/settings/ui/components/household-card'
import { RemindersCard } from '@/features/settings/ui/components/reminders-card'
import { SettingsSkeleton } from '@/features/settings/ui/components/settings-skeleton'
import { SharingCard } from '@/features/settings/ui/components/sharing-card'

export function SettingsPage() {
  const { t } = useTranslation()
  const { isLoading, form, isValid, isSaving, submit } = useSettingsPage()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('settings.header.eyebrow')}
        title={t('settings.header.title')}
        description={t('settings.header.description')}
        actions={
          <Button type="submit" form="settings-form" disabled={!isValid || isSaving}>
            <Save className="mr-2 size-4" />
            {t('settings.header.save')}
          </Button>
        }
      />

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <form
          id="settings-form"
          className="grid gap-4 xl:grid-cols-12"
          onSubmit={submit}
          noValidate
        >
          <div className="space-y-4 xl:col-span-8">
            <HouseholdCard form={form} />
            <SharingCard form={form} />
            <DataCard />
          </div>

          <div className="space-y-4 xl:col-span-4">
            <RemindersCard form={form} />
            <CategoriesCard />
          </div>
        </form>
      )}
    </div>
  )
}
