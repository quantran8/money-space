import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
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
import type { GoalForm } from '@/features/goals/model/goals-form'

type GoalFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<GoalForm>
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

export function GoalFormDialog({
  open,
  onOpenChange,
  form,
  isEditing,
  isSubmitting,
  onSubmit,
}: GoalFormDialogProps) {
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
            {isEditing ? t('goals.form.editTitle') : t('goals.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditing ? t('goals.form.editEyebrow') : t('goals.form.eyebrow')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <FormField label={t('goals.form.name')} error={errors.name?.message}>
            <Input
              placeholder={t('goals.form.namePlaceholder')}
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <FormField label={t('goals.form.target')} error={errors.target?.message}>
            <Controller
              control={control}
              name="target"
              render={({ field }) => (
                <MoneyInput
                  placeholder={t('goals.form.targetPlaceholder')}
                  aria-invalid={!!errors.target}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>

          <FormField label="Deadline">
            <Input type="date" {...register('deadline')} />
          </FormField>

          <FormField label={t('goals.form.priority')} error={errors.priority?.message}>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.priority}>
                    <SelectValue placeholder={t('goals.form.priorityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{t('options.priority.high')}</SelectItem>
                    <SelectItem value="medium">{t('options.priority.medium')}</SelectItem>
                    <SelectItem value="low">{t('options.priority.low')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label={t('goals.form.note')} error={errors.note?.message}>
            <Input
              placeholder={t('goals.form.notePlaceholder')}
              aria-invalid={!!errors.note}
              {...register('note')}
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
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Dang luu...' : isEditing ? t('goals.form.save') : t('goals.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
