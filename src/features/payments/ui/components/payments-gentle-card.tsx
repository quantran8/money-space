import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'

export function PaymentsGentleCard() {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)]">
          <ShieldCheck className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-semibold">{t('payments.gentle.title')}</p>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('payments.gentle.description')}
          </p>
        </div>
      </div>
    </Card>
  )
}
