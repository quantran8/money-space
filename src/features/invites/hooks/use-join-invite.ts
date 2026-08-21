import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { acceptInvite, previewInvite } from '@/features/invites/api/invites.repository'
import { isAuthHandoff } from '@/features/auth/model/next-path'
import {
  JOIN_PARAM_HOUSEHOLD,
  JOIN_PARAM_TOKEN,
} from '@/features/invites/model/invites.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useAppStore } from '@/shared/stores/household-store'
import { getErrorMessage } from '@/shared/lib/get-error-message'

/**
 * The invitee's side: what `/join?household=…&token=…` runs after a QR scan.
 *
 * The household id in the URL is the *stated* destination; the token is the
 * authority. Where they disagree the server's answer wins — `acceptInvite`
 * returns the household the token actually belongs to, and that is what we
 * activate. The param is never trusted as a grant, only used to name the
 * destination before the accept happens.
 *
 * Two things have to happen on accept, in this order, or the joiner lands
 * somewhere wrong:
 *
 * 1. the returned household becomes the active one — otherwise
 *    `useActiveHousehold` keeps whatever was stored, or nothing at all;
 * 2. the households list is invalidated, so `RequireHousehold` sees a non-zero
 *    count instead of bouncing them straight back to `/onboarding`.
 */
export function useJoinInvite() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const token = searchParams.get(JOIN_PARAM_TOKEN)?.trim() ?? ''
  const householdId = searchParams.get(JOIN_PARAM_HOUSEHOLD)?.trim() ?? ''

  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId)

  const previewQuery = useQuery({
    queryKey: queryKeys.invitePreview(token),
    queryFn: () => previewInvite(token),
    enabled: token.length > 0,
    // A token can be revoked or accepted between the scan and the tap; there is
    // no value in serving a stale answer to a one-shot decision.
    staleTime: 0,
    retry: false,
  })

  /**
   * Auto-accept when the user reached this screen straight out of signing up or
   * signing in — the full flow being: invite link → sign up → account created →
   * invite accepted → in the household. They opened the link and then created an
   * account to follow it; a confirm button here asks them to agree to something
   * they have already chosen twice.
   *
   * `isAuthHandoff` reads router state our own auth completion set, so this can
   * never fire for a link someone merely forwarded, and never on a reload — both
   * of those fall through to the ordinary confirm screen.
   */
  const cameFromAuth = isAuthHandoff(location.state)
  /** Flips off after a failed auto-attempt so the screen stops retrying. */
  const [autoJoinAborted, setAutoJoinAborted] = useState(false)
  const autoJoinIsOn = cameFromAuth && !autoJoinAborted

  const accept = useMutation({
    mutationFn: () => acceptInvite(token),
    onSuccess: async (result) => {
      setActiveHouseholdId(result.householdId)
      // REFETCH, not invalidate — same reason as onboarding: /join sits outside
      // `RequireHousehold`, so the `households` query has no active observer here
      // and `invalidateQueries` (refetchType 'active' by default) would resolve
      // without fetching, landing the new member on an empty list.
      await queryClient.refetchQueries({ queryKey: queryKeys.households })
      toast.success(
        result.alreadyMember ? t('invites.join.alreadyMember') : t('invites.join.success'),
      )
      navigate('/', { replace: true })
    },
    onError: (cause) => {
      toast.error(getErrorMessage(cause, t('invites.join.failed')))
      // The token's state changed under them; refresh the preview so the screen
      // stops offering a button that cannot work, and stop auto-accepting so the
      // failure is shown once rather than retried.
      setAutoJoinAborted(true)
      void previewQuery.refetch()
    },
  })

  const acceptMutate = accept.mutate
  /** One attempt per mount; `isPending` alone leaves a gap the effect re-enters. */
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (!autoJoinIsOn || attemptedRef.current) return
    if (!previewQuery.data?.acceptable) return
    attemptedRef.current = true
    acceptMutate()
  }, [autoJoinIsOn, previewQuery.data?.acceptable, acceptMutate])

  return {
    token,
    householdId,
    /** No token in the URL means the QR was mangled — not a server failure. */
    isMissingToken: token.length === 0,
    preview: previewQuery.data ?? null,
    isLoading: token.length > 0 && previewQuery.isPending,
    loadError: previewQuery.isError
      ? getErrorMessage(previewQuery.error, t('invites.join.notFound'))
      : null,
    isAccepting: accept.isPending,
    /**
     * True while the join is happening on the user's behalf. The page shows
     * progress instead of a decision — flashing a confirm button that is about
     * to press itself reads as a glitch.
     */
    isAutoJoining: autoJoinIsOn && (previewQuery.isPending || accept.isPending),
    acceptJoin: () => acceptMutate(),
  }
}
