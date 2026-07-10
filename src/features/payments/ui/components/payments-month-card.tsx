import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'

type PaymentsMonthCardProps = {
  next30Amount: string
  discuss: number
}

export function PaymentsMonthCard({ next30Amount, discuss }: PaymentsMonthCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {t('payments.month.eyebrow')}
      </p>
      <h2 className="section-title mt-1 text-xl font-semibold">
        {t('payments.month.title')}
      </h2>
      <div className="mt-5 space-y-3">
        <div className="surface-muted flex items-center justify-between rounded-3xl p-4">
          <div>
            <p className="text-sm font-semibold">{t('payments.month.totalNeed')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {t('payments.month.totalNeedHint')}
            </p>
          </div>
          <p className="money-number text-xl font-semibold">{next30Amount}</p>
        </div>
        <div className="surface-muted flex items-center justify-between rounded-3xl p-4">
          <div>
            <p className="text-sm font-semibold">{t('payments.month.discuss')}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {t('payments.month.discussHint')}
            </p>
          </div>
          <p className="money-number text-xl font-semibold">{discuss}</p>
        </div>
      </div>
    </Card>
  )
}
