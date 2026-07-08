import { zodResolver } from '@hookform/resolvers/zod'
import { Landmark, MoreHorizontal, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useLocation } from 'react-router-dom'

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
  ResponsiveDialogDescription,
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
import type { DebtItem, DebtStatus, DebtType, LenderType } from '@/features/debts/model/debts.types'
import { useMembers } from '@/features/members/hooks/use-members'

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
  const { debts: seedDebts } = useDebts()
  const { assets } = useAssets()
  const { members } = useMembers()
  const [debts, setDebts] = useState<DebtItem[]>(seedDebts)
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
      setEditingId(null)
      setShowMoreDetails(false)
      setDialogOpen(true)
      window.history.replaceState({}, document.title)
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

  function onSubmit(values: DebtForm) {
    const owner = members.find((member) => member.id === values.ownerMemberId)
    const asset = assets.find((item) => item.id === values.receivedToAssetId)
    const nextDebt: DebtItem = {
      id: editingId ?? crypto.randomUUID(),
      name: values.name.trim(),
      debtType: values.debtType,
      lenderType: values.lenderType,
      lenderName: values.lenderName.trim(),
      originalAmount: values.originalAmount.trim(),
      outstandingAmount: values.outstandingAmount.trim(),
      currency: 'VND',
      borrowedAt: values.borrowedAt,
      expectedFinalDueDate: values.expectedFinalDueDate || undefined,
      status:
        values.expectedFinalDueDate && values.expectedFinalDueDate < '2026-07-08'
          ? 'overdue'
          : 'active',
      ownerMemberId: values.ownerMemberId || undefined,
      ownerName: owner?.name,
      receivedToAssetId: values.receivedToAssetId || undefined,
      receivedToAssetName: asset?.name,
      paymentFrequency: values.paymentFrequency,
      fixedPaymentAmount: values.fixedPaymentAmount.trim() || undefined,
      interestSummary: values.interestSummary.trim() || undefined,
      note: values.note.trim() || undefined,
    }

    if (editingId) {
      setDebts((current) => current.map((debt) => (debt.id === editingId ? nextDebt : debt)))
    } else {
      setDebts((current) => [nextDebt, ...current])
    }

    onOpenChange(false)
  }

  function markPaidOff(id: string) {
    setDebts((current) =>
      current.map((debt) =>
        debt.id === id ? { ...debt, status: 'paid_off', outstandingAmount: '0' } : debt,
      ),
    )
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
          {debts.map((debt) => (
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
                    {debt.ownerName ? <Badge variant="secondary">Phụ trách: {debt.ownerName}</Badge> : null}
                    {debt.receivedToAssetName ? (
                      <Badge variant="secondary">Nhận vào {debt.receivedToAssetName}</Badge>
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
                      <Button size="sm" onClick={() => markPaidOff(debt.id)}>
                        Đã trả xong
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
          ))}
        </div>
      </Card>

      <ResponsiveDialog open={dialogOpen} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent className="sm:max-w-3xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{editingId ? 'Sửa khoản nợ' : 'Thêm khoản vay'}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Ghi khoản vay theo cách nhẹ nhàng: tiền nhận vào đâu, đang nợ ai và còn bao nhiêu.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="rounded-3xl bg-[hsl(var(--muted))]/50 px-4 py-3 text-sm text-muted-foreground">
              Khi vay tiền, tài sản nhận vào sẽ tăng nhưng khoản nợ cũng tăng tương ứng, nên tổng tài sản ròng không bị nhìn đẹp giả.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tên khoản vay" error={errors.name?.message}>
                <Input placeholder="Ví dụ: Vay sửa nhà" {...register('name')} />
              </FormField>
              <FormField label="Số tiền vay" error={errors.originalAmount?.message}>
                <Input placeholder="Ví dụ: 100M" {...register('originalAmount')} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Vay từ đâu?">
                <Controller
                  control={control}
                  name="lenderType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nơi cho vay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">Người thân</SelectItem>
                        <SelectItem value="friend">Bạn bè</SelectItem>
                        <SelectItem value="bank">Ngân hàng</SelectItem>
                        <SelectItem value="credit_institution">Tổ chức tín dụng</SelectItem>
                        <SelectItem value="company">Công ty</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Tên người / nơi cho vay" error={errors.lenderName?.message}>
                <Input placeholder="Ví dụ: VPBank, Mẹ" {...register('lenderName')} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nhận vào đâu?">
                <Controller
                  control={control}
                  name="receivedToAssetId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
                      <SelectTrigger>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Ngày vay">
                <Input type="date" {...register('borrowedAt')} />
              </FormField>
              <FormField label="Còn nợ bao nhiêu?" error={errors.outstandingAmount?.message}>
                <Input placeholder="Ví dụ: 84M" {...register('outstandingAmount')} />
              </FormField>
            </div>

            <Button type="button" variant="ghost" className="px-0" onClick={() => setShowMoreDetails((value) => !value)}>
              {showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm chi tiết'}
            </Button>

            {showMoreDetails ? (
              <div className="grid gap-4 rounded-3xl border border-border/70 bg-[hsl(var(--muted))]/40 p-4 sm:grid-cols-2">
                <FormField label="Loại khoản vay">
                  <Controller
                    control={control}
                    name="debtType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
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
                <FormField label="Hạn kết thúc dự kiến">
                  <Input type="date" {...register('expectedFinalDueDate')} />
                </FormField>
                <FormField label="Tần suất trả">
                  <Controller
                    control={control}
                    name="paymentFrequency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
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
                <FormField label="Mỗi kỳ dự kiến">
                  <Input placeholder="Ví dụ: 8,5M" {...register('fixedPaymentAmount')} />
                </FormField>
                <FormField label="Lãi suất / cách tính">
                  <Input placeholder="Ví dụ: 9.2%/năm" {...register('interestSummary')} />
                </FormField>
                <FormField label="Ghi chú" className="sm:col-span-2">
                  <Textarea rows={4} placeholder="Thêm bối cảnh nếu cần." {...register('note')} />
                </FormField>
              </div>
            ) : null}

            <ResponsiveDialogFooter className="border-t border-border/70 pt-4">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!isValid}>
                {editingId ? 'Lưu thay đổi' : 'Lưu khoản vay'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
