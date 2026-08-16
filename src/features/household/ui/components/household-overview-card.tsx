import { Save } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useFreshness } from '@/features/freshness/hooks/use-freshness'
import type { Settings } from '@/features/settings/model/settings-form'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

type HouseholdOverviewCardProps = {
  form: UseFormReturn<Settings>
  isSaving: boolean
  onSave: () => void
}

export function HouseholdOverviewCard({
  form,
  isSaving,
  onSave,
}: HouseholdOverviewCardProps) {
  const { t } = useTranslation()
  const { activeHousehold } = useActiveHousehold()
  const { freshness, isLoading } = useFreshness()
  const { control } = form
  const allFresh = freshness ? !freshness.needsAttention : false

  return (
    <Panel>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-x-14">
        <div>
          {isLoading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <div className="flex items-center gap-2 text-[13px]">
              <span className={allFresh ? 'size-1.5 rounded-full bg-accent' : 'size-1.5 rounded-full bg-attention'} />
              {allFresh
                ? t('freshness.upToDate.title')
                : t('freshness.needsCheck.title')}
            </div>
          )}

          <p className="label mt-7">{t('household.merged.householdName')}</p>
          <p className="mt-2 text-[30px] font-medium tracking-[-.03em]">
            {activeHousehold?.name ?? t('shell.householdName')}
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="section-title text-[16px]">{t('household.merged.generalSettings')}</h2>
            <span className="font-mono text-[11px] text-ink3">
              {form.getValues('currency')} · {form.getValues('language').toUpperCase()}
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SettingSelect label={t('settings.household.currency')}>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-2 h-auto bg-transparent p-0 text-[13px] focus-visible:outline-none">
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
            </SettingSelect>
            <SettingSelect label={t('settings.household.language')}>
              <Controller
                control={control}
                name="language"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-2 h-auto bg-transparent p-0 text-[13px] focus-visible:outline-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">{t('options.language.vi')}</SelectItem>
                      <SelectItem value="en">{t('options.language.en')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </SettingSelect>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={onSave}
            >
              <Save className="size-4" />
              {t('settings.header.save')}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function SettingSelect({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sunk px-4 py-3.5">
      <p className="label">{label}</p>
      {children}
    </div>
  )
}
