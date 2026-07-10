import { useTranslation } from 'react-i18next'

import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import type { Settings } from '@/features/settings/model/settings-form'

type SettingsSummaryStripProps = {
  householdName: string
  updateFrequency: Settings['updateFrequency']
  shareAssets: Settings['shareAssets']
}

export function SettingsSummaryStrip({
  householdName,
  updateFrequency,
  shareAssets,
}: SettingsSummaryStripProps) {
  const { t } = useTranslation()
  return (
    <SummaryStrip className="sm:grid-cols-3 xl:grid-cols-3">
      <SummaryTile
        label={t('settings.strip.household')}
        value={<span className="section-title text-2xl">{householdName}</span>}
      />
      <SummaryTile
        label={t('settings.strip.rhythm')}
        value={
          <span className="section-title text-2xl">
            {t(`options.frequency.${updateFrequency}`)}
          </span>
        }
      />
      <SummaryTile
        label={t('settings.strip.sharing')}
        value={
          <span className="section-title text-2xl">{t(`options.sharing.${shareAssets}`)}</span>
        }
        inverted
      />
    </SummaryStrip>
  )
}
