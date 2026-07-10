import { useTranslation } from 'react-i18next'

import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'

type PaymentsSummaryStripProps = {
  next7: number
  next30: number
  discuss: number
  total: string
}

export function PaymentsSummaryStrip({
  next7,
  next30,
  discuss,
  total,
}: PaymentsSummaryStripProps) {
  const { t } = useTranslation()
  return (
    <SummaryStrip>
      <SummaryTile
        label={t('payments.strip.next7')}
        value={t('payments.list.countLabel', { count: next7 })}
        dotColor="hsl(var(--status-orange))"
      />
      <SummaryTile
        label={t('payments.strip.next30')}
        value={t('payments.list.countLabel', { count: next30 })}
        dotColor="hsl(var(--status-blue))"
      />
      <SummaryTile
        label={t('payments.strip.discuss')}
        value={t('payments.list.countLabel', { count: discuss })}
        dotColor="hsl(var(--status-green))"
      />
      <SummaryTile label={t('payments.strip.total')} value={total} inverted />
    </SummaryStrip>
  )
}
