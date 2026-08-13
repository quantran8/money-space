import { useTranslation } from 'react-i18next'

import type { CalculationAssumption } from '@/features/forecast/model/forecast.types'

/**
 * "Theo dữ liệu hiện có" — every calculated number must be explainable
 * (CLAUDE.md, Voice). The backend emits assumption CODES with a numeric or enum
 * payload; all the prose is here.
 */
export function AssumptionsNote({ assumptions }: { assumptions: CalculationAssumption[] }) {
  const { t } = useTranslation()

  if (assumptions.length === 0) return null

  return (
    <section className="px-1 py-3 text-[12px] leading-5 text-ink3">
      <h2 className="sr-only">{t('upcoming.assumptions.title')}</h2>
      <ul className="space-y-1">
        {assumptions.map((assumption) => (
          <li key={`${assumption.code}:${assumption.value ?? ''}`}>
            {t(`upcoming.assumptions.codes.${assumption.code}`, {
              value: assumption.value,
              count:
                typeof assumption.value === 'number'
                  ? assumption.value
                  : (assumption.relatedIds?.length ?? 0),
            })}
          </li>
        ))}
      </ul>
    </section>
  )
}
