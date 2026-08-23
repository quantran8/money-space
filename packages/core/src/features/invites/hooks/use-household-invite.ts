import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { notify } from '#/shared/notify'

import {
  createInvite,
  listInvites,
  revokeInvite,
} from '#/features/invites/api/invites.repository'
import {
  buildJoinUrl,
  isShareable,
  type HouseholdInvite,
} from '#/features/invites/model/invites.types'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { getErrorMessage } from '#/shared/lib/get-error-message'

/**
 * The inviter's side of the QR flow.
 *
 * Opening the dialog must produce a scannable code with no further clicks, but
 * it must not mint a new token every time someone opens it — a household would
 * accumulate a pile of live secrets, each one a standing way in. So the hook
 * **reuses** the existing pending, unexpired invite and only creates one when
 * there is none. Deliberately replacing a leaked code is a separate, explicit
 * action (`renew`).
 */
export function useHouseholdInvite() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const [open, setOpen] = useState(false)

  const invitesQuery = useQuery({
    queryKey: activeHouseholdId ? queryKeys.invites(activeHouseholdId) : ['invites', 'inactive'],
    queryFn: () => listInvites(activeHouseholdId!),
    // Only fetched while the dialog is open — nothing else in the app shows
    // invite tokens, and a token is not something to keep warm in a cache.
    enabled: open && !!activeHouseholdId,
    staleTime: 0,
  })

  const invalidate = useCallback(() => {
    if (!activeHouseholdId) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.invites(activeHouseholdId) })
  }, [activeHouseholdId, queryClient])

  const create = useMutation({
    mutationFn: () => createInvite(activeHouseholdId!),
    onSuccess: invalidate,
  })
  const revoke = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(activeHouseholdId!, inviteId),
    onSuccess: invalidate,
  })

  const existing: HouseholdInvite | null = useMemo(
    () => invitesQuery.data?.items.find(isShareable) ?? null,
    [invitesQuery.data],
  )

  /**
   * Guards the auto-create against firing twice. The window between
   * `create` resolving and the refetched list carrying the new row is a render
   * or two where `existing` is still null and the mutation is no longer
   * pending — enough for a naive effect to mint a second token.
   */
  const requestedRef = useRef(false)
  const createMutate = create.mutate

  useEffect(() => {
    if (!open) requestedRef.current = false
  }, [open])

  useEffect(() => {
    if (!open || !activeHouseholdId) return
    if (invitesQuery.isPending || invitesQuery.isError) return
    if (existing || requestedRef.current) return
    requestedRef.current = true
    createMutate()
  }, [
    open,
    activeHouseholdId,
    invitesQuery.isPending,
    invitesQuery.isError,
    existing,
    createMutate,
  ])

  // `create.data` covers the gap before the list refetch lands, so the code
  // appears the moment it exists instead of after a second round-trip.
  const invite = existing ?? (create.data && isShareable(create.data) ? create.data : null)
  const joinUrl = invite ? buildJoinUrl(invite.householdId, invite.token) : null

  const error = invitesQuery.isError
    ? getErrorMessage(invitesQuery.error, t('invites.qr.error'))
    : create.isError
      ? getErrorMessage(create.error, t('invites.qr.error'))
      : null

  function openQr() {
    setOpen(true)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) create.reset()
  }

  /** Replace the current code — the only way to kill one that got out. */
  async function renew() {
    if (!activeHouseholdId) return
    try {
      if (existing) await revoke.mutateAsync(existing.id)
      requestedRef.current = true
      await create.mutateAsync()
      notify.success(t('invites.qr.renewed'))
    } catch (cause) {
      notify.error(getErrorMessage(cause, t('invites.qr.error')))
    }
  }

  async function copyLink() {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      notify.success(t('invites.qr.copied'))
    } catch {
      notify.error(t('invites.qr.copyFailed'))
    }
  }

  return {
    open,
    openQr,
    handleOpenChange,
    invite,
    joinUrl,
    /** True until there is something to scan and nothing failed. */
    isPreparing: (invitesQuery.isPending || create.isPending) && !invite,
    error,
    isRenewing: revoke.isPending || create.isPending,
    renew,
    copyLink,
  }
}
