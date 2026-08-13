import { RefreshCw, Save } from 'lucide-react'
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
import { useAssets } from '@/features/assets/hooks/use-assets'
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
  const { assets, isLoading: isAssetsLoading } = useAssets()
  const { freshness, isLoading: isFreshnessLoading, confirmUnchanged } = useFreshness()
  const { control } = form
  const isLoading = isAssetsLoading || isFreshnessLoading
  const allFresh = freshness ? !freshness.needsAttention : false
  const staleIds = freshness?.items
    .filter((item) => item.state === 'stale')
    .map((item) => item.assetId) ?? []

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
          <p className="mt-3 text-[13px] leading-6 text-ink2">
            {t('household.merged.sourceSummary', {
              count: assets.length,
              freshness: allFresh
                ? t('household.merged.updatedThisWeek')
                : t('household.merged.needsUpdate', { count: freshness?.counts.stale ?? 0 }),
            })}
          </p>

          <div className="sunk mt-6 p-4">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {assets.length > 0
                ? assets.map((asset) => {
                    const state = freshness?.items.find((item) => item.assetId === asset.id)?.state
                    return (
                      <span
                        key={asset.id}
                        className={state === 'stale' ? 'h-1.5 flex-1 rounded-full bg-attention' : 'h-1.5 flex-1 rounded-full bg-ink'}
                      />
                    )
                  })
                : <span className="h-1.5 flex-1 rounded-full bg-hair" />}
            </div>
            <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-ink2">
                {allFresh
                  ? t('household.merged.coverageFresh', { count: assets.length })
                  : t('household.merged.coverageMixed', {
                      total: assets.length,
                      stale: freshness?.counts.stale ?? 0,
                    })}
              </p>
              {freshness?.needsAttention ? (
                <button
                  type="button"
                  disabled={confirmUnchanged.isPending}
                  onClick={() => confirmUnchanged.mutate(staleIds)}
                  className="flex shrink-0 items-center gap-1.5 text-left text-[12px] font-medium text-accent disabled:opacity-50"
                >
                  <RefreshCw className="size-3.5" />
                  {t('home.coverage.action')}
                </button>
              ) : null}
            </div>
          </div>
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
