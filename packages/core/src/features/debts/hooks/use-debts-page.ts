import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { clipboard } from '#/shared/clipboard'
import { useLocation, useNavigate } from '#/shared/navigation'
import { notify } from '#/shared/notify'

import { useAssets } from '#/features/assets/hooks/use-assets'
import { isWalletAssetType } from '#/features/assets/model/assets'
import { useDebts } from '#/features/debts/hooks/use-debts'
import type { DebtPayload } from '#/features/debts/api/debts.repository'
import type { DebtUpdateModeChoice } from '#/features/debts/model/debts.types'
import { useEvents } from '#/features/events/hooks/use-events'
import {
  amountToRaw,
  buildDebtSchema,
  defaultValues,
  parseAmountInput,
  resolveOutstandingAmount,
  type DebtForm,
  type DebtSummary,
} from '#/features/debts/model/debts-form'
import {
  averageAnnualRate,
  calcFromBackendEnum,
  calcToBackendEnum,
  estimateRepayment,
  fromInterestPeriodDtos,
  monthsBetween,
  toInterestPeriodDtos,
} from '#/features/debts/model/debts-interest'
import type { DebtItem, DebtStatus } from '#/features/debts/model/debts.types'
import { useMembers } from '#/features/members/hooks/use-members'
import { currentMemberId } from '#/features/members/model/members.types'
import { useCashflowEvents } from '#/features/cashflow/hooks/use-cashflow-events'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { useAuthStore } from '#/shared/stores/auth-store'

export function useDebtsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { debts, createDebt, updateDebt, deleteDebt, isLoading } = useDebts()
  const { events } = useEvents()
  // The debts page only ever shows money still going out on a debt, so the
  // list is narrowed server-side to live outgoing events.
  const { cashflowEvents: payments, isLoading: isPaymentsLoading } = useCashflowEvents({
    direction: 'outgoing',
    status: 'live',
  })
  const { assets } = useAssets()
  const { members } = useMembers()
  const userId = useAuthStore((state) => state.user?.id)
  const creatorMemberId = currentMemberId(members, userId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // When editing a debt that already has money-event history, we don't submit
  // straight away — we stash the built payload and ask which update mode applies,
  // showing a before→after preview. `before`/`totalRepaid` are captured at submit
  // time because `editingId` is cleared once the form dialog closes.
  const [pendingUpdate, setPendingUpdate] = useState<{
    debtId: string
    payload: DebtPayload
    originalAmountChanged: boolean
    before: {
      originalAmount: number
      outstandingAmount: number
      fixedPaymentAmount?: number
      interestRate?: number
      installments?: number
      lenderType: DebtItem['lenderType']
      name: string
    }
    after: {
      originalAmount: number
      fixedPaymentAmount?: number
      interestRate?: number
      installments?: number
      lenderType: DebtItem['lenderType']
      name: string
    }
    totalRepaid: number
  } | null>(null)

  const debtSchema = useMemo(() => buildDebtSchema(t), [t])

  const form = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
    defaultValues,
    mode: 'onChange',
  })

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = form

  const assetOptions = useMemo(
    () => assets.map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )
  // Money borrowed lands in a spendable wallet — cash or a bank account — never a
  // valued asset (gold, stock, savings…). Mirror the events page "nguồn tiền"
  // rule so the "nhận nợ vào đâu" select only offers real wallets.
  const receiveAssetOptions = useMemo(
    () =>
      assets
        .filter((asset) => isWalletAssetType(asset.type))
        .map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )
  const memberOptions = useMemo(
    () =>
      members
        .filter((member) => member.status === 'active')
        .map((member) => ({
          value: member.id,
          label: member.name,
        })),
    [members],
  )

  const editingDebt = editingId ? debts.find((item) => item.id === editingId) : undefined
  // A debt "has history" once any money event links to it (a borrow inflow or a
  // recorded repayment). Editing such a debt requires choosing an update mode.
  function hasHistory(debtId: string) {
    return events.some((event) => event.debtId === debtId)
  }
  const selectedLenderType = useWatch({ control, name: 'lenderType' })
  const originalAmountValue = useWatch({ control, name: 'originalAmount' })
  const isSavingDebt = createDebt.isPending || updateDebt.isPending

  // Live repayment estimate — recomputed as the user edits the loan terms.
  const watchedBorrowedAt = useWatch({ control, name: 'borrowedAt' })
  const watchedDueDate = useWatch({ control, name: 'expectedFinalDueDate' })
  const watchedFrequency = useWatch({ control, name: 'paymentFrequency' })
  const watchedPeriods = useWatch({ control, name: 'interestPeriods' })
  const watchedCalc = useWatch({ control, name: 'interestCalc' })
  const watchedHasInterest = useWatch({ control, name: 'hasInterest' })
  const watchedPaymentTouched = useWatch({ control, name: 'fixedPaymentTouched' })

  const termMonths = useMemo(
    () => monthsBetween(watchedBorrowedAt, watchedDueDate),
    [watchedBorrowedAt, watchedDueDate],
  )

  const repaymentEstimate = useMemo(
    () =>
      estimateRepayment({
        principal: parseAmountInput(originalAmountValue),
        frequency: watchedFrequency ?? 'none',
        termMonths,
        // Interest off → estimate as a 0% loan (principal split across installments).
        periods: watchedHasInterest ? (watchedPeriods ?? []) : [],
        calc: watchedCalc ?? 'fixed',
      }),
    [originalAmountValue, watchedFrequency, termMonths, watchedPeriods, watchedCalc, watchedHasInterest],
  )

  // Keep the (non-overridden) payment field in sync with the live estimate so
  // the stored value matches what the user sees suggested.
  useEffect(() => {
    if (watchedPaymentTouched) return
    const next = repaymentEstimate ? String(repaymentEstimate.perPayment) : ''
    setValue('fixedPaymentAmount', next, { shouldValidate: false })
  }, [repaymentEstimate, watchedPaymentTouched, setValue])

  const summary = useMemo<DebtSummary>(() => {
    const activeDebts = debts.filter((debt) => debt.status === 'active' || debt.status === 'overdue')
    const outstanding = activeDebts.reduce(
      (sum, debt) => sum + parseAmountInput(debt.outstandingAmount),
      0,
    )
    const overdue = debts.filter((debt) => debt.status === 'overdue')
    const monthlyPlanned = activeDebts.reduce(
      (sum, debt) => sum + parseAmountInput(debt.fixedPaymentAmount ?? ''),
      0,
    )
    return {
      outstanding,
      activeCount: activeDebts.length,
      overdueCount: overdue.length,
      monthlyPlanned,
    }
  }, [debts])

  /**
   * Arriving with `state.openCreate` opens the create form once.
   *
   * A ref, not a history rewrite: clearing the entry was how the web stopped
   * the form reopening on every back-navigation, but `history` does not exist
   * on native. Remembering that this instance already handled the flag does the
   * same job on both platforms, and does not touch the navigation stack.
   */
  const handledOpenCreate = useRef(false)
  useEffect(() => {
    const state = location.state
    const wantsCreate =
      !!state && typeof state === 'object' && 'openCreate' in state && !handledOpenCreate.current

    if (!wantsCreate) return
    handledOpenCreate.current = true

    // Deferred a tick so the screen has mounted before the sheet animates in.
    const timer = setTimeout(() => {
      setEditingId(null)
      setShowMoreDetails(false)
      setDialogOpen(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [location.state])

  useEffect(() => {
    if (!dialogOpen) return

    if (editingDebt) {
      // Rehydrate the interest stages straight from the persisted periods.
      // Fall back to a single stage seeded from the averaged rate the backend
      // returns (e.g. "9.2%") for older debts with no per-stage detail.
      const fallbackRate = (editingDebt.interestSummary ?? '').replace(/[^0-9.,]/g, '')
      const rawPeriods =
        fromInterestPeriodDtos(editingDebt.interestPeriods) ??
        (fallbackRate ? [{ ratePct: fallbackRate, months: '' }] : defaultValues.interestPeriods)
      // The last stage always derives its months from the term (shown read-only),
      // so clear any stored value on it — earlier stages keep their explicit months.
      const lastRawIndex = rawPeriods.length - 1
      const periods = rawPeriods.map((period, index) =>
        index === lastRawIndex ? { ...period, months: '' } : period,
      )

      reset({
        name: editingDebt.name,
        lenderType: editingDebt.lenderType,
        lenderName: editingDebt.lenderName,
        originalAmount: amountToRaw(editingDebt.originalAmountValue),
        outstandingAmount: amountToRaw(editingDebt.outstandingAmountValue),
        borrowedAt: editingDebt.borrowedAt,
        firstPaymentDate: editingDebt.firstPaymentDate ?? '',
        expectedFinalDueDate: editingDebt.expectedFinalDueDate ?? '',
        ownerMemberId: editingDebt.ownerMemberId ?? '',
        receivedToAssetId: editingDebt.receivedToAssetId ?? '',
        repaymentAssetId: editingDebt.repaymentAssetId ?? '',
        paymentFrequency: editingDebt.paymentFrequency ?? 'none',
        fixedPaymentAmount: amountToRaw(editingDebt.fixedPaymentAmountValue),
        // Editing a saved debt: keep whatever amount is stored as-is.
        fixedPaymentTouched: editingDebt.fixedPaymentAmountValue !== undefined,
        // Show the interest fields only if the saved debt actually charges interest.
        hasInterest: periods.some((period) => parseFloat(period.ratePct) > 0),
        interestCalc: calcFromBackendEnum(editingDebt.interestCalculation),
        interestPeriods: periods,
        note: editingDebt.note ?? '',
      })
      return
    }

    reset({
      ...defaultValues,
      ownerMemberId: creatorMemberId ?? '',
      // Creating a debt must not move money until the user explicitly enables
      // "Ghi nhận sự kiện nhận tiền" in step 2.
      receivedToAssetId: '',
      repaymentAssetId: '',
    })
  }, [creatorMemberId, dialogOpen, editingDebt, reset])

  function openCreate() {
    setEditingId(null)
    setShowMoreDetails(false)
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setShowMoreDetails(false)
    setDialogOpen(true)
  }

  function onOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditingId(null)
      setShowMoreDetails(false)
    }
  }

  async function onSubmit(values: DebtForm) {
    try {
      const termMonths = monthsBetween(values.borrowedAt, values.expectedFinalDueDate)
      const avgRate = averageAnnualRate(values.interestPeriods, termMonths)
      // The user's interest switch is the source of truth: when off, we drop any
      // rate/period values so the debt is persisted as interest-free.
      const hasInterest = values.hasInterest && avgRate > 0
      // The last interest stage always absorbs the remaining term (the form shows
      // its months as computed, not typed), so persist it with empty months =
      // "remaining term". Earlier stages keep their explicit months.
      const lastIndex = values.interestPeriods.length - 1
      const normalizedPeriods = values.interestPeriods.map((period, index) =>
        index === lastIndex ? { ...period, months: '' } : period,
      )
      const interestPeriods = values.hasInterest
        ? toInterestPeriodDtos(normalizedPeriods)
        : []

      const payload = {
        name: values.name.trim(),
        lenderType: values.lenderType,
        lenderName: values.lenderName.trim() || undefined,
        originalAmount: parseAmountInput(values.originalAmount),
        outstandingAmount: resolveOutstandingAmount(values),
        currency: 'VND',
        borrowedAt: values.borrowedAt || undefined,
        firstPaymentDate: values.firstPaymentDate || undefined,
        expectedFinalDueDate: values.expectedFinalDueDate || undefined,
        status: (values.expectedFinalDueDate && values.expectedFinalDueDate < '2026-07-08'
          ? 'overdue'
          : 'active') as DebtStatus,
        ownerMemberId: values.ownerMemberId || undefined,
        receivedToAssetId: values.receivedToAssetId || undefined,
        repaymentAssetId: values.repaymentAssetId || undefined,
        paymentFrequency: values.paymentFrequency === 'none' ? undefined : values.paymentFrequency,
        fixedPaymentAmount: values.fixedPaymentAmount.trim()
          ? parseAmountInput(values.fixedPaymentAmount)
          : undefined,
        // Send backend-valid enums, not free-form labels: `interestType` is the
        // DebtInterestType enum and `interestRate` is the numeric averaged rate.
        interestType: hasInterest ? 'fixed' : 'none',
        interestCalculation: hasInterest ? calcToBackendEnum(values.interestCalc) : undefined,
        interestRate: hasInterest ? Math.round(avgRate * 100) / 100 : undefined,
        // Each stage is persisted as its own debt_interest_periods row.
        interestPeriods: interestPeriods.length > 0 ? interestPeriods : undefined,
        note: values.note.trim() || undefined,
      }

      // Editing a debt that already has history: don't submit yet — stash the
      // payload and ask whether this is a correction or an effective-from-now
      // change (the backend rejects a history-ful update without a mode), and
      // capture a before-snapshot + total repaid for the before→after preview.
      if (editingId && hasHistory(editingId)) {
        const originalAmountChanged =
          payload.originalAmount !== editingDebt?.originalAmountValue
        const totalRepaid = events
          .filter((event) => event.debtId === editingId && event.direction === 'outflow')
          .reduce((sum, event) => sum + Math.abs(event.amount), 0)
        // The "before" repayment figures come from the debt as it stands now;
        // the "after" figures are the live estimate for the edited form values.
        const beforeEstimate = estimateRepayment({
          principal: editingDebt?.originalAmountValue ?? 0,
          frequency: editingDebt?.paymentFrequency ?? 'none',
          termMonths: monthsBetween(editingDebt?.borrowedAt, editingDebt?.expectedFinalDueDate),
          periods: fromInterestPeriodDtos(editingDebt?.interestPeriods) ?? [],
          calc: calcFromBackendEnum(editingDebt?.interestCalculation),
        })
        setPendingUpdate({
          debtId: editingId,
          payload,
          originalAmountChanged,
          totalRepaid,
          before: {
            originalAmount: editingDebt?.originalAmountValue ?? 0,
            outstandingAmount: editingDebt?.outstandingAmountValue ?? 0,
            fixedPaymentAmount: editingDebt?.fixedPaymentAmountValue,
            interestRate: beforeEstimate?.annualRatePct,
            installments: beforeEstimate?.installments,
            lenderType: editingDebt?.lenderType ?? payload.lenderType,
            name: editingDebt?.name ?? payload.name,
          },
          after: {
            originalAmount: payload.originalAmount,
            fixedPaymentAmount: payload.fixedPaymentAmount,
            interestRate: repaymentEstimate?.annualRatePct,
            installments: repaymentEstimate?.installments,
            lenderType: payload.lenderType,
            name: payload.name,
          },
        })
        setDialogOpen(false)
        return
      }

      if (editingId) {
        await updateDebt.mutateAsync({ debtId: editingId, payload })
        notify.success(t('debts.toast.updated'))
      } else {
        await createDebt.mutateAsync(payload)
        notify.success(t('debts.toast.created'))
      }

      onOpenChange(false)
    } catch (error) {
      notify.error(
        getErrorMessage(
          error,
          editingId ? t('debts.toast.updateFailed') : t('debts.toast.createFailed'),
        ),
      )
    }
  }

  async function confirmUpdateMode(choice: DebtUpdateModeChoice) {
    if (!pendingUpdate) return
    const { debtId, payload } = pendingUpdate
    // Map the chosen mode onto the payload. For a reconcile, the amount the user
    // typed in the "loan amount" field is really the new outstanding balance —
    // carry it there as a Partial update and leave originalAmount unchanged.
    let nextPayload: Partial<DebtPayload> = { ...payload, updateMode: choice }
    if (choice.kind === 'effective' && choice.balanceIntent === 'reconcile_balance') {
      const { originalAmount, ...rest } = nextPayload
      nextPayload = { ...rest, outstandingAmount: originalAmount }
    }
    try {
      await updateDebt.mutateAsync({ debtId, payload: nextPayload })
      notify.success(t('debts.toast.updated'))
      setPendingUpdate(null)
      onOpenChange(false)
    } catch (error) {
      notify.error(getErrorMessage(error, t('debts.toast.updateFailed')))
    }
  }

  const deletingDebt = deletingId ? debts.find((item) => item.id === deletingId) : undefined

  function requestDelete(id: string) {
    setDeletingId(id)
  }

  function cancelDelete() {
    setDeletingId(null)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteDebt.mutateAsync(deletingId)
      notify.success(t('debts.toast.deleted'))
      setDeletingId(null)
    } catch (error) {
      notify.error(getErrorMessage(error, t('debts.toast.deleteFailed')))
    }
  }

  function openDetail(id: string) {
    navigate(`/debts/${id}`)
  }

  function markPaidOff(id: string) {
    void updateDebt
      .mutateAsync({
        debtId: id,
        payload: { status: 'paid_off', outstandingAmount: 0 },
      })
      .then(() => notify.success(t('debts.toast.paidOff')))
      .catch((error) =>
        notify.error(getErrorMessage(error, t('debts.toast.statusFailed'))),
      )
  }

  async function pasteAmountFromClipboard() {
    try {
      const text = await clipboard.readText()
      const normalized = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
      if (!normalized) return
      setValue('originalAmount', normalized, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    } catch {
      // Clipboard access can be unavailable depending on browser permissions.
    }
  }

  return {
    // data
    debts,
    assets,
    members,
    events,
    payments,
    isPaymentsLoading,
    isLoading,
    summary,
    assetOptions,
    receiveAssetOptions,
    memberOptions,
    // form
    control,
    register,
    errors,
    isValid,
    setValue,
    trigger,
    submit: handleSubmit(onSubmit),
    selectedLenderType,
    originalAmountValue,
    isSavingDebt,
    isUpdating: updateDebt.isPending,
    // computed repayment
    repaymentEstimate,
    termMonths,
    // dialog
    dialogOpen,
    editingId,
    showMoreDetails,
    setShowMoreDetails,
    onOpenChange,
    openCreate,
    openEdit,
    markPaidOff,
    pasteAmountFromClipboard,
    // delete
    deletingDebt,
    isDeleting: deleteDebt.isPending,
    requestDelete,
    cancelDelete,
    confirmDelete,
    // update mode gate (debt with history)
    updateModeOpen: pendingUpdate !== null,
    updateModeOriginalChanged: pendingUpdate?.originalAmountChanged ?? false,
    updateModeBefore: pendingUpdate?.before,
    updateModeAfter: pendingUpdate?.after,
    updateModeTotalRepaid: pendingUpdate?.totalRepaid ?? 0,
    isSavingUpdateMode: updateDebt.isPending,
    confirmUpdateMode,
    cancelUpdateMode: () => setPendingUpdate(null),
    // detail
    openDetail,
  }
}
