import type { WhatIfResult } from '#/features/whatif/model/whatif.types'
import { formatVndShort } from '#/shared/lib/format-money'

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * A plain-text summary for the clipboard — the "Chia sẻ" action.
 *
 * Nothing is persisted: this is a string handed to the OS, not a saved
 * scenario. It reports consequence only, matching the on-screen blocks.
 */
export function buildShareSummary(result: WhatIfResult, t: Translate): string {
  const { input, before, after, delta } = result

  const lines = [
    t('whatif.share.heading', {
      amount: formatVndShort(input.amount),
      date: input.plannedDate,
    }),
    t('whatif.share.lowest', {
      before: formatVndShort(before.lowestProjectedBalance),
      after: formatVndShort(after.lowestProjectedBalance),
    }),
  ]

  if (!after.obligationsCovered) {
    lines.push(t('whatif.obligations.notCovered'))
  }

  if (delta.goalDelayMonths !== null && delta.goalDelayMonths !== 0) {
    lines.push(t('whatif.goal.delay', { count: Math.abs(delta.goalDelayMonths) }))
  }

  lines.push(t('whatif.share.footer'))
  return lines.join('\n')
}
