import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { usePayments } from '@/features/payments/hooks/use-payments'
import { type PaymentStatus } from '@/features/payments/model/payments'
import {
  amountToRaw,
  amountToVnd,
  buildPaymentSchema,
  daysUntilDue,
  defaultPaymentFormValues,
  dueToIso,
  sumAmounts,
  type PaymentForm,
  type PaymentGroup,
  type PaymentGroupKey,
  type PaymentTab,
} from '@/features/payments/model/payments-form'
import { getErrorMessage } from '@/shared/lib/get-error-message'
import { formatVndShort } from '@/shared/lib/format-money'

export function usePaymentsPage() {
  const { t } = useTranslation()
  const { payments, createPayment, updatePayment, deletePayment } = usePayments()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tab, setTab] = useState<PaymentTab>('all')
  const [query, setQuery] = useState('')
  const isEditing = editingId !== null
  const isSavingPayment = createPayment.isPending || updatePayment.isPending

  const strip = useMemo(() => {
    const next7 = payments.filter((p) => {
      const d = daysUntilDue(p.due)
      return d >= 0 && d <= 7
    })
    const next30 = payments.filter((p) => {
      const d = daysUntilDue(p.due)
      return d >= 0 && d <= 30
    })
    const discuss = payments.filter((p) => p.status === 'pending' || p.status === 'important')
    return {
      next7: next7.length,
      next7Amount: formatVndShort(sumAmounts(next7)),
      next30: next30.length,
      next30Amount: formatVndShort(sumAmounts(next30)),
      discuss: discuss.length,
      total: formatVndShort(sumAmounts(payments)),
    }
  }, [payments])

  const nearestPayment = useMemo(() => {
    const upcoming = payments
      .map((p) => ({ payment: p, days: daysUntilDue(p.due) }))
      .filter((entry) => entry.days >= 0)
      .sort((a, b) => a.days - b.days)
    return upcoming[0]
  }, [payments])

  const visiblePayments = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return payments.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false
      if (!needle) return true
      return p.name.toLowerCase().includes(needle)
    })
  }, [payments, query, tab])

  const groups = useMemo<PaymentGroup[]>(() => {
    const buckets: Record<PaymentGroupKey, PaymentGroup['items']> = {
      overdue: [],
      next7: [],
      next30: [],
      later: [],
    }
    for (const payment of visiblePayments) {
      const d = daysUntilDue(payment.due)
      if (d < 0) buckets.overdue.push(payment)
      else if (d <= 7) buckets.next7.push(payment)
      else if (d <= 30) buckets.next30.push(payment)
      else buckets.later.push(payment)
    }
    return (['overdue', 'next7', 'next30', 'later'] as const)
      .map((key) => ({ key, items: buckets[key] }))
      .filter((group) => group.items.length > 0)
  }, [visiblePayments])

  function dueMeta(due: string) {
    const d = daysUntilDue(due)
    if (d < 0) return t('payments.due.overdue', { count: Math.abs(d) })
    if (d === 0) return t('payments.due.today')
    return t('payments.due.inDays', { count: d })
  }

  const paymentSchema = useMemo(() => buildPaymentSchema(t), [t])

  const paymentStatusLabels: Record<PaymentStatus, string> = {
    important: t('options.paymentStatus.important'),
    normal: t('options.paymentStatus.normal'),
    pending: t('options.paymentStatus.pending'),
  }

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: defaultPaymentFormValues,
    mode: 'onChange',
  })

  const { reset, handleSubmit } = form

  const editingPayment = editingId
    ? payments.find((payment) => payment.id === editingId)
    : undefined
  const deletingPayment = deleteId
    ? payments.find((payment) => payment.id === deleteId)
    : undefined

  useEffect(() => {
    if (!formOpen) return
    if (editingPayment) {
      reset({
        name: editingPayment.name,
        amount: amountToRaw(editingPayment.amountValue),
        due: dueToIso(editingPayment.due),
        status: editingPayment.status,
      })
      return
    }
    reset(defaultPaymentFormValues)
  }, [editingPayment, formOpen, reset])

  function openCreate() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(paymentId: string) {
    setEditingId(paymentId)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditingId(null)
  }

  async function onSubmit(values: PaymentForm) {
    try {
      const payload = {
        name: values.name.trim(),
        amount: amountToVnd(values.amount),
        dueDate: values.due,
        status: values.status,
      } as const

      if (editingId) {
        await updatePayment.mutateAsync({ paymentId: editingId, payload })
        toast.success('Cap nhat khoan sap toi thanh cong.')
      } else {
        await createPayment.mutateAsync(payload)
        toast.success('Tao khoan sap toi thanh cong.')
      }

      handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, editingId ? 'Khong the cap nhat khoan sap toi.' : 'Khong the tao khoan sap toi.'))
    }
  }

  async function handleDeletePayment(paymentId: string) {
    try {
      await deletePayment.mutateAsync(paymentId)
      toast.success('Da xoa khoan sap toi.')
      if (editingId === paymentId) handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the xoa khoan sap toi.'))
      throw error
    }
  }

  return {
    // data
    payments,
    strip,
    nearestPayment,
    visiblePayments,
    groups,
    paymentStatusLabels,
    dueMeta,
    // toolbar state
    tab,
    setTab,
    query,
    setQuery,
    // form
    form,
    isEditing,
    isSavingPayment,
    submit: handleSubmit(onSubmit),
    // dialog
    formOpen,
    openCreate,
    openEdit,
    handleFormOpenChange,
    // delete
    deleteId,
    setDeleteId,
    deletingPayment,
    isDeleting: deletePayment.isPending,
    handleDeletePayment,
  }
}
