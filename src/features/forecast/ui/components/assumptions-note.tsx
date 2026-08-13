import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
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
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
          <Info className="size-4 text-[hsl(var(--muted-foreground))]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t('upcoming.assumptions.title')}</p>
          <ul className="mt-2 space-y-1.5">
            {assumptions.map((assumption) => (
              <li
                key={`${assumption.code}:${assumption.value ?? ''}`}
                className="text-sm leading-6 text-[hsl(var(--muted-foreground))]"
              >
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
        </div>
      </div>
    </Card>
  )
}
