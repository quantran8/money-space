import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/number-input'
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
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEditing ? t('payments.form.editTitle') : t('payments.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditing ? t('payments.form.editEyebrow') : t('payments.form.eyebrow')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <FormField label={t('payments.form.name')} error={errors.name?.message}>
            <Input
              placeholder={t('payments.form.namePlaceholder')}
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('payments.form.amount')} error={errors.amount?.message}>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    placeholder={t('payments.form.amountPlaceholder')}
                    aria-invalid={!!errors.amount}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>
            <FormField label={t('payments.form.due')} error={errors.due?.message}>
              <Controller
                control={control}
                name="due"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!errors.due}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField label={t('payments.form.status')} error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.status}>
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
          </FormField>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? 'Dang luu...' : isEditing ? t('payments.form.save') : t('payments.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
