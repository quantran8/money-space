import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { CalculationAssumption } from '@money-space/core/features/forecast/model/forecast.types'

import { Collapsible } from '@/components/ui'

/**
 * "Theo dữ liệu hiện có" — every derived number must be explainable (CLAUDE.md,
 * Voice invariant 5).
 *
 * The backend emits assumption CODES with a numeric or enum payload and never
 * prose; every sentence here is the client's.
 *
 * Folded away by default. On a phone the list runs to five or six lines, and
 * expanded it would push the timeline it qualifies off the screen — inverting
 * the priority the screen was built with. The summary is the offer to see the
 * working, never the working itself.
 */
export function AssumptionsNote({ assumptions }: { assumptions: CalculationAssumption[] }) {
  const { t } = useTranslation()

  if (assumptions.length === 0) return null

  return (
    <Collapsible
      className="px-1"
      showLabel={t('goals.scheduledOutflows.show')}
      hideLabel={t('goals.scheduledOutflows.hide')}
      summary={
        <Text className="t-caption text-ink3">{t('upcoming.assumptions.title')}</Text>
      }
    >
      <View className="gap-1.5">
        {assumptions.map((assumption) => (
          <Text
            key={`${assumption.code}:${assumption.value ?? ''}`}
            className="t-caption leading-5 text-ink3"
          >
            {t(`upcoming.assumptions.codes.${assumption.code}`, {
              value: assumption.value,
              count:
                typeof assumption.value === 'number'
                  ? assumption.value
                  : (assumption.relatedIds?.length ?? 0),
            })}
          </Text>
        ))}
      </View>
    </Collapsible>
  )
}
