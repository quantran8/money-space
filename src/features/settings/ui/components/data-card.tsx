import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function DataCard() {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="mb-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('settings.data.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-xl font-semibold">
            {t('settings.data.title')}
          </h2>
      </div>

      <div className="divide-y divide-border">
        <div className="flex flex-col gap-4 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{t('settings.data.export')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('settings.data.exportDescription')}
            </p>
          </div>
          <Button type="button" variant="outline">
            <Download className="mr-2 size-4" />
            {t('settings.data.exportAction')}
          </Button>
        </div>
        <div className="flex flex-col gap-4 py-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{t('settings.data.delete')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('settings.data.deleteDescription')}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-[hsla(var(--status-red),0.3)] text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.06)]"
          >
            {t('settings.data.deleteAction')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
