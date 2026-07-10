import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Landmark, MoreHorizontal, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/app/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import { Textarea } from '@/components/ui/textarea'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useDebts } from '@/features/debts/hooks/use-debts'
import type { DebtStatus, DebtType, LenderType } from '@/features/debts/model/debts.types'
import { useMembers } from '@/features/members/hooks/use-members'
import { getErrorMessage } from '@/shared/lib/get-error-message'

type DebtForm = {
  name: string
  debtType: DebtType
  lenderType: LenderType
  lenderName: string
  originalAmount: string
  outstandingAmount: string
  borrowedAt: string
  expectedFinalDueDate: string
  ownerMemberId: string
  receivedToAssetId: string
  paymentFrequency: 'none' | 'monthly' | 'quarterly' | 'yearly'
  fixedPaymentAmount: string
  interestSummary: string
  note: string
}

const defaultValues: DebtForm = {
  name: '',
  debtType: 'family_loan',
  lenderType: 'family',
  lenderName: '',
  originalAmount: '',
  outstandingAmount: '',
  borrowedAt: '2026-07-08',
  expectedFinalDueDate: '',
  ownerMemberId: '',
  receivedToAssetId: '',
  paymentFrequency: 'none',
  fixedPaymentAmount: '',
  interestSummary: '',
  note: '',
}

const quickLenderTypes: Array<{
  value: LenderType
  label: string
  debtType: DebtType
}> = [
  { value: 'family', label: 'Người thân', debtType: 'family_loan' },
  { value: 'bank', label: 'Ngân hàng', debtType: 'bank_loan' },
  { value: 'other', label: 'Khác', debtType: 'other' },
]

function parseAmountInput(raw: string) {
  const normalized = raw.trim().replace(/,/g, '.')
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([kKmMbB]?)$/)
  if (!match) return 0
  const base = Number(match[1])
  const suffix = match[2].toLowerCase()
  const factor =
    suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : 1
  return base * factor
}

function formatVndShortLocal(value: number) {
  if (value >= 1_000_000_000) return `${Math.round((value / 1_000_000_000) * 10) / 10}B`
  if (value >= 1_000_000) return `${Math.round((value / 1_000_000) * 10) / 10}M`
  if (value >= 1_000) return `${Math.round((value / 1_000) * 10) / 10}K`
  return `${value}`
}

function formatDate(isoDate?: string) {
  if (!isoDate) return 'Chưa chốt hạn'
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('vi-VN')
}

function getStatusTone(status: DebtStatus) {
  if (status === 'overdue') {
    return 'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))] border-none'
  }
  if (status === 'paid_off') {
    return 'bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))] border-none'
  }
  if (status === 'paused' || status === 'cancelled') {
    return 'bg-secondary text-muted-foreground border-none'
  }
  return 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))] border-none'
}

function getStatusLabel(status: DebtStatus) {
  switch (status) {
    case 'active':
      return 'Đang trả'
    case 'paid_off':
      return 'Đã xong'
    case 'paused':
      return 'Tạm dừng'
    case 'overdue':
      return 'Quá hạn'
    case 'cancelled':
      return 'Đã hủy'
  }
}

export function DebtsPage() {
  const location = useLocation()
  const { debts, createDebt, updateDebt, isLoading } = useDebts()
  const { assets } = useAssets()
  const { members } = useMembers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  const debtSchema = z
    .object({
      name: z.string().trim().min(1, 'Vui lòng nhập tên khoản nợ.'),
      debtType: z.enum([
        'family_loan',
        'friend_loan',
        'bank_loan',
        'consumer_finance',
        'mortgage',
        'credit_card',
        'installment',
        'other',
      ]),
      lenderType: z.enum(['family', 'friend', 'bank', 'credit_institution', 'company', 'other']),
      lenderName: z.string().trim().min(1, 'Vui lòng nhập nơi cho vay.'),
      originalAmount: z.string().trim().min(1, 'Vui lòng nhập số tiền vay.'),
      outstandingAmount: z.string().trim().min(1, 'Vui lòng nhập số còn nợ.'),
      borrowedAt: z.string().min(1, 'Vui lòng chọn ngày vay.'),
      expectedFinalDueDate: z.string(),
      ownerMemberId: z.string(),
      receivedToAssetId: z.string(),
      paymentFrequency: z.enum(['none', 'monthly', 'quarterly', 'yearly']),
      fixedPaymentAmount: z.string(),
      interestSummary: z.string(),
      note: z.string(),
    })
    .superRefine((value, ctx) => {
      if (parseAmountInput(value.originalAmount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['originalAmount'],
          message: 'Số tiền vay cần lớn hơn 0.',
        })
      }
      if (parseAmountInput(value.outstandingAmount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outstandingAmount'],
          message: 'Số còn nợ cần lớn hơn 0.',
        })
      }
      if (parseAmountInput(value.outstandingAmount) > parseAmountInput(value.originalAmount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outstandingAmount'],
          message: 'Số còn nợ không nên lớn hơn số vay ban đầu.',
        })
      }
    })

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
    defaultValues,
    mode: 'onChange',
  })

  const assetOptions = useMemo(
    () => assets.map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )
  const memberOptions = useMemo(
    () => members.filter((member) => member.status === 'active').map((member) => ({
      value: member.id,
      label: member.name,
    })),
    [members],
  )

  const editingDebt = editingId ? debts.find((item) => item.id === editingId) : undefined
  const selectedLenderType = useWatch({ control, name: 'lenderType' })
  const originalAmountValue = useWatch({ control, name: 'originalAmount' })
  const isSavingDebt = createDebt.isPending || updateDebt.isPending

  const summary = useMemo(() => {
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
        originalAmount: editingDebt.originalAmount,
        outstandingAmount: editingDebt.outstandingAmount,
        borrowedAt: editingDebt.borrowedAt,
        expectedFinalDueDate: editingDebt.expectedFinalDueDate ?? '',
        ownerMemberId: editingDebt.ownerMemberId ?? '',
        receivedToAssetId: editingDebt.receivedToAssetId ?? '',
        paymentFrequency: editingDebt.paymentFrequency ?? 'none',
        fixedPaymentAmount: editingDebt.fixedPaymentAmount ?? '',
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
        status: (
          values.expectedFinalDueDate && values.expectedFinalDueDate < '2026-07-08'
            ? 'overdue'
            : 'active'
        ) as DebtStatus,
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
      toast.error(getErrorMessage(error, editingId ? 'Khong the cap nhat khoan no.' : 'Khong the tao khoan no.'))
    }
  }

  function markPaidOff(id: string) {
    void updateDebt
      .mutateAsync({
        debtId: id,
        payload: { status: 'paid_off', outstandingAmount: 0 },
      })
      .then(() => toast.success('Da danh dau tra xong khoan no.'))
      .catch((error) => toast.error(getErrorMessage(error, 'Khong the cap nhat trang thai khoan no.')))
  }

  async function pasteAmountFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      const normalized = text.replace(/[^\d.,kKmMbB]/g, '').trim()
      if (!normalized) return
      setValue('originalAmount', normalized, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    } catch {
      // Clipboard access can be unavailable depending on browser permissions.
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Đang nợ"
        title="Khoản vay và khoản phải trả"
        description="Giữ phần nợ tách khỏi tài sản để nhà mình nhìn đúng bức tranh tài chính, nhưng vẫn cập nhật rất nhanh và dễ hiểu."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Vay tiền
          </Button>
        }
      />

      <SummaryStrip>
        <SummaryTile
          label="Đang nợ"
          value={`${formatVndShortLocal(summary.outstanding)} đ`}
          dotColor="hsl(var(--status-red))"
        />
        <SummaryTile
          label="Khoản đang mở"
          value={`${summary.activeCount} khoản`}
          dotColor="hsl(var(--status-orange))"
        />
        <SummaryTile
          label="Trả định kỳ"
          value={`${formatVndShortLocal(summary.monthlyPlanned)} đ`}
          dotColor="hsl(var(--status-blue))"
        />
        <SummaryTile
          label="Cần xem lại"
          value={`${summary.overdueCount} khoản`}
          inverted
        />
      </SummaryStrip>

      <Card className="p-5 md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="section-title text-xl font-semibold md:text-2xl">Danh sách khoản nợ</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mỗi khoản cho biết đang nợ ai, còn bao nhiêu và tiền vay đã nhận vào đâu.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!isLoading && debts.map((debt) => {
            const ownerName = members.find((member) => member.id === debt.ownerMemberId)?.name
            const receivedToAssetName = assets.find((asset) => asset.id === debt.receivedToAssetId)?.name

            return (
            <article
              key={debt.id}
              className="rounded-[28px] border border-border/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Landmark className="size-5 text-foreground" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold tracking-[-0.02em]">{debt.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {debt.lenderName} · vay ngày {formatDate(debt.borrowedAt)}
                      </p>
                    </div>
                    <Badge className={getStatusTone(debt.status)}>{getStatusLabel(debt.status)}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ownerName ? <Badge variant="secondary">Phụ trách: {ownerName}</Badge> : null}
                    {receivedToAssetName ? (
                      <Badge variant="secondary">Nhận vào {receivedToAssetName}</Badge>
                    ) : null}
                    {debt.fixedPaymentAmount ? (
                      <Badge variant="secondary">Mỗi kỳ {debt.fixedPaymentAmount}</Badge>
                    ) : null}
                    {debt.interestSummary ? (
                      <Badge variant="secondary">{debt.interestSummary}</Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Còn nợ {debt.outstandingAmount} đ trên tổng vay {debt.originalAmount} đ
                    {debt.expectedFinalDueDate ? ` · dự kiến xong ${formatDate(debt.expectedFinalDueDate)}` : ''}
                  </p>

                  {debt.note ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{debt.note}</p>
                  ) : null}
                </div>

                <div className="lg:w-[220px]">
                  <p className="money-number text-2xl font-semibold text-[hsl(var(--status-red))] lg:text-right">
                    {debt.outstandingAmount} đ
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                    {debt.status !== 'paid_off' ? (
                      <Button size="sm" disabled={updateDebt.isPending} onClick={() => markPaidOff(debt.id)}>
                        {updateDebt.isPending ? 'Dang cap nhat...' : 'Đã trả xong'}
                      </Button>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="secondary">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(debt.id)}>Chỉnh sửa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </article>
            )
          })}
        </div>
      </Card>

      <ResponsiveDialog open={dialogOpen} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent className="gap-0 overflow-hidden border-white bg-[#fcfcfd] p-0 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:max-w-[560px] sm:rounded-[32px]">
          <ResponsiveDialogHeader className="gap-0 border-b border-[#e8e8ee] px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
            <ResponsiveDialogTitle className="pr-10 text-[28px] font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1f]">
              {editingId ? 'Sửa khoản nợ' : 'Ghi nhanh khoản vay'}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <form className="flex max-h-[calc(94dvh-170px)] flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <section className="rounded-[30px] border border-[#e5e5ea] bg-[#f2f2f7]/70 p-4 sm:p-5">
                <FormField
                  label="Số tiền vay"
                  error={errors.originalAmount?.message}
                  className="space-y-3"
                >
                  <div className="flex min-h-[92px] items-end gap-2 rounded-[26px] border border-white/80 bg-white px-4 pb-4 pt-5 transition focus-within:border-[#7ab6ff] focus-within:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] sm:min-h-[108px] sm:px-5">
                    <Input
                      placeholder="100M"
                      inputMode="decimal"
                      className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 pb-0 pt-0 text-[52px] font-semibold leading-none tracking-[-0.07em] text-[#1d1d1f] ring-0 placeholder:text-[#a1a1a6] focus-visible:ring-0 sm:text-[68px]"
                      {...register('originalAmount')}
                    />
                    <span className="mb-1 shrink-0 text-2xl font-semibold tracking-[-0.04em] text-[#6e6e73] sm:mb-2 sm:text-3xl">
                      đ
                    </span>
                  </div>
                </FormField>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="text-sm text-[#6e6e73]">
                    {originalAmountValue?.trim() ? 'Khoản vay ban đầu' : 'Nhập nhanh theo dạng 100M, 8.5M, 250K'}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 bg-white px-3 text-sm font-semibold text-[hsl(var(--status-blue))] hover:bg-white/90"
                    onClick={pasteAmountFromClipboard}
                  >
                    Dán số tiền
                  </Button>
                </div>
              </section>

              <div className="grid grid-cols-3 gap-2">
                {quickLenderTypes.map((option) => {
                  const active =
                    option.value === 'other'
                      ? selectedLenderType !== 'family' && selectedLenderType !== 'bank'
                      : selectedLenderType === option.value

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={active ? 'default' : 'secondary'}
                      className={active ? 'bg-[#1d1d1f] text-white hover:bg-[#1d1d1f]/90' : 'bg-[#f2f2f7] text-[#1d1d1f] hover:bg-[#e8e8ee]'}
                      onClick={() => {
                        setValue('lenderType', option.value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                        setValue('debtType', option.debtType, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>

              <div className="space-y-4">
                <FormField label="Tên khoản vay" error={errors.name?.message}>
                  <Input
                    placeholder="Ví dụ: Vay mẹ sửa nhà"
                    className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
                    {...register('name')}
                  />
                </FormField>

                <FormField label="Mình vay ai?" error={errors.lenderName?.message}>
                  <Input
                    placeholder="Ví dụ: Mẹ, VPBank"
                    className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
                    {...register('lenderName')}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Hiện còn nợ" error={errors.outstandingAmount?.message}>
                    <div className="flex h-[52px] items-center gap-2 rounded-[20px] border border-[#e5e5ea] bg-white px-4">
                      <Input
                        placeholder="84M"
                        inputMode="decimal"
                        className="h-auto border-0 bg-transparent px-0 py-0 text-[17px] font-semibold focus-visible:ring-0"
                        {...register('outstandingAmount')}
                      />
                      <span className="shrink-0 text-sm font-medium text-[#6e6e73]">đ</span>
                    </div>
                  </FormField>

                  <FormField label="Ngày vay">
                    <Input
                      type="date"
                      className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
                      {...register('borrowedAt')}
                    />
                  </FormField>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e5e5ea] bg-[#f2f2f7]/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm">
                    ↗
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                      Khoản này sẽ được tính vào nợ của nhà mình.
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[#6e6e73]">
                      Số tiền vay và số còn nợ sẽ được cập nhật trong tổng quan, nên tài sản ròng không bị nhìn đẹp giả.
                    </p>
                  </div>
                </div>
              </div>

              <section className="overflow-hidden rounded-3xl border border-[#e5e5ea] bg-white">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => setShowMoreDetails((value) => !value)}
                >
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                      Thêm lịch trả nợ, ghi chú
                    </p>
                    <p className="mt-1 text-sm text-[#6e6e73]">
                      Không bắt buộc, có thể bổ sung sau
                    </p>
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f2f2f7] text-[#6e6e73]">
                    <ChevronDown
                      className={`size-4 transition-transform ${showMoreDetails ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {showMoreDetails ? (
                  <div className="grid gap-4 border-t border-[#e5e5ea]/70 px-4 py-4 sm:grid-cols-2">
                    <FormField label="Tiền nhận vào đâu?">
                      <Controller
                        control={control}
                        name="receivedToAssetId"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]">
                              <SelectValue placeholder="Chọn nơi nhận tiền" />
                            </SelectTrigger>
                            <SelectContent>
                              {assetOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>

                    <FormField label="Người phụ trách">
                      <Controller
                        control={control}
                        name="ownerMemberId"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]">
                              <SelectValue placeholder="Chọn người phụ trách" />
                            </SelectTrigger>
                            <SelectContent>
                              {memberOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>

                    <FormField label="Dự kiến trả xong">
                      <Input
                        type="date"
                        className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
                        {...register('expectedFinalDueDate')}
                      />
                    </FormField>

                    <FormField label="Tần suất trả">
                      <Controller
                        control={control}
                        name="paymentFrequency"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]">
                              <SelectValue placeholder="Chọn tần suất" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Linh hoạt</SelectItem>
                              <SelectItem value="monthly">Hàng tháng</SelectItem>
                              <SelectItem value="quarterly">Hàng quý</SelectItem>
                              <SelectItem value="yearly">Hàng năm</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>

                    <FormField label="Loại khoản vay">
                      <Controller
                        control={control}
                        name="debtType"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]">
                              <SelectValue placeholder="Chọn loại khoản vay" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="family_loan">Vay người thân</SelectItem>
                              <SelectItem value="friend_loan">Vay bạn bè</SelectItem>
                              <SelectItem value="bank_loan">Vay ngân hàng</SelectItem>
                              <SelectItem value="consumer_finance">Tài chính tiêu dùng</SelectItem>
                              <SelectItem value="mortgage">Vay mua nhà</SelectItem>
                              <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                              <SelectItem value="installment">Trả góp</SelectItem>
                              <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>

                    <FormField label="Mỗi lần trả khoảng">
                      <Input
                        placeholder="Ví dụ: 8,5M"
                        className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
                        {...register('fixedPaymentAmount')}
                      />
                    </FormField>

                    <FormField label="Lãi suất / cách tính" className="sm:col-span-2">
                      <Input
                        placeholder="Ví dụ: 9.2%/năm"
                        className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
                        {...register('interestSummary')}
                      />
                    </FormField>

                    <FormField label="Ghi chú" className="sm:col-span-2">
                      <Textarea
                        rows={4}
                        placeholder="Thêm bối cảnh nếu cần."
                        className="rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
                        {...register('note')}
                      />
                    </FormField>
                  </div>
                ) : null}
              </section>
            </div>

            <ResponsiveDialogFooter className="border-t border-[#e8e8ee] bg-[#fcfcfd] px-5 py-4 sm:px-6">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!isValid || isSavingDebt}>
                {isSavingDebt ? 'Dang luu...' : editingId ? 'Lưu thay đổi' : 'Lưu khoản vay'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
