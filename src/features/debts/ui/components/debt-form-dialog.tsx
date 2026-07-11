import { ChevronDown, Plus, X } from 'lucide-react'
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/number-input'
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
import { Textarea } from '@/components/ui/textarea'
import { quickLenderTypes, type DebtForm } from '@/features/debts/model/debts-form'
import type { RepaymentEstimate } from '@/features/debts/model/debts-interest'
import type { LenderType } from '@/features/debts/model/debts.types'

type Option = { value: string; label: string }

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
  originalAmountValue: string
  showMoreDetails: boolean
  setShowMoreDetails: (updater: (value: boolean) => boolean) => void
  assetOptions: Option[]
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
  originalAmountValue,
  showMoreDetails,
  setShowMoreDetails,
  assetOptions,
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

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 overflow-hidden border-white bg-[#fcfcfd] p-0 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:max-w-[560px] sm:rounded-[32px]">
        <ResponsiveDialogHeader className="gap-0 border-b border-[#e8e8ee] px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <ResponsiveDialogTitle className="pr-10 text-[28px] font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1f]">
            {editingId ? 'Sửa khoản nợ' : 'Ghi nhanh khoản vay'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <form className="flex max-h-[calc(94dvh-170px)] flex-col" onSubmit={onSubmit} noValidate>
          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="rounded-[30px] border border-[#e5e5ea] bg-[#f2f2f7]/70 p-4 sm:p-5">
              <FormField
                label="Số tiền vay"
                error={errors.originalAmount?.message}
                className="space-y-3"
              >
                <div className="flex min-h-[92px] items-end gap-2 rounded-[26px] border border-white/80 bg-white px-4 pb-4 pt-5 transition focus-within:border-[#7ab6ff] focus-within:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] sm:min-h-[108px] sm:px-5">
                  <Controller
                    control={control}
                    name="originalAmount"
                    render={({ field }) => (
                      <MoneyInput
                        placeholder="100.000.000"
                        className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 pb-0 pt-0 text-[52px] font-semibold leading-none tracking-[-0.07em] text-[#1d1d1f] ring-0 placeholder:text-[#a1a1a6] focus-visible:ring-0 sm:text-[68px]"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <span className="mb-1 shrink-0 text-2xl font-semibold tracking-[-0.04em] text-[#6e6e73] sm:mb-2 sm:text-3xl">
                    đ
                  </span>
                </div>
              </FormField>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-sm text-[#6e6e73]">
                  {originalAmountValue?.trim()
                    ? 'Khoản vay ban đầu'
                    : 'Nhập số tiền, ví dụ 100.000.000'}
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
                    className={
                      active
                        ? 'bg-[#1d1d1f] text-white hover:bg-[#1d1d1f]/90'
                        : 'bg-[#f2f2f7] text-[#1d1d1f] hover:bg-[#e8e8ee]'
                    }
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
                    <Controller
                      control={control}
                      name="outstandingAmount"
                      render={({ field }) => (
                        <MoneyInput
                          placeholder="84.000.000"
                          className="h-auto border-0 bg-transparent px-0 py-0 text-[17px] font-semibold focus-visible:ring-0"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
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
                    Số tiền vay và số còn nợ sẽ được cập nhật trong tổng quan, nên tài sản ròng không
                    bị nhìn đẹp giả.
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
                  <p className="mt-1 text-sm text-[#6e6e73]">Không bắt buộc, có thể bổ sung sau</p>
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

                  <div className="sm:col-span-2">
                    <FormField label="Lãi suất theo giai đoạn">
                      <div className="space-y-2">
                        {interestFields.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className="flex h-[52px] flex-1 items-center gap-1 rounded-[20px] border border-[#e5e5ea] bg-white px-3">
                              <Input
                                inputMode="decimal"
                                placeholder="9.2"
                                className="h-auto border-0 bg-transparent px-1 text-[15px] font-semibold focus-visible:ring-0"
                                {...register(`interestPeriods.${index}.ratePct` as const)}
                              />
                              <span className="shrink-0 text-sm font-medium text-[#6e6e73]">
                                %/năm
                              </span>
                            </div>
                            <div className="flex h-[52px] w-[132px] items-center gap-1 rounded-[20px] border border-[#e5e5ea] bg-white px-3">
                              <Input
                                inputMode="numeric"
                                placeholder={index === interestFields.length - 1 ? 'còn lại' : '12'}
                                className="h-auto border-0 bg-transparent px-1 text-[15px] focus-visible:ring-0"
                                {...register(`interestPeriods.${index}.months` as const)}
                              />
                              <span className="shrink-0 text-sm font-medium text-[#6e6e73]">
                                tháng
                              </span>
                            </div>
                            {interestFields.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeInterest(index)}
                                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f2f2f7] text-[#6e6e73] transition hover:bg-[#e8e8ee]"
                                aria-label="Xóa giai đoạn"
                              >
                                <X className="size-4" />
                              </button>
                            ) : null}
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-9 bg-[#f2f2f7] text-[hsl(var(--status-blue))] hover:bg-[#e8e8ee]"
                          onClick={() => appendInterest({ ratePct: '', months: '' })}
                        >
                          <Plus className="mr-1 size-4" />
                          Thêm giai đoạn
                        </Button>
                        <p className="text-xs text-[#8e8e93]">
                          Để trống ô tháng ở giai đoạn cuối nếu áp dụng cho các kỳ còn lại.
                        </p>
                      </div>
                    </FormField>
                  </div>

                  <FormField label="Cách tính lãi" className="sm:col-span-2">
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
                                className={`rounded-[18px] border px-4 py-3 text-left transition ${
                                  active
                                    ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                                    : 'border-[#e5e5ea] bg-white text-[#1d1d1f] hover:bg-[#f2f2f7]'
                                }`}
                              >
                                <p className="text-[14px] font-semibold tracking-[-0.01em]">
                                  {option.label}
                                </p>
                                <p
                                  className={`mt-0.5 text-xs ${active ? 'text-white/70' : 'text-[#8e8e93]'}`}
                                >
                                  {option.hint}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Mỗi kỳ trả khoảng">
                      <Controller
                        control={control}
                        name="fixedPaymentAmount"
                        render={({ field }) => (
                          <div className="flex h-[52px] items-center gap-2 rounded-[20px] border border-[#e5e5ea] bg-white px-4">
                            <MoneyInput
                              placeholder="Ví dụ: 8.500.000"
                              className="h-auto flex-1 border-0 bg-transparent px-0 text-[15px] font-semibold focus-visible:ring-0"
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value)
                                // User is editing → stop syncing to the estimate.
                                setValue('fixedPaymentTouched', true, { shouldDirty: true })
                              }}
                              onBlur={field.onBlur}
                            />
                            <span className="shrink-0 text-sm font-medium text-[#6e6e73]">đ</span>
                          </div>
                        )}
                      />
                    </FormField>

                    {repaymentEstimate ? (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[18px] bg-[#f2f2f7]/80 px-4 py-3">
                        <div>
                          <p className="text-[13px] text-[#6e6e73]">
                            Gợi ý: {formatVnd(repaymentEstimate.perPayment)} đ mỗi kỳ
                          </p>
                          <p className="mt-0.5 text-xs text-[#8e8e93]">
                            {repaymentEstimate.installments} kỳ
                            {termMonths ? ` · ${termMonths} tháng` : ''}
                            {repaymentEstimate.annualRatePct > 0
                              ? ` · ~${repaymentEstimate.annualRatePct.toFixed(1)}%/năm`
                              : ''}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 bg-white px-3 text-xs font-semibold text-[hsl(var(--status-blue))] hover:bg-white/90"
                          onClick={() => {
                            setValue('fixedPaymentAmount', String(repaymentEstimate.perPayment), {
                              shouldValidate: true,
                            })
                            setValue('fixedPaymentTouched', false, { shouldDirty: true })
                          }}
                        >
                          Dùng số gợi ý
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-2 px-1 text-xs text-[#8e8e93]">
                        Nhập ngày vay, dự kiến trả xong và tần suất để tự tính số tiền mỗi kỳ.
                      </p>
                    )}
                  </div>

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
  )
}
