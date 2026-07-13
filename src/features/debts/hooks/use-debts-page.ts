import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { useDebts } from '@/features/debts/hooks/use-debts'
import type { DebtPayload } from '@/features/debts/api/debts.repository'
import type { DebtUpdateModeChoice } from '@/features/debts/ui/components/debt-update-mode-dialog'
import { useEvents } from '@/features/events/hooks/use-events'
import {
  amountToRaw,
  buildDebtSchema,
  defaultValues,
  parseAmountInput,
  type DebtForm,
  type DebtSummary,
} from '@/features/debts/model/debts-form'
import {
  averageAnnualRate,
  calcFromBackendEnum,
  calcToBackendEnum,
  estimateRepayment,
  fromInterestPeriodDtos,
  monthsBetween,
  toInterestPeriodDtos,
} from '@/features/debts/model/debts-interest'
import type { DebtItem, DebtStatus } from '@/features/debts/model/debts.types'
import { useMembers } from '@/features/members/hooks/use-members'
import { getErrorMessage } from '@/shared/lib/get-error-message'

export function useDebtsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { debts, createDebt, updateDebt, deleteDebt, isLoading } = useDebts()
  const { events } = useEvents()
  const { assets } = useAssets()
  const { members } = useMembers()
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
      debtType: DebtItem['debtType']
      name: string
    }
    after: {
      originalAmount: number
      fixedPaymentAmount?: number
      interestRate?: number
      installments?: number
      debtType: DebtItem['debtType']
      name: string
    }
    totalRepaid: number
  } | null>(null)

  const debtSchema = useMemo(() => buildDebtSchema(), [])

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
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
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

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'openCreate' in location.state) {
      const timer = window.setTimeout(() => {
        setEditingId(null)
        setShowMoreDetails(false)
        setDialogOpen(true)
      }, 0)
      window.history.replaceState({}, document.title)
      return () => window.clearTimeout(timer)
    }
  }, [location.state])

  useEffect(() => {
    if (!dialogOpen) return

    if (editingDebt) {
      // Rehydrate the interest stages straight from the persisted periods.
      // Fall back to a single stage seeded from the averaged rate the backend
      // returns (e.g. "9.2%") for older debts with no per-stage detail.
      const fallbackRate = (editingDebt.interestSummary ?? '').replace(/[^0-9.,]/g, '')
      const periods =
        fromInterestPeriodDtos(editingDebt.interestPeriods) ??
        (fallbackRate ? [{ ratePct: fallbackRate, months: '' }] : defaultValues.interestPeriods)

      reset({
        name: editingDebt.name,
        debtType: editingDebt.debtType,
        lenderType: editingDebt.lenderType,
        lenderName: editingDebt.lenderName,
        originalAmount: amountToRaw(editingDebt.originalAmountValue),
        outstandingAmount: amountToRaw(editingDebt.outstandingAmountValue),
        borrowedAt: editingDebt.borrowedAt,
        expectedFinalDueDate: editingDebt.expectedFinalDueDate ?? '',
        ownerMemberId: editingDebt.ownerMemberId ?? '',
        receivedToAssetId: editingDebt.receivedToAssetId ?? '',
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
      ownerMemberId: memberOptions[0]?.value ?? '',
      receivedToAssetId: receiveAssetOptions[0]?.value ?? '',
    })
  }, [receiveAssetOptions, dialogOpen, editingDebt, memberOptions, reset])

  function openCreate() {
    setEditingId(null)
    setShowMoreDetails(false)
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setShowMoreDetails(true)
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
      const interestPeriods = values.hasInterest
        ? toInterestPeriodDtos(values.interestPeriods)
        : []

      const payload = {
        name: values.name.trim(),
        debtType: values.debtType,
        lenderType: values.lenderType,
        lenderName: values.lenderName.trim() || undefined,
        originalAmount: parseAmountInput(values.originalAmount),
        outstandingAmount: parseAmountInput(values.outstandingAmount),
        currency: 'VND',
        borrowedAt: values.borrowedAt || undefined,
        expectedFinalDueDate: values.expectedFinalDueDate || undefined,
        status: (values.expectedFinalDueDate && values.expectedFinalDueDate < '2026-07-08'
          ? 'overdue'
          : 'active') as DebtStatus,
        ownerMemberId: values.ownerMemberId || undefined,
        receivedToAssetId: values.receivedToAssetId || undefined,
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
            debtType: editingDebt?.debtType ?? payload.debtType,
            name: editingDebt?.name ?? payload.name,
          },
          after: {
            originalAmount: payload.originalAmount,
            fixedPaymentAmount: payload.fixedPaymentAmount,
            interestRate: repaymentEstimate?.annualRatePct,
            installments: repaymentEstimate?.installments,
            debtType: payload.debtType,
            name: payload.name,
          },
        })
        setDialogOpen(false)
        return
      }

      if (editingId) {
        await updateDebt.mutateAsync({ debtId: editingId, payload })
        toast.success('Cap nhat khoan no thanh cong.')
      } else {
        await createDebt.mutateAsync(payload)
        toast.success('Tao khoan no thanh cong.')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingId ? 'Khong the cap nhat khoan no.' : 'Khong the tao khoan no.',
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
      toast.success('Cap nhat khoan no thanh cong.')
      setPendingUpdate(null)
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the cap nhat khoan no.'))
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
      toast.success('Da xoa khoan no.')
      setDeletingId(null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the xoa khoan no.'))
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
      .then(() => toast.success('Da danh dau tra xong khoan no.'))
      .catch((error) =>
        toast.error(getErrorMessage(error, 'Khong the cap nhat trang thai khoan no.')),
      )
  }

  async function pasteAmountFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
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
