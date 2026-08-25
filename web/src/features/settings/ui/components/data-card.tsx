import { Download, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'

type DataCardProps = {
  onDelete: () => void
}

export function DataCard({ onDelete }: DataCardProps) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader title={t('settings.data.title')} meta={t('household.merged.householdData')} />

      <div className="mt-7 grid gap-3 lg:grid-cols-2">
        <div className="sunk flex min-h-[118px] flex-col justify-between p-4">
          <div>
            <p className="t-body-sm font-medium">{t('settings.data.export')}</p>
            <p className="mt-1.5 t-caption-sm leading-5 text-ink2">
              {t('settings.data.exportDescription')}
            </p>
          </div>
          <button type="button" className="mt-4 flex w-fit items-center gap-2 t-caption font-medium text-action">
            <Download className="size-4" />
            {t('settings.data.exportAction')}
          </button>
        </div>

        <div className="sunk flex min-h-[118px] flex-col justify-between p-4">
          <div>
            <p className="t-body-sm font-medium">{t('settings.data.delete')}</p>
            <p className="mt-1.5 t-caption-sm leading-5 text-ink2">
              {t('settings.data.deleteDescription')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-4 w-fit bg-card text-alert hover:bg-alert-tint hover:text-alert"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            {t('settings.data.deleteAction')}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
