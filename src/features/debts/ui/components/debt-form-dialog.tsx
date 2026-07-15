import { Plus, X } from 'lucide-react'
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventField,
  EventFieldInput,
  EventFieldTextarea,
  EventMoneyInput,
  eventDateTriggerClass,
  eventSelectTriggerClass,
} from '@/components/ui/event-field'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type DebtForm } from '@/features/debts/model/debts-form'
import { addMonthsIso, type RepaymentEstimate } from '@/features/debts/model/debts-interest'
import { isFixedScheduleLender, type LenderType } from '@/features/debts/model/debts.types'
import { cn } from '@/shared/lib/utils'

type Option = { value: string; label: string }

const DUE_DATE_PRESETS = [
  { label: '6 tháng', months: 6 },
  { label: '1 năm', months: 12 },
  { label: '2 năm', months: 24 },
  { label: '3 năm', months: 36 },
  { label: '5 năm', months: 60 },
]

const CALC_OPTIONS: Array<{ value: DebtForm['interestCalc']; label: string; hint: string }> = [
  { value: 'fixed', label: 'Trả cố định', hint: 'Mỗi kỳ trả bằng nhau (niên kim)' },
  { value: 'reducing', label: 'Dư nợ giảm dần', hint: 'Gốc chia đều, lãi trên dư nợ' },
]

const FREQUENCY_LABELS: Record<DebtForm['paymentFrequency'], string> = {
  none: 'Linh hoạt',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
}

function formatVnd(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value
  if (!amount || !Number.isFinite(amount)) return 'Chưa nhập'
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))} đ`
}

type DebtFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  control: Control<DebtForm>
  register: UseFormRegister<DebtForm>
  errors: FieldErrors<DebtForm>
  isValid: boolean
  isSavingDebt: boolean
  setValue: UseFormSetValue<DebtForm>
  selectedLenderType: LenderType
  showMoreDetails: boolean
  setShowMoreDetails: (updater: (value: boolean) => boolean) => void
  receiveAssetOptions: Option[]
  memberOptions: Option[]
  repaymentEstimate: RepaymentEstimate | null
  termMonths: number | null
  onSubmit: () => void
  pasteAmountFromClipboard: () => void
}

export function DebtFormDialog({
  open,
  onOpenChange,
  editingId,
  control,
  register,
  errors,
  isValid,
  isSavingDebt,
  setValue,
  selectedLenderType,
  showMoreDetails,
  setShowMoreDetails,
  receiveAssetOptions,
  memberOptions,
  repaymentEstimate,
  termMonths,
  onSubmit,
  pasteAmountFromClipboard,
}: DebtFormDialogProps) {
  const { fields: interestFields, append: appendInterest, remove: removeInterest } = useFieldArray({
    control,
    name: 'interestPeriods',
  })
  const hasInterest = useWatch({ control, name: 'hasInterest' })
  const borrowedAt = useWatch({ control, name: 'borrowedAt' })
  const expectedFinalDueDate = useWatch({ control, name: 'expectedFinalDueDate' })
  const watchedPeriods = useWatch({ control, name: 'interestPeriods' })
  const originalAmount = useWatch({ control, name: 'originalAmount' })
  const outstandingAmount = useWatch({ control, name: 'outstandingAmount' })
  const paymentFrequency = useWatch({ control, name: 'paymentFrequency' })
  const fixedPaymentAmount = useWatch({ control, name: 'fixedPaymentAmount' })
  const receivedToAssetId = useWatch({ control, name: 'receivedToAssetId' })
  const isPlanStep = showMoreDetails

  const earlierStagesMonths = (watchedPeriods ?? []).slice(0, -1).reduce((sum, period) => {
    const months = Number(String(period?.months ?? '').replace(',', '.'))
    return sum + (Number.isFinite(months) && months > 0 ? months : 0)
  }, 0)
  const lastStageMonths = termMonths != null ? Math.max(0, termMonths - earlierStagesMonths) : null
  const receivedAssetName = receiveAssetOptions.find((option) => option.value === receivedToAssetId)?.label

  function goToStep(step: 1 | 2) {
    setShowMoreDetails(() => step === 2)
  }

  function applyDuePreset(months: number) {
    if (!borrowedAt) return
    setValue('expectedFinalDueDate', addMonthsIso(borrowedAt, months), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function applyAmount(value: string) {
    if (!outstandingAmount || outstandingAmount === originalAmount) {
      setValue('outstandingAmount', value, { shouldDirty: true, shouldValidate: true })
    }
    setValue('originalAmount', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
  }

  function toggleReceiveEvent(enabled: boolean) {
    setValue('receivedToAssetId', enabled ? (receiveAssetOptions[0]?.value ?? '') : '', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[92dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[900px]">
        <ResponsiveDialogHeader className="border-b border-border px-6 py-5 pr-14 text-left sm:px-8 sm:pr-16">
          <p className="text-xs font-medium text-muted-foreground">
            {editingId ? 'Chỉnh sửa khoản nợ' : 'Khoản nợ mới'}
          </p>
          <ResponsiveDialogTitle className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
            {editingId ? 'Cập nhật khoản vay' : 'Ghi nhận khoản vay'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-2 max-w-xl text-sm leading-6">
            Khoản vay được tính vào nợ của gia đình. Tiền chỉ được cộng vào tài sản khi bạn bật ghi nhận sự kiện nhận tiền.
          </ResponsiveDialogDescription>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <StepTab step={1} active={!isPlanStep} label="Thông tin khoản vay" onClick={() => goToStep(1)} />
            <StepTab step={2} active={isPlanStep} label="Kế hoạch trả" onClick={() => goToStep(2)} />
          </div>
        </ResponsiveDialogHeader>

        <form className="grid min-h-0 grid-rows-[1fr_auto]" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
            {!isPlanStep ? (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <div className="space-y-5">
                  <div>
                    <EventField
                      label="Số tiền vay"
                      error={errors.originalAmount?.message}
                      trailing={<span className="text-sm font-medium text-muted-foreground">VND</span>}
                    >
                      <Controller
                        control={control}
                        name="originalAmount"
                        render={({ field }) => (
                          <EventMoneyInput
                            placeholder="0"
                            value={field.value}
                            onChange={(value) => {
                              if (!outstandingAmount || outstandingAmount === field.value) {
                                setValue('outstandingAmount', value, { shouldDirty: true, shouldValidate: true })
                              }
                              field.onChange(value)
                            }}
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </EventField>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      {[
                        ['10000000', '10 triệu'],
                        ['50000000', '50 triệu'],
                        ['100000000', '100 triệu'],
                      ].map(([value, label]) => (
                        <button key={value} type="button" onClick={() => applyAmount(value)} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
                          {label}
                        </button>
                      ))}
                      <button type="button" onClick={pasteAmountFromClipboard} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[hsl(var(--accent))]">
                        Dán số tiền
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <EventField label="Tên khoản vay" error={errors.name?.message}>
                      <EventFieldInput placeholder="Ví dụ: Vay mua xe" {...register('name')} />
                    </EventField>
                    <EventField label="Vay từ ai?" error={errors.lenderName?.message}>
                      <EventFieldInput placeholder="Ví dụ: VPBank, mẹ" {...register('lenderName')} />
                    </EventField>
                    <EventField label="Ngày nhận khoản vay" error={errors.borrowedAt?.message}>
                      <Controller control={control} name="borrowedAt" render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />} />
                    </EventField>
                    <EventField label="Hiện còn nợ" error={errors.outstandingAmount?.message} trailing={<span className="text-xs text-muted-foreground">VND</span>}>
                      <Controller control={control} name="outstandingAmount" render={({ field }) => <EventMoneyInput placeholder="Mặc định bằng số tiền vay" className="text-[18px] sm:text-[20px]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
                    </EventField>
                  </div>
                </div>

                <aside className="h-fit rounded-2xl bg-muted/65 p-5">
                  <p className="text-xs font-medium text-muted-foreground">Phân loại</p>
                  <div className="mt-4 space-y-4">
                    <EventField label="Loại khoản vay" className="[&>div]:bg-card">
                      <Controller control={control} name="lenderType" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_institution">Ngân hàng / Tổ chức</SelectItem>
                            <SelectItem value="relative">Người thân</SelectItem>
                            <SelectItem value="other">Khoản vay khác</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </EventField>
                    <EventField label="Người phụ trách" className="[&>div]:bg-card">
                      <Controller control={control} name="ownerMemberId" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}><SelectValue placeholder="Chưa phân công" /></SelectTrigger>
                          <SelectContent>{memberOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                        </Select>
                      )} />
                    </EventField>
                  </div>
                  <p className="mt-5 text-xs leading-5 text-muted-foreground">Loại khoản vay giúp phân nhóm và xác định các thông tin bắt buộc trong kế hoạch trả.</p>
                </aside>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kế hoạch trả</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <EventField label="Tần suất trả">
                        <Controller control={control} name="paymentFrequency" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={eventSelectTriggerClass}><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="monthly">Hàng tháng</SelectItem><SelectItem value="quarterly">Hàng quý</SelectItem><SelectItem value="yearly">Hàng năm</SelectItem><SelectItem value="none">Linh hoạt</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </EventField>
                      <EventField label="Dự kiến trả xong" error={errors.expectedFinalDueDate?.message}>
                        <Controller control={control} name="expectedFinalDueDate" render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />} />
                      </EventField>
                      <div className="sm:col-span-2 flex flex-wrap gap-1.5">
                        {DUE_DATE_PRESETS.map((preset) => {
                          const active = !!borrowedAt && expectedFinalDueDate === addMonthsIso(borrowedAt, preset.months)
                          return <button key={preset.months} type="button" disabled={!borrowedAt} onClick={() => applyDuePreset(preset.months)} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40', active ? 'bg-[hsl(var(--accent))] text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>{preset.label}</button>
                        })}
                      </div>
                      <EventField label="Số tiền mỗi kỳ" trailing={<span className="text-xs text-muted-foreground">VND</span>}>
                        <Controller control={control} name="fixedPaymentAmount" render={({ field }) => <EventMoneyInput placeholder="Không bắt buộc" className="text-[18px] sm:text-[20px]" value={field.value} onChange={(value) => { field.onChange(value); setValue('fixedPaymentTouched', true, { shouldDirty: true }) }} onBlur={field.onBlur} />} />
                      </EventField>
                      <div className="flex items-center rounded-[20px] bg-muted px-5 py-4">
                        {repaymentEstimate ? <div className="flex w-full items-center justify-between gap-3"><div><p className="text-sm font-medium">Gợi ý {formatVnd(repaymentEstimate.perPayment)} / kỳ</p><p className="mt-1 text-xs text-muted-foreground">{repaymentEstimate.installments} kỳ{termMonths ? ` · ${termMonths} tháng` : ''}</p></div><button type="button" onClick={() => { setValue('fixedPaymentAmount', String(repaymentEstimate.perPayment), { shouldValidate: true }); setValue('fixedPaymentTouched', false, { shouldDirty: true }) }} className="shrink-0 text-xs font-semibold text-[hsl(var(--accent))]">Sử dụng</button></div> : <p className="text-xs leading-5 text-muted-foreground">Chọn kỳ hạn và tần suất để nhận gợi ý.</p>}
                      </div>
                    </div>
                  </div>

                  {isFixedScheduleLender(selectedLenderType) ? <p className="rounded-2xl bg-[hsla(var(--status-orange),0.1)] px-4 py-3 text-sm text-muted-foreground">Khoản vay ngân hàng cần có lãi suất, ngày kết thúc và số tiền trả định kỳ.</p> : null}

                  <div className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Khoản vay có lãi</p><p className="mt-1 text-xs text-muted-foreground">Bật để ghi nhận lãi suất và cách tính lãi.</p></div><Controller control={control} name="hasInterest" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} /></div>
                    {hasInterest ? <div className="mt-4 space-y-4 border-t border-border pt-4">
                      <InterestPeriods fields={interestFields} register={register} lastStageMonths={lastStageMonths} onAppend={() => appendInterest({ ratePct: '', months: '' })} onRemove={removeInterest} />
                      <EventField label="Cách tính lãi" className="[&>div]:bg-muted/70"><Controller control={control} name="interestCalc" render={({ field }) => <div className="grid grid-cols-2 gap-2">{CALC_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => field.onChange(option.value)} className={cn('rounded-xl px-3 py-2.5 text-left transition', field.value === option.value ? 'bg-[hsl(var(--accent))] text-white' : 'bg-card')}><p className="text-sm font-semibold">{option.label}</p><p className={cn('mt-0.5 text-xs', field.value === option.value ? 'text-white/70' : 'text-muted-foreground')}>{option.hint}</p></button>)}</div>} /></EventField>
                    </div> : null}
                  </div>

                  <div className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Ghi nhận sự kiện nhận tiền</p><p className="mt-1 text-xs text-muted-foreground">Cộng số tiền vay vào ví hoặc tài khoản được chọn.</p></div><Switch checked={!!receivedToAssetId} onCheckedChange={toggleReceiveEvent} /></div>
                    {receivedToAssetId ? <div className="mt-4 border-t border-border pt-4"><EventField label="Tiền nhận vào" className="[&>div]:bg-muted/70"><Controller control={control} name="receivedToAssetId" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className={eventSelectTriggerClass}><SelectValue placeholder="Chọn ví hoặc tài khoản" /></SelectTrigger><SelectContent>{receiveAssetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>} /></EventField></div> : null}
                  </div>

                  <EventField label="Ghi chú"><EventFieldTextarea rows={3} placeholder="Bối cảnh khoản vay, thỏa thuận riêng hoặc thông tin cần nhớ..." {...register('note')} /></EventField>
                </div>

                <aside className="h-fit rounded-2xl bg-muted/65 p-5 lg:sticky lg:top-0">
                  <p className="text-xs font-medium text-muted-foreground">Tóm tắt</p>
                  <h3 className="mt-1 text-lg font-semibold">{editingId ? 'Khoản vay cập nhật' : 'Khoản vay mới'}</h3>
                  <div className="mt-5 divide-y divide-border">
                    <SummaryRow label="Số tiền vay" value={formatVnd(originalAmount)} />
                    <SummaryRow label="Còn nợ" value={formatVnd(outstandingAmount)} />
                    <SummaryRow label="Tần suất trả" value={FREQUENCY_LABELS[paymentFrequency ?? 'none']} />
                    <SummaryRow label="Mỗi kỳ" value={formatVnd(fixedPaymentAmount)} />
                    <SummaryRow label="Sự kiện nhận tiền" value={receivedAssetName ?? 'Không tạo'} />
                  </div>
                  <p className="mt-5 text-xs leading-5 text-muted-foreground">Sau khi lưu, khoản vay xuất hiện trong danh sách nợ. Lịch trả chỉ ghi nhận khi đến kỳ hoặc khi bạn xác nhận.</p>
                </aside>
              </div>
            )}
          </div>

          <ResponsiveDialogFooter className="flex-row items-center justify-between border-t border-border px-6 py-4 sm:px-8">
            <div>{isPlanStep ? <Button type="button" variant="ghost" onClick={() => goToStep(1)}>← Quay lại</Button> : null}</div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
              {!isPlanStep ? <Button type="button" onClick={() => goToStep(2)}>Tiếp tục</Button> : <Button type="submit" disabled={!isValid || isSavingDebt}>{isSavingDebt ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Lưu khoản vay'}</Button>}
            </div>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function StepTab({ step, active, label, onClick }: { step: number; active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn('rounded-xl px-4 py-3 text-left transition', active ? 'bg-[#1d1d1f] text-white' : 'bg-muted text-muted-foreground')}><p className={cn('text-[11px] font-medium', active ? 'text-white/45' : 'text-muted-foreground/70')}>Bước {step}</p><p className="mt-1 text-sm font-semibold">{label}</p></button>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="max-w-[60%] truncate text-right text-sm font-semibold">{value}</span></div>
}

function InterestPeriods({
  fields,
  register,
  lastStageMonths,
  onAppend,
  onRemove,
}: {
  fields: Array<{ id: string }>
  register: UseFormRegister<DebtForm>
  lastStageMonths: number | null
  onAppend: () => void
  onRemove: (index: number) => void
}) {
  return <EventField label="Lãi suất theo giai đoạn" className="[&>div]:bg-muted/70"><div className="space-y-2">{fields.map((item, index) => <div key={item.id} className="flex items-center gap-2"><div className="flex flex-1 items-center gap-1 rounded-xl bg-card px-3 py-2"><input inputMode="decimal" placeholder="8,2" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" {...register(`interestPeriods.${index}.ratePct` as const)} /><span className="shrink-0 text-xs text-muted-foreground">% / năm</span></div>{index === fields.length - 1 ? <div className="w-[105px] rounded-xl bg-muted px-2 py-2 text-center text-sm font-medium">{lastStageMonths != null ? `${lastStageMonths} tháng` : '— tháng'}</div> : <div className="flex w-[105px] items-center rounded-xl bg-card px-2 py-2"><input inputMode="numeric" placeholder="12" className="min-w-0 flex-1 bg-transparent text-sm outline-none" {...register(`interestPeriods.${index}.months` as const)} /><span className="text-xs text-muted-foreground">tháng</span></div>}{fields.length > 1 ? <button type="button" onClick={() => onRemove(index)} className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground" aria-label="Xóa giai đoạn"><X className="size-4" /></button> : null}</div>)}<button type="button" onClick={onAppend} className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--accent))]"><Plus className="size-4" /> Thêm giai đoạn</button><p className="text-xs leading-5 text-muted-foreground">Giai đoạn cuối tự nhận phần thời hạn còn lại.</p></div></EventField>
}
