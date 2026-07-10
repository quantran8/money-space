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
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/number-input'
import { ResponsiveDialogFooter } from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type {
  ActualRecordForm as ActualRecordFormValues,
  LocalUpcomingPayment,
  QuickAction,
} from '@/features/events/model/events-form'

type Option = { value: string; label: string }

type ActualRecordFormProps = {
  control: Control<ActualRecordFormValues>
  register: UseFormRegister<ActualRecordFormValues>
  errors: FieldErrors<ActualRecordFormValues>
  handleSubmit: UseFormHandleSubmit<ActualRecordFormValues>
  onSubmit: (values: ActualRecordFormValues) => void
  quickAction: QuickAction
  markPaidPaymentId: string | null
  selectedUpcomingForMarkPaid?: LocalUpcomingPayment
  payments: LocalUpcomingPayment[]
  assetOptions: Option[]
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
  markPaidPaymentId,
  selectedUpcomingForMarkPaid,
  payments,
  assetOptions,
  showMoreDetails,
  onToggleMoreDetails,
  isValid,
  isSaving,
  onCancel,
}: ActualRecordFormProps) {
  const { t } = useTranslation()

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="text-lg font-semibold tracking-[-0.02em]">
        {quickAction === 'expense'
          ? 'Bạn vừa chi khoản gì?'
          : quickAction === 'income'
            ? 'Bạn nhận khoản gì?'
            : quickAction === 'transfer'
              ? 'Chuyển tiền giữa các nơi'
              : quickAction === 'goal_contribution'
                ? 'Góp thêm vào mục tiêu nào?'
                : 'Đánh dấu đã trả'}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Số tiền" error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <MoneyInput
                placeholder="Ví dụ: 8.000.000"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FormField>
        <FormField label={quickAction === 'payment_paid' ? 'Ngày trả' : 'Ngày'} error={errors.eventDate?.message}>
          <Controller
            control={control}
            name="eventDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>
      </div>

      {quickAction !== 'transfer' && quickAction !== 'goal_contribution' && quickAction !== 'payment_paid' ? (
        <FormField label="Tên khoản" error={errors.title?.message}>
          <Input
            placeholder={quickAction === 'income' ? 'Ví dụ: Lương tháng 7' : 'Ví dụ: Tiền nhà tháng 7'}
            {...register('title')}
          />
        </FormField>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {(quickAction === 'expense' || quickAction === 'payment_paid' || quickAction === 'transfer' || quickAction === 'goal_contribution') ? (
          <FormField
            label={
              quickAction === 'transfer'
                ? 'Từ đâu?'
                : quickAction === 'goal_contribution'
                  ? 'Lấy từ đâu?'
                  : 'Trả từ đâu?'
            }
            error={errors.fromAssetId?.message}
          >
            <Controller
              control={control}
              name="fromAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nơi tiền đi ra" />
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
        ) : null}

        {(quickAction === 'income' || quickAction === 'transfer') ? (
          <FormField
            label={quickAction === 'income' ? 'Nhận vào đâu?' : 'Đến đâu?'}
            error={errors.toAssetId?.message}
          >
            <Controller
              control={control}
              name="toAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nơi tiền đi vào" />
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
        ) : null}

        {quickAction === 'goal_contribution' ? (
          <FormField label="Mục tiêu" error={errors.financialGoalId?.message}>
            <Input placeholder="Ví dụ: Quỹ dự phòng" {...register('financialGoalId')} />
          </FormField>
        ) : null}
      </div>

      {quickAction === 'payment_paid' && selectedUpcomingForMarkPaid ? (
        <div className="rounded-3xl bg-[hsl(var(--muted))]/50 px-4 py-3 text-sm text-muted-foreground">
          Đang ghi nhận khoản đã trả cho "{selectedUpcomingForMarkPaid.name}".
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggleMoreDetails}
        className="text-sm font-semibold text-[hsl(var(--accent))]"
      >
        {showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm chi tiết'}
      </button>

      {showMoreDetails ? (
        <div className="grid gap-4 rounded-3xl border border-border/70 bg-[hsl(var(--muted))]/40 p-4">
          {(quickAction === 'expense' || quickAction === 'income') ? (
            <FormField label="Danh mục">
              <Input placeholder="Ví dụ: housing, salary, saving" {...register('category')} />
            </FormField>
          ) : null}

          {(quickAction === 'expense' && !markPaidPaymentId) ? (
            <FormField label="Khoản này có liên quan đến payment sắp tới không?">
              <Controller
                control={control}
                name="upcomingPaymentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
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
            </FormField>
          ) : null}

          {quickAction === 'goal_contribution' ? (
            <FormField label="Đến asset nào">
              <Controller
                control={control}
                name="toAssetId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
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
            </FormField>
          ) : null}

          <FormField label="Cần chú ý">
            <div className="flex h-11 items-center justify-between rounded-2xl border border-border bg-card px-4">
              <span className="text-sm text-muted-foreground">Đánh dấu để cùng xem lại</span>
              <Controller
                control={control}
                name="isAttentionNeeded"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </FormField>

          <FormField label="Ghi chú">
            <Textarea rows={4} placeholder="Thêm bối cảnh để cả hai cùng hiểu record này." {...register('note')} />
          </FormField>
        </div>
      ) : null}

      <ResponsiveDialogFooter className="border-t border-border/70 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={!isValid || isSaving}>
          {isSaving
            ? 'Dang luu...'
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
