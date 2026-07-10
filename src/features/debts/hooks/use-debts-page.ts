import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { useDebts } from '@/features/debts/hooks/use-debts'
import {
  amountToRaw,
  buildDebtSchema,
  defaultValues,
  parseAmountInput,
  type DebtForm,
  type DebtSummary,
} from '@/features/debts/model/debts-form'
import type { DebtStatus } from '@/features/debts/model/debts.types'
import { useMembers } from '@/features/members/hooks/use-members'
import { getErrorMessage } from '@/shared/lib/get-error-message'

export function useDebtsPage() {
  const location = useLocation()
  const { debts, createDebt, updateDebt, isLoading } = useDebts()
  const { assets } = useAssets()
  const { members } = useMembers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)

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
  const selectedLenderType = useWatch({ control, name: 'lenderType' })
  const originalAmountValue = useWatch({ control, name: 'originalAmount' })
  const isSavingDebt = createDebt.isPending || updateDebt.isPending

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
        interestSummary: editingDebt.interestSummary ?? '',
        note: editingDebt.note ?? '',
      })
      return
    }

    reset({
      ...defaultValues,
      ownerMemberId: memberOptions[0]?.value ?? '',
      receivedToAssetId: assetOptions[0]?.value ?? '',
    })
  }, [assetOptions, dialogOpen, editingDebt, memberOptions, reset])

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
        interestType: values.interestSummary.trim() ? values.interestSummary.trim() : undefined,
        note: values.note.trim() || undefined,
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
  }
}
