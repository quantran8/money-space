import { ChevronDown, Plus, X } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import {
  EventField,
  EventFieldInput,
  EventFieldTextarea,
  EventMoneyInput,
  eventDateTriggerClass,
  eventSelectTriggerClass,
} from '@/components/ui/event-field'
import { quickLenderTypes, type DebtForm } from '@/features/debts/model/debts-form'
import { addMonthsIso, type RepaymentEstimate } from '@/features/debts/model/debts-interest'
import { isFixedScheduleLender } from '@/features/debts/model/debts.types'
import type { LenderType } from '@/features/debts/model/debts.types'
import { cn } from '@/shared/lib/utils'

type Option = { value: string; label: string }

/** Quick loan-term presets for the due date, in months from the borrow date. */
const DUE_DATE_PRESETS: Array<{ label: string; months: number }> = [
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

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value))
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
  /** Wallets eligible to receive the borrowed money (cash / bank account only). */
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
  const {
    fields: interestFields,
    append: appendInterest,
    remove: removeInterest,
  } = useFieldArray({ control, name: 'interestPeriods' })
  const hasInterest = useWatch({ control, name: 'hasInterest' })
  const borrowedAt = useWatch({ control, name: 'borrowedAt' })
  const expectedFinalDueDate = useWatch({ control, name: 'expectedFinalDueDate' })
  const watchedPeriods = useWatch({ control, name: 'interestPeriods' })

  // The LAST interest stage absorbs whatever term the earlier stages don't
  // cover: lastMonths = term − Σ(months of the earlier stages). It's shown
  // read-only and recomputed live as the user edits the earlier stages, so a
  // 12-month loan with earlier stages of 4 + 3 leaves the last stage at 5.
  // A single stage is simply the whole term. This matches the backend model
  // where the stage with empty `months` soaks up the remaining term.
  const earlierStagesMonths = (watchedPeriods ?? [])
    .slice(0, -1)
    .reduce((sum, period) => {
      const months = Number(String(period?.months ?? '').replace(',', '.'))
      return sum + (Number.isFinite(months) && months > 0 ? months : 0)
    }, 0)
  const lastStageMonths =
    termMonths != null ? Math.max(0, termMonths - earlierStagesMonths) : null

  /** Set the due date to `borrowedAt + months` (needs a borrow date first). */
  function applyDuePreset(months: number) {
    if (!borrowedAt) return
    setValue('expectedFinalDueDate', addMonthsIso(borrowedAt, months), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[90dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {editingId ? 'Chỉnh sửa khoản vay' : 'Khoản vay mới'}
          </p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {editingId ? 'Sửa khoản nợ' : 'Ghi nhanh khoản vay'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            Khoản vay được tính vào nợ của nhà mình, nên tài sản ròng không bị nhìn đẹp giả.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="grid min-h-0 min-w-0 grid-rows-[1fr_auto]" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 space-y-4 overflow-y-auto overflow-x-hidden px-6 pb-2 pt-6 sm:px-8">
            {/* Hero amount field */}
            <EventField
              label="Số tiền vay"
              error={errors.originalAmount?.message}
              trailing={
                <span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
              }
            >
              <Controller
                control={control}
                name="originalAmount"
                render={({ field }) => (
                  <EventMoneyInput
                    placeholder="0"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </EventField>

            <div className="flex justify-end px-1">
              <button
                type="button"
                onClick={pasteAmountFromClipboard}
                className="text-sm font-semibold text-[hsl(var(--accent))] transition hover:opacity-80"
              >
                Dán số tiền
              </button>
            </div>

            {/* Lender quick-pick — the three buckets map 1:1 to `lenderType`. */}
            <div className="grid grid-cols-3 gap-2">
              {quickLenderTypes.map((option) => {
                const active = selectedLenderType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setValue('lenderType', option.value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }}
                    className={cn(
                      'rounded-[18px] px-4 py-3 text-[15px] font-semibold transition',
                      active
                        ? 'bg-[hsl(var(--accent))] text-white'
                        : 'bg-[hsl(var(--muted))] text-foreground hover:opacity-80',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            <EventField label="Tên khoản vay" error={errors.name?.message}>
              <EventFieldInput placeholder="Ví dụ: Vay mẹ sửa nhà" {...register('name')} />
            </EventField>

            <EventField label="Mình vay ai?" error={errors.lenderName?.message}>
              <EventFieldInput placeholder="Ví dụ: Mẹ, VPBank" {...register('lenderName')} />
            </EventField>

            <div className="grid gap-4 sm:grid-cols-2">
              <EventField
                label="Hiện còn nợ"
                error={errors.outstandingAmount?.message}
                trailing={
                  <span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">
                    ₫
                  </span>
                }
              >
                <Controller
                  control={control}
                  name="outstandingAmount"
                  render={({ field }) => (
                    <EventMoneyInput
                      placeholder="0"
                      className="text-[22px] sm:text-[24px]"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </EventField>

              <EventField label="Ngày vay" error={errors.borrowedAt?.message}>
                <Controller
                  control={control}
                  name="borrowedAt"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      className={eventDateTriggerClass}
                    />
                  )}
                />
              </EventField>
            </div>

            <EventField label="Nhận nợ vào đâu?">
              <Controller
                control={control}
                name="receivedToAssetId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
                      <SelectValue placeholder="Chọn ví tiền mặt hoặc tài khoản" />
                    </SelectTrigger>
                    <SelectContent>
                      {receiveAssetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </EventField>

            <button
              type="button"
              onClick={() => setShowMoreDetails((value) => !value)}
              className="flex w-full items-center justify-between px-1 py-2 text-left text-[16px] font-semibold text-[hsl(var(--accent))] transition hover:opacity-80"
              aria-expanded={showMoreDetails}
            >
              <span>{showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm lịch trả nợ, ghi chú'}</span>
              <ChevronDown
                className={cn('size-5 transition-transform', showMoreDetails && 'rotate-180')}
              />
            </button>

            {showMoreDetails ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EventField label="Người phụ trách">
                    <Controller
                      control={control}
                      name="ownerMemberId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}>
                            <SelectValue placeholder="Không bắt buộc" />
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
                  </EventField>

                  <EventField
                    label="Dự kiến trả xong"
                    error={errors.expectedFinalDueDate?.message}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {DUE_DATE_PRESETS.map((preset) => {
                          const active =
                            !!borrowedAt &&
                            expectedFinalDueDate === addMonthsIso(borrowedAt, preset.months)
                          return (
                            <button
                              key={preset.months}
                              type="button"
                              disabled={!borrowedAt}
                              onClick={() => applyDuePreset(preset.months)}
                              className={cn(
                                'rounded-full px-3 py-1.5 text-[13px] font-semibold transition disabled:opacity-40',
                                active
                                  ? 'bg-[hsl(var(--accent))] text-white'
                                  : 'bg-[hsl(var(--muted))] text-foreground hover:opacity-80',
                              )}
                            >
                              {preset.label}
                            </button>
                          )
                        })}
                      </div>
                      <Controller
                        control={control}
                        name="expectedFinalDueDate"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            className={eventDateTriggerClass}
                          />
                        )}
                      />
                    </div>
                  </EventField>

                  <EventField label="Tần suất trả">
                    <Controller
                      control={control}
                      name="paymentFrequency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}>
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
                  </EventField>

                  <EventField label="Loại khoản vay">
                    <Controller
                      control={control}
                      name="lenderType"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}>
                            <SelectValue placeholder="Chọn loại khoản vay" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relative">Người thân</SelectItem>
                            <SelectItem value="bank_institution">Ngân hàng / Tổ chức</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </EventField>
                </div>

                {isFixedScheduleLender(selectedLenderType) ? (
                  <p className="rounded-[14px] bg-[hsl(var(--muted))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                    Vay ngân hàng/tổ chức cần có lãi suất, kỳ hạn trả và số tiền trả hàng tháng.
                    Số tiền trả cố định — muốn thay đổi hãy cập nhật khoản vay.
                  </p>
                ) : null}

                <div className="flex items-center justify-between rounded-[18px] bg-[hsl(var(--muted))] px-5 py-4">
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Khoản vay có lãi</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Bật để nhập lãi suất và cách tính lãi
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="hasInterest"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                {hasInterest ? (
                  <>
                <EventField label="Lãi suất theo giai đoạn">
                  <div className="space-y-2">
                    {interestFields.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-1 rounded-[14px] bg-white/60 px-3 py-2">
                          <input
                            inputMode="decimal"
                            placeholder="9.2"
                            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-foreground outline-none placeholder:text-[hsl(var(--muted-foreground))]"
                            {...register(`interestPeriods.${index}.ratePct` as const)}
                          />
                          <span className="shrink-0 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                            %/năm
                          </span>
                        </div>
                        {index === interestFields.length - 1 ? (
                          // The last stage always absorbs the remaining term, so
                          // its months are computed (term − earlier stages), never
                          // typed. Stored `months` stays empty = "remaining term",
                          // which the backend resolves the same way. Single stage →
                          // this is simply the full term. Earlier stages (below)
                          // are editable.
                          <div className="flex w-[110px] min-w-0 shrink items-center justify-center rounded-[14px] bg-[hsl(var(--muted))] px-2.5 py-2">
                            <span className="text-[15px] font-medium text-foreground">
                              {lastStageMonths != null ? `${lastStageMonths} tháng` : '— tháng'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex w-[110px] min-w-0 shrink items-center gap-1 rounded-[14px] bg-white/60 px-2.5 py-2">
                            <input
                              inputMode="numeric"
                              placeholder="12"
                              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-[hsl(var(--muted-foreground))]"
                              {...register(`interestPeriods.${index}.months` as const)}
                            />
                            <span className="shrink-0 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                              tháng
                            </span>
                          </div>
                        )}
                        {interestFields.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeInterest(index)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/60 text-[hsl(var(--muted-foreground))] transition hover:opacity-80"
                            aria-label="Xóa giai đoạn"
                          >
                            <X className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => appendInterest({ ratePct: '', months: '' })}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--accent))] transition hover:opacity-80"
                    >
                      <Plus className="size-4" />
                      Thêm giai đoạn
                    </button>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Số tháng tính tự động theo ngày dự kiến trả xong. Giai đoạn cuối tự nhận
                      phần thời hạn còn lại; nhập số tháng cho các giai đoạn trước.
                    </p>
                  </div>
                </EventField>

                <EventField label="Cách tính lãi">
                  <Controller
                    control={control}
                    name="interestCalc"
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        {CALC_OPTIONS.map((option) => {
                          const active = field.value === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className={cn(
                                'rounded-[14px] px-3 py-2.5 text-left transition',
                                active
                                  ? 'bg-[hsl(var(--accent))] text-white'
                                  : 'bg-white/60 text-foreground hover:opacity-80',
                              )}
                            >
                              <p className="text-[14px] font-semibold tracking-[-0.01em]">
                                {option.label}
                              </p>
                              <p
                                className={cn(
                                  'mt-0.5 text-xs',
                                  active ? 'text-white/70' : 'text-[hsl(var(--muted-foreground))]',
                                )}
                              >
                                {option.hint}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                </EventField>
                  </>
                ) : null}

                <EventField
                  label="Mỗi kỳ trả khoảng"
                  trailing={
                    <span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">
                      ₫
                    </span>
                  }
                >
                  <Controller
                    control={control}
                    name="fixedPaymentAmount"
                    render={({ field }) => (
                      <EventMoneyInput
                        placeholder="0"
                        className="text-[22px] sm:text-[24px]"
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value)
                          // User is editing → stop syncing to the estimate.
                          setValue('fixedPaymentTouched', true, { shouldDirty: true })
                        }}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </EventField>

                {repaymentEstimate ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] bg-[hsl(var(--muted))] px-5 py-4">
                    <div>
                      <p className="text-[15px] font-medium text-foreground">
                        Gợi ý: {formatVnd(repaymentEstimate.perPayment)} ₫ mỗi kỳ
                      </p>
                      <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                        {repaymentEstimate.installments} kỳ
                        {termMonths ? ` · ${termMonths} tháng` : ''}
                        {repaymentEstimate.annualRatePct > 0
                          ? ` · ~${repaymentEstimate.annualRatePct.toFixed(1)}%/năm`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('fixedPaymentAmount', String(repaymentEstimate.perPayment), {
                          shouldValidate: true,
                        })
                        setValue('fixedPaymentTouched', false, { shouldDirty: true })
                      }}
                      className="text-sm font-semibold text-[hsl(var(--accent))] transition hover:opacity-80"
                    >
                      Dùng số gợi ý
                    </button>
                  </div>
                ) : (
                  <p className="px-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Nhập ngày vay, dự kiến trả xong và tần suất để tự tính số tiền mỗi kỳ.
                  </p>
                )}

                <EventField label="Ghi chú">
                  <EventFieldTextarea
                    rows={3}
                    placeholder="Thêm bối cảnh nếu cần."
                    {...register('note')}
                  />
                </EventField>
              </div>
            ) : null}
          </div>

          <ResponsiveDialogFooter className="border-t border-black/[0.06] px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground hover:bg-[hsl(var(--muted))]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSavingDebt}
              className="bg-[hsl(var(--accent))] px-6 text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {isSavingDebt ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Lưu khoản vay'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
