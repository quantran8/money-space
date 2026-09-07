import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
  previewRedeemCode,
  redeemCode as redeemRequest,
  type RedeemCodePreview,
  type RedeemFailureReason,
} from '#/features/billing/api/billing.repository'
import {
  formatRedeemCode,
  isValidRedeemCode,
  normalizeRedeemCode,
  REDEEM_CODE_LENGTH,
} from '#/features/billing/model/redeem-code-format'
import { ApiError } from '#/shared/api/http'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { notify } from '#/shared/notify'

/**
 * Four states, because redeeming is a two-step action.
 *
 * `idle` → `previewing` → `confirming` → `done`. The preview step exists
 * because a spent code cannot be recovered and codes are typed off a
 * screenshot: it shows what will happen, and which household it applies to,
 * before anything is consumed.
 */
export type RedeemStep = 'idle' | 'previewing' | 'confirming' | 'done'

/** Server codes plus the ones only the client can know. */
function reasonFrom(error: unknown): RedeemFailureReason {
  if (!(error instanceof ApiError)) return 'invalid'
  if (error.statusCode === 429) return 'rate_limited'

  const known: RedeemFailureReason[] = [
    'invalid',
    'expired',
    'exhausted',
    'already_used',
    'no_effect',
  ]
  return known.includes(error.message as RedeemFailureReason)
    ? (error.message as RedeemFailureReason)
    : 'invalid'
}

export function useRedeemCode(onRedeemed?: () => void) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const [input, setInput] = useState('')
  const [step, setStep] = useState<RedeemStep>('idle')
  const [preview, setPreview] = useState<RedeemCodePreview | null>(null)
  const [reason, setReason] = useState<RedeemFailureReason | null>(null)
  const [pending, setPending] = useState(false)

  const normalized = normalizeRedeemCode(input)
  const complete = normalized.length >= REDEEM_CODE_LENGTH
  /**
   * Only a COMPLETE code can be wrong. Flagging a half-typed one would put an
   * error under the field while someone is still typing it.
   */
  const malformed = complete && !isValidRedeemCode(normalized)

  function onChange(next: string) {
    setInput(formatRedeemCode(normalizeRedeemCode(next)))
    if (step !== 'idle') setStep('idle')
    setReason(null)
    setPreview(null)
  }

  function reset() {
    setInput('')
    setStep('idle')
    setPreview(null)
    setReason(null)
  }

  /** Step one: ask what the code would do. */
  async function check() {
    if (!activeHouseholdId || !isValidRedeemCode(normalized)) {
      // Caught here rather than at the server: no request, and no rate-limit
      // attempt spent on a typo.
      setReason('invalid')
      return
    }

    setPending(true)
    try {
      const result = await previewRedeemCode(activeHouseholdId, normalized)
      setPreview(result)
      if (result.valid) {
        setStep('previewing')
        setReason(null)
      } else {
        setReason(result.reason)
      }
    } catch (error) {
      setReason(reasonFrom(error))
    } finally {
      setPending(false)
    }
  }

  /** Step two: spend it. */
  async function confirm() {
    if (!activeHouseholdId) return

    setPending(true)
    setStep('confirming')
    try {
      const result = await redeemRequest(activeHouseholdId, normalized)

      // The response carries the new entitlement in full, so the UI is correct
      // immediately and no refetch is needed. The server stays the last word on
      // the next request either way.
      queryClient.setQueryData(
        queryKeys.entitlement(activeHouseholdId),
        result.entitlement,
      )
      // Screens whose limits just changed have to redraw. Not awaited, per the
      // convention in use-goals.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.goals(activeHouseholdId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(activeHouseholdId),
      })

      setStep('done')
      notify.success(t('billing.redeem.success.title'))
      onRedeemed?.()
    } catch (error) {
      setStep('idle')
      setReason(reasonFrom(error))
    } finally {
      setPending(false)
    }
  }

  return {
    /** Grouped for display: `OURS-XXXX-XXXX`. */
    input,
    onChange,
    /** What would be sent. */
    normalized,
    step,
    preview,
    reason,
    pending,
    malformed,
    /** The primary action is never disabled — it explains what is missing. */
    canSubmit: !pending && normalized.length > 0,
    check,
    confirm,
    reset,
  }
}
