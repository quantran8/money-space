import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventField,
  EventFieldInput,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type PaymentForm } from '@/features/payments/model/payments-form'

type PaymentFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<PaymentForm>
  isEditing: boolean
  isSaving: boolean
  onSubmit: () => void
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  form,
  isEditing,
  isSaving,
  onSubmit,
}: PaymentFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors, isValid },
  } = form

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {isEditing ? t('payments.form.editEyebrow') : t('payments.form.eyebrow')}
          </p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {isEditing ? t('payments.form.editTitle') : t('payments.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {t('payments.form.help')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="mt-6 space-y-4 px-6 pb-6 sm:px-8 sm:pb-8" onSubmit={onSubmit} noValidate>
          {/* Hero amount field */}
          <EventField
            label={t('payments.form.amount')}
            error={errors.amount?.message}
            trailing={
              <span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
            }
          >
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

          <EventField label={t('payments.form.name')} error={errors.name?.message}>
            <EventFieldInput
              placeholder={t('payments.form.namePlaceholder')}
              {...register('name')}
            />
          </EventField>

          <div className="grid gap-4 sm:grid-cols-2">
            <EventField label={t('payments.form.due')} error={errors.due?.message}>
              <Controller
                control={control}
                name="due"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className={eventDateTriggerClass}
                  />
                )}
              />
            </EventField>

            <EventField label={t('payments.form.status')} error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
                      <SelectValue placeholder={t('payments.form.statusPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="important">{t('options.paymentStatus.important')}</SelectItem>
                      <SelectItem value="normal">{t('options.paymentStatus.normal')}</SelectItem>
                      <SelectItem value="pending">{t('options.paymentStatus.pending')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </EventField>
          </div>

          <ResponsiveDialogFooter className="-mx-6 mt-2 border-t border-black/[0.06] px-6 pt-4 sm:-mx-8 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground hover:bg-[hsl(var(--muted))]"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSaving}
              className="bg-[hsl(var(--accent))] px-6 text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {isSaving ? 'Đang lưu...' : isEditing ? t('payments.form.save') : t('payments.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
