import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import type {
  FinancialState,
  FinancialStateResult,
} from '@money-space/core/features/forecast/model/forecast.types'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Home section 1 — Financial State (§26D).
 *
 * `incomplete` means "not enough data to judge", NEVER "bad" — it is styled
 * neutrally, not as a problem. Only `tight` earns a warm colour, and even then
 * the copy stays calm: this reports a situation, it does not scold.
 */
const STATE_TONE: Record<FinancialState, string> = {
  on_track: 'text-action',
  watch: 'text-[hsl(var(--foreground))]',
  tight: 'text-attention',
  incomplete: 'text-ink2',
}

export function FinancialStateSection({
  financialState,
  isLoading,
}: {
  financialState?: FinancialStateResult
  isLoading?: boolean
}) {
  const { t } = useTranslation()

  if (isLoading || !financialState) {
    return (
      <Card>
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      </Card>
    )
  }

  const { state, reasons } = financialState

  return (
    <Card className="apple-shadow">
      <p className="t-body-sm text-ink2">
        {t('home.financialState.eyebrow')}
      </p>
      <h2 className={cn('t-page-tracking mt-2 t-metric font-medium', STATE_TONE[state])}>
        {t(`home.financialState.state.${state}`)}
      </h2>

      {reasons.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {reasons.map((reason) => (
            <li key={reason} className="t-body-sm leading-6 text-ink2">
              {t(`home.financialState.reason.${reason}`)}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}
