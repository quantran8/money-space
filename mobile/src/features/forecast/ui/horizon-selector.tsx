import { useTranslation } from 'react-i18next'

import {
  ALLOWED_HORIZONS,
  type HorizonDays,
} from '@money-space/core/features/forecast/model/forecast.types'

import { Segmented } from '@/components/ui'

/**
 * How far ahead the forecast looks: 7 / 30 / 60 / 90 days, default 30.
 *
 * `ALLOWED_HORIZONS` is the whole set and the server accepts nothing else, so
 * it is read from core rather than restated — a hardcoded list here would drift
 * into a 400 the household cannot act on.
 *
 * The web shows only the first three, which is a desktop concession to a tab
 * strip that shares its row with a page title. A `Segmented` owns its own row
 * here, and four ASCII labels fit across 375pt, so 90 days stays reachable
 * without a second control.
 */
export function HorizonSelector({
  value,
  onChange,
}: {
  value: HorizonDays
  onChange: (next: HorizonDays) => void
}) {
  const { t } = useTranslation()

  return (
    <Segmented
      value={String(value)}
      onChange={(next) => onChange(Number(next) as HorizonDays)}
      options={ALLOWED_HORIZONS.map((horizon) => ({
        value: String(horizon),
        label: t('upcoming.horizon.days', { count: horizon }),
      }))}
    />
  )
}
