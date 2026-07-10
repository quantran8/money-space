import { Database, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function DataCard() {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('settings.data.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-xl font-semibold">
            {t('settings.data.title')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('settings.data.description')}
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)]">
          <Database className="size-5 text-[hsl(var(--accent))]" />
        </div>
      </div>

      <div className="space-y-3">
        <Button type="button" variant="secondary" className="w-full">
          <Download className="mr-2 size-4" />
          {t('settings.data.export')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full border-[hsla(var(--status-red),0.3)] text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.06)]"
        >
          {t('settings.data.delete')}
        </Button>
      </div>
    </Card>
  )
}
