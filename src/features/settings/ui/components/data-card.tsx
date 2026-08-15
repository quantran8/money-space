import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'

export function DataCard() {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader title={t('settings.data.title')} meta={t('household.merged.householdData')} />

      <div className="mt-7 grid gap-3 lg:grid-cols-2">
        <div className="sunk flex min-h-[118px] flex-col justify-between p-4">
          <div>
            <p className="text-[13px] font-medium">{t('settings.data.export')}</p>
            <p className="mt-1.5 text-[11px] leading-5 text-ink2">
              {t('settings.data.exportDescription')}
            </p>
          </div>
          <button type="button" className="mt-4 flex w-fit items-center gap-2 text-[12px] font-medium text-accent">
            <Download className="size-4" />
            {t('settings.data.exportAction')}
          </button>
        </div>

        <div className="sunk flex min-h-[118px] flex-col justify-between p-4">
          <div>
            <p className="text-[13px] font-medium">{t('household.merged.sharingTitle')}</p>
            <p className="mt-1.5 text-[11px] leading-5 text-ink2">
              {t('household.merged.sharingDescription')}
            </p>
          </div>
          <Link to="/networth" className="mt-4 w-fit text-[12px] font-medium text-accent">
            {t('household.merged.viewSources')}
          </Link>
        </div>
      </div>

    </Panel>
  )
}
