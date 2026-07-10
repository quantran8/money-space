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
import type { UpcomingRecordForm as UpcomingRecordFormValues } from '@/features/events/model/events-form'

type Option = { value: string; label: string }

type UpcomingRecordFormProps = {
  control: Control<UpcomingRecordFormValues>
  register: UseFormRegister<UpcomingRecordFormValues>
  errors: FieldErrors<UpcomingRecordFormValues>
  handleSubmit: UseFormHandleSubmit<UpcomingRecordFormValues>
  onSubmit: (values: UpcomingRecordFormValues) => void
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
  memberOptions: Option[]
  assetOptions: Option[]
  isValid: boolean
  isSaving: boolean
  onCancel: () => void
}

export function UpcomingRecordForm({
  control,
  register,
  errors,
  handleSubmit,
  onSubmit,
  showMoreDetails,
  onToggleMoreDetails,
  memberOptions,
  assetOptions,
  isValid,
  isSaving,
  onCancel,
}: UpcomingRecordFormProps) {
  const { t } = useTranslation()

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="rounded-3xl bg-[hsl(var(--muted))]/50 px-4 py-3 text-sm text-muted-foreground">
        Khoản sắp tới chưa làm thay đổi số dư. Số dư chỉ thay đổi khi bạn đánh dấu đã trả.
      </div>

      <p className="text-lg font-semibold tracking-[-0.02em]">Có khoản gì sắp tới?</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên khoản" error={errors.name?.message}>
          <Input placeholder="Ví dụ: Tiền nhà tháng 8" {...register('name')} />
        </FormField>
        <FormField label="Số tiền dự kiến" error={errors.amount?.message}>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Hạn trả" error={errors.dueDate?.message}>
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>
      </div>

      <button
        type="button"
        onClick={onToggleMoreDetails}
        className="text-sm font-semibold text-[hsl(var(--accent))]"
      >
        {showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm chi tiết'}
      </button>

      {showMoreDetails ? (
        <div className="grid gap-4 rounded-3xl border border-border/70 bg-[hsl(var(--muted))]/40 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Lặp lại" error={errors.frequency?.message}>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tần suất" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Một lần</SelectItem>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                      <SelectItem value="monthly">Hàng tháng</SelectItem>
                      <SelectItem value="quarterly">Hàng quý</SelectItem>
                      <SelectItem value="yearly">Hàng năm</SelectItem>
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
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nguồn tiền dự kiến">
              <Controller
                control={control}
                name="expectedFromAssetId"
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
          </div>
          <FormField label="Ghi chú">
            <Textarea rows={4} placeholder="Ví dụ: Nên chuẩn bị tiền từ đầu tuần." {...register('note')} />
          </FormField>
        </div>
      ) : null}

      <ResponsiveDialogFooter className="border-t border-border/70 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={!isValid || isSaving}>
          {isSaving ? 'Dang luu...' : 'Lưu khoản sắp tới'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
