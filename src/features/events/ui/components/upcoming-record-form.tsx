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
} from '@/components/ui/event-field'
import type { UpcomingRecordForm as UpcomingRecordFormValues } from '@/features/events/model/events-form'
import { cn } from '@/shared/lib/utils'

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
  /** Wallets eligible as the expected money source (cash / bank account). */
  sourceAssetOptions: Option[]
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
  sourceAssetOptions,
  isValid,
  isSaving,
  onCancel,
}: UpcomingRecordFormProps) {
  const { t } = useTranslation()

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="rounded-[18px] bg-[hsl(var(--muted))] px-5 py-4 text-sm text-[hsl(var(--muted-foreground))]">
        Khoản sắp tới chưa làm thay đổi số dư. Số dư chỉ thay đổi khi bạn đánh dấu đã trả.
      </div>

      {/* Hero amount field */}
      <EventField label="Số tiền dự kiến" error={errors.amount?.message} trailing={<span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>}>
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

      <EventField label="Tên khoản" error={errors.name?.message}>
        <EventFieldInput placeholder="Ví dụ: Tiền nhà tháng 8" {...register('name')} />
      </EventField>

      <EventField label="Hạn trả" error={errors.dueDate?.message}>
        <Controller
          control={control}
          name="dueDate"
          render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />
          )}
        />
      </EventField>

      {/* Money source stays in the main body (not behind "Thêm chi tiết") so the
          asset select is always visible, like the income/expense/transfer flows. */}
      <EventField label="Nguồn tiền dự kiến">
        <Controller
          control={control}
          name="expectedFromAssetId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={eventSelectTriggerClass}>
                <SelectValue placeholder="Không bắt buộc" />
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

      <button
        type="button"
        onClick={onToggleMoreDetails}
        className="flex w-full items-center justify-between px-1 py-2 text-left text-[16px] font-semibold text-[hsl(var(--accent))] transition hover:opacity-80"
        aria-expanded={showMoreDetails}
      >
        <span>{showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm chi tiết'}</span>
        <ChevronDown className={cn('size-5 transition-transform', showMoreDetails && 'rotate-180')} />
      </button>

      {showMoreDetails ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <EventField label="Lặp lại" error={errors.frequency?.message}>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
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
            </EventField>
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
          </div>
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
            <EventFieldTextarea rows={3} placeholder="Ví dụ: Nên chuẩn bị tiền từ đầu tuần." {...register('note')} />
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
          {isSaving ? 'Dang luu...' : 'Lưu khoản sắp tới'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
