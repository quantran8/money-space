import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import type { FlexibleMoneyResult } from '@/features/forecast/model/forecast.types'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * Home section 2 — Flexible Money (§26B).
 *
 * **Never labelled a spending allowance** (design §12.3). The number MAY BE
 * NEGATIVE and is never clamped: a negative figure means the obligations and
 * reserve already exceed what is usable, which is precisely what the household
 * needs to see.
 */
export function FlexibleMoneySection({
  flexibleMoney,
  isLoading,
}: {
  flexibleMoney?: FlexibleMoneyResult
  isLoading?: boolean
}) {
  const { t } = useTranslation()

  if (isLoading || !flexibleMoney) {
    return (
      <Card>
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </Card>
    )
  }

  const amount = flexibleMoney.flexibleMoneyHorizon
  const isNegative = amount < 0

  return (
    <Card>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {t('home.flexible.title')}
      </p>
      <p
        className={cn(
          'money-number mt-3 text-4xl font-semibold sm:text-5xl',
          isNegative && 'text-[hsl(var(--status-red))]',
        )}
      >
        {formatVndShort(amount)}
      </p>
      <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
        {isNegative
          ? t('home.flexible.negativeNote')
          : t('home.flexible.note', {
              horizon: flexibleMoney.horizonDays,
            })}
      </p>
    </Card>
  )
}
