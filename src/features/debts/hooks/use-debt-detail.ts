import { useMemo } from 'react'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { useDebts } from '@/features/debts/hooks/use-debts'
import { useEvents } from '@/features/events/hooks/use-events'
import { useMembers } from '@/features/members/hooks/use-members'
import type { MoneyEventItem } from '@/features/events/model/events.types'
import { usePayments } from '@/features/payments/hooks/use-payments'

/** One row in a debt's repayment/borrow timeline, derived from money events. */
export type DebtHistoryEntry = {
  id: string
  title: string
  isoDate: string
  /** Absolute VND amount. */
  amount: number
  /**
   * A borrow inflow raises the debt; a repayment outflow reduces it; an
   * adjustment (neutral) is a bookkeeping reconcile that does neither.
   */
  kind: 'borrow' | 'repayment' | 'adjustment'
  note?: string
}

/**
 * Resolve a single debt plus the timeline of money events linked to it. The
 * borrow inflow (`debt_update` inflow logged on create) and each repayment
 * (outflow, e.g. a "Tra no: ..." payment marked paid) both link to the debt via
 * `debtId`, so we split them by direction. See memory/money-events.md.
 */
export function useDebtDetail(debtId: string | undefined) {
  const { debts, isLoading: isLoadingDebts } = useDebts()
  const { events, isLoading: isLoadingEvents } = useEvents()
  const { members } = useMembers()
  const { assets } = useAssets()
  const { payments, isLoading: isLoadingPayments } = usePayments()

  const debt = useMemo(
    () => (debtId ? debts.find((item) => item.id === debtId) : undefined),
    [debts, debtId],
  )

  const ownerName = useMemo(
    () => members.find((member) => member.id === debt?.ownerMemberId)?.name,
    [members, debt?.ownerMemberId],
  )
  const receivedToAssetName = useMemo(
    () => assets.find((asset) => asset.id === debt?.receivedToAssetId)?.name,
    [assets, debt?.receivedToAssetId],
  )

  const history = useMemo<DebtHistoryEntry[]>(() => {
    if (!debtId) return []
    return events
      .filter((event: MoneyEventItem) => event.debtId === debtId)
      .map((event) => {
        const kind =
          event.direction === 'inflow'
            ? ('borrow' as const)
            : event.direction === 'outflow'
              ? ('repayment' as const)
              : ('adjustment' as const)
        // `title` was dropped from money events; the descriptive label now lives
        // in the note (the backend folds "Vay: …" / "Điều chỉnh dư nợ: …" into
        // it). Fall back to a kind label when the note is empty.
        const label =
          event.note?.trim() ||
          (kind === 'borrow' ? 'Vay' : kind === 'repayment' ? 'Trả nợ' : 'Điều chỉnh')
        return {
          id: event.id ?? `${event.isoDate}-${label}`,
          title: label,
          isoDate: event.isoDate,
          amount: Math.abs(event.amount),
          kind,
          note: event.note || undefined,
        }
      })
      .sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0))
  }, [events, debtId])

  // Split the timeline into the two flows the UI shows as separate sections:
  // money received (borrow inflows) vs repayments (outflows).
  const borrows = useMemo(
    () => history.filter((entry) => entry.kind === 'borrow'),
    [history],
  )
  const repayments = useMemo(
    () => history.filter((entry) => entry.kind === 'repayment'),
    [history],
  )
  const adjustments = useMemo(
    () => history.filter((entry) => entry.kind === 'adjustment'),
    [history],
  )

  const totalBorrowed = useMemo(
    () => borrows.reduce((sum, entry) => sum + entry.amount, 0),
    [borrows],
  )
  const totalRepaid = useMemo(
    () => repayments.reduce((sum, entry) => sum + entry.amount, 0),
    [repayments],
  )

  const upcomingPayments = useMemo(() => {
    if (!debtId) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return payments
      .filter((payment) => payment.debtId === debtId)
      .filter((payment) => {
        const due = new Date(`${payment.dueDate ?? payment.due}T00:00:00`)
        return !Number.isNaN(due.getTime()) && due >= today
      })
      .sort((left, right) =>
        (left.dueDate ?? left.due).localeCompare(right.dueDate ?? right.due),
      )
  }, [debtId, payments])

  return {
    debt,
    ownerName,
    receivedToAssetName,
    history,
    borrows,
    repayments,
    adjustments,
    totalBorrowed,
    totalRepaid,
    upcomingPayments,
    isLoading: isLoadingDebts || isLoadingEvents || isLoadingPayments,
  }
}
