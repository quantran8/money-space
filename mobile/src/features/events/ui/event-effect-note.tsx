import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { buildEventEffect } from '@money-space/core/features/events/model/events-effect'
import {
  getDirectionFromEventType,
  parseAmountInput,
  type ActualRecordForm,
  type QuickAction,
  type RecordType,
} from '@money-space/core/features/events/model/events-form'
import { useForecast } from '@money-space/core/features/forecast/hooks/use-forecast'

import { ConsequenceNote } from '@/components/ui'

import type { Control } from 'react-hook-form'

/**
 * §22.7 — what this record does to the low point, in ONE sentence, recomputed
 * per keystroke.
 *
 * Every rule that makes the sentence honest lives in core's `buildEventEffect`
 * and none of them may be re-decided here:
 *
 *  - The figure **may be negative** and is never clamped. A household whose
 *    lowest point goes below zero is exactly who this line is for.
 *  - A **transfer** (`direction: 'neutral'`) moves money between the
 *    household's own wallets, so the low point does not shift — core returns
 *    `null` and NOTHING renders. A consequence shown there would be a false
 *    one, which is worse than no consequence at all.
 *  - No forecast yet, or nothing typed: `null` again. §23 — show nothing rather
 *    than a fabricated zero.
 *
 * It is a sentence and never a grid of labelled metrics: a grid is report
 * language, and this is the register two people use about their own money. It
 * states a consequence and never a recommendation (§16.1).
 */
export function EventEffectNote({
  control,
  quickAction,
  isEditing = false,
}: {
  control: Control<ActualRecordForm>
  quickAction: QuickAction
  isEditing?: boolean
}) {
  const { t } = useTranslation()
  const { forecast } = useForecast()

  const rawAmount = useWatch({ control, name: 'amount' })
  const eventType = useWatch({ control, name: 'eventType' })

  // An edit already has a saved amount, so "sau khoản này" would count it
  // twice. The web says the same and renders nothing here on edit.
  if (isEditing) return null

  const sentence = buildEventEffect({
    amount: parseAmountInput(rawAmount ?? ''),
    direction: getDirectionFromEventType(
      (eventType as RecordType) ?? (quickAction === 'income' ? 'income' : 'expense'),
    ),
    lowestProjectedBalance: forecast?.lowestProjectedBalance,
    horizonDays: forecast?.horizonDays ?? 30,
    t,
  })

  if (!sentence) return null

  return <ConsequenceNote>{sentence}</ConsequenceNote>
}
