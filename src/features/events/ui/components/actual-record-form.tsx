import { ChevronDown } from 'lucide-react'
import { Controller } from 'react-hook-form'
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { ResponsiveDialogFooter } from '@/components/ui/responsive-dialog'
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
} from '@/features/events/ui/components/event-field'
import type {
  ActualRecordForm as ActualRecordFormValues,
  LocalUpcomingPayment,
  QuickAction,
} from '@/features/events/model/events-form'
import { cn } from '@/shared/lib/utils'

type Option = { value: string; label: string }

type ActualRecordFormProps = {
  control: Control<ActualRecordFormValues>
  register: UseFormRegister<ActualRecordFormValues>
  errors: FieldErrors<ActualRecordFormValues>
  handleSubmit: UseFormHandleSubmit<ActualRecordFormValues>
  onSubmit: (values: ActualRecordFormValues) => void
  quickAction: QuickAction
  /** Editing an `asset_update` revaluation → simplified form: value/date/name/
   *  note only, no wallet ("Trả từ đâu") and no "Thêm chi tiết". */
  isRevaluation?: boolean
  markPaidPaymentId: string | null
  selectedUpcomingForMarkPaid?: LocalUpcomingPayment
  payments: LocalUpcomingPayment[]
  assetOptions: Option[]
  /** Wallets eligible as the money source (cash / bank account). Drives the
   *  "nguồn tiền" select; destination selects still use assetOptions. */
  sourceAssetOptions: Option[]
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
  isValid: boolean
  isSaving: boolean
  onCancel: () => void
}

export function ActualRecordForm({
  control,
  register,
  errors,
  handleSubmit,
  onSubmit,
  quickAction,
  isRevaluation = false,
  markPaidPaymentId,
  selectedUpcomingForMarkPaid,
  payments,
  assetOptions,
  sourceAssetOptions,
  showMoreDetails,
  onToggleMoreDetails,
  isValid,
  isSaving,
  onCancel,
}: ActualRecordFormProps) {
  const { t } = useTranslation()

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Hero amount field */}
      <EventField label={isRevaluation ? 'Giá trị mới' : 'Số tiền'} error={errors.amount?.message} trailing={<span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>}>
        <Controller
          control={control}
          name="amount"
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

      {quickAction !== 'transfer' && quickAction !== 'goal_contribution' && quickAction !== 'payment_paid' ? (
        <EventField label="Nội dung" error={errors.title?.message}>
          <EventFieldInput
            placeholder={quickAction === 'income' ? 'Ví dụ: Lương tháng 7' : 'Ví dụ: Tiền nhà tháng 7'}
            {...register('title')}
          />
        </EventField>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {!isRevaluation && (quickAction === 'expense' || quickAction === 'payment_paid' || quickAction === 'transfer' || quickAction === 'goal_contribution') ? (
          <EventField
            label={
              quickAction === 'transfer'
                ? 'Từ đâu?'
                : quickAction === 'goal_contribution'
                  ? 'Lấy từ đâu?'
                  : 'Nguồn tiền'
            }
            error={errors.fromAssetId?.message}
          >
            <Controller
              control={control}
              name="fromAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={eventSelectTriggerClass}>
                    <SelectValue placeholder="Chọn ví thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceAssetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </EventField>
        ) : null}

        {!isRevaluation && (quickAction === 'income' || quickAction === 'transfer') ? (
          <EventField
            label={quickAction === 'income' ? 'Nhận vào đâu?' : 'Đến đâu?'}
            error={errors.toAssetId?.message}
          >
            <Controller
              control={control}
              name="toAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={eventSelectTriggerClass}>
                    <SelectValue placeholder="Chọn nơi tiền đi vào" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceAssetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </EventField>
        ) : null}

        {!isRevaluation && quickAction === 'goal_contribution' ? (
          <EventField label="Mục tiêu" error={errors.financialGoalId?.message}>
            <EventFieldInput placeholder="Ví dụ: Quỹ dự phòng" {...register('financialGoalId')} />
          </EventField>
        ) : null}

        <EventField label={quickAction === 'payment_paid' ? 'Ngày trả' : 'Ngày'} error={errors.eventDate?.message}>
          <Controller
            control={control}
            name="eventDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />
            )}
          />
        </EventField>
      </div>

      {quickAction === 'payment_paid' && selectedUpcomingForMarkPaid ? (
        <div className="rounded-[18px] bg-[hsl(var(--muted))] px-5 py-4 text-sm text-[hsl(var(--muted-foreground))]">
          Đang ghi nhận khoản đã trả cho "{selectedUpcomingForMarkPaid.name}".
        </div>
      ) : null}

      {/* Revaluation: no wallet / details — just a plain note field. */}
      {isRevaluation ? (
        <EventField label="Ghi chú">
          <EventFieldTextarea rows={3} placeholder="Lý do định giá lại (không bắt buộc)." {...register('note')} />
        </EventField>
      ) : null}

      {!isRevaluation ? (
        <button
          type="button"
          onClick={onToggleMoreDetails}
          className="flex w-full items-center justify-between px-1 py-2 text-left text-[16px] font-semibold text-[hsl(var(--accent))] transition hover:opacity-80"
          aria-expanded={showMoreDetails}
        >
          <span>{showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm chi tiết'}</span>
          <ChevronDown className={cn('size-5 transition-transform', showMoreDetails && 'rotate-180')} />
        </button>
      ) : null}

      {!isRevaluation && showMoreDetails ? (
        <div className="space-y-4">
          {(quickAction === 'expense' || quickAction === 'income') ? (
            <EventField label="Danh mục">
              <EventFieldInput placeholder="Ví dụ: housing, salary, saving" {...register('category')} />
            </EventField>
          ) : null}

          {(quickAction === 'expense' && !markPaidPaymentId) ? (
            <EventField label="Liên quan đến khoản sắp tới?">
              <Controller
                control={control}
                name="upcomingPaymentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
                      <SelectValue placeholder="Không bắt buộc" />
                    </SelectTrigger>
                    <SelectContent>
                      {payments
                        .filter((payment) => payment.status !== 'paid')
                        .map((payment) => (
                          <SelectItem key={payment.id} value={payment.id}>
                            {payment.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </EventField>
          ) : null}

          {quickAction === 'goal_contribution' ? (
            <EventField label="Đến asset nào">
              <Controller
                control={control}
                name="toAssetId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
                      <SelectValue placeholder="Không bắt buộc" />
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
            </EventField>
          ) : null}

          <div className="flex items-center justify-between rounded-[18px] bg-[hsl(var(--muted))] px-5 py-4">
            <div>
              <p className="text-[15px] font-medium text-foreground">Cần chú ý</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Đánh dấu để cùng xem lại</p>
            </div>
            <Controller
              control={control}
              name="isAttentionNeeded"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <EventField label="Ghi chú">
            <EventFieldTextarea rows={3} placeholder="Thêm ghi chú ngắn..." {...register('note')} />
          </EventField>
        </div>
      ) : null}

      <ResponsiveDialogFooter className="-mx-6 mt-2 border-t border-black/[0.06] px-6 pt-4 sm:-mx-8 sm:px-8">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-foreground hover:bg-[hsl(var(--muted))]">
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isSaving}
          className="bg-[hsl(var(--accent))] px-6 text-white hover:bg-[hsl(var(--accent))]/90"
        >
          {isSaving
            ? 'Dang luu...'
            : isRevaluation
              ? 'Lưu định giá'
              : quickAction === 'expense' || quickAction === 'payment_paid'
                ? 'Lưu khoản đã chi'
                : quickAction === 'income'
                  ? 'Lưu khoản tiền vào'
                  : quickAction === 'transfer'
                    ? 'Lưu chuyển tiền'
                    : 'Lưu đóng góp'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
