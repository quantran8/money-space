import { useWatch, type Control } from 'react-hook-form'
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

/**
 * §22.7 — the consequence block, updating per keystroke, phrased as a sentence.
 *
 * `--accent-soft` is the simulation surface: both this and the what-if area
 * answer "what happens if I do this". `aria-live` because §24 requires that
 * state to be announced, not carried by background colour alone.
 */
export function EventEffect({
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

  // An edit already has a saved amount, so a "sau khoản này" sentence would
  // double-count it. §22.8 wants a change summary there instead, which the
  // dialog renders from the stored record.
  if (isEditing) return null

  const amount = parseAmountInput(rawAmount ?? '')
  const direction = getDirectionFromEventType(
    (eventType as RecordType) ?? (quickAction === 'income' ? 'income' : 'expense'),
  )

  const sentence = buildEventEffect({
    amount,
    direction,
    lowestProjectedBalance: forecast?.lowestProjectedBalance,
    horizonDays: forecast?.horizonDays ?? 30,
    t,
  })

  if (!sentence) return null

  return (
    <p
      aria-live="polite"
      className="num rounded-[10px] bg-accent-soft px-4 py-3 text-[13px] font-medium leading-[1.6] text-ink2"
    >
      {sentence}
    </p>
  )
}
