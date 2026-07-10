import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'

export function GentleReminderCard() {
  const { t } = useTranslation()
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)]">
          <Info className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-semibold">{t('goals.gentle.title')}</h3>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('goals.gentle.description')}
          </p>
        </div>
      </div>
    </Card>
  )
}
