import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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
      <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {isEditing ? t('goals.form.editEyebrow') : t('goals.form.eyebrow')}
          </p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {isEditing ? t('goals.form.editTitle') : t('goals.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {t('goals.form.help')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="mt-6 space-y-4 px-6 pb-6 sm:px-8 sm:pb-8" onSubmit={onSubmit} noValidate>
          {/* Hero target field */}
          <EventField
            label={t('goals.form.target')}
            error={errors.target?.message}
            trailing={
              <span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
            }
          >
            <Controller
              control={control}
              name="target"
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

          <EventField label={t('goals.form.name')} error={errors.name?.message}>
            <EventFieldInput
              placeholder={t('goals.form.namePlaceholder')}
              {...register('name')}
            />
          </EventField>

          <div className="grid gap-4 sm:grid-cols-2">
            <EventField label={t('goals.form.deadline')}>
              <Controller
                control={control}
                name="deadline"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className={eventDateTriggerClass}
                  />
                )}
              />
            </EventField>

            <EventField label={t('goals.form.priority')} error={errors.priority?.message}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
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
            </EventField>
          </div>

          <EventField label={t('goals.form.note')} error={errors.note?.message}>
            <EventFieldTextarea
              rows={3}
              placeholder={t('goals.form.notePlaceholder')}
              {...register('note')}
            />
          </EventField>

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
              disabled={!isValid || isSubmitting}
              className="bg-[hsl(var(--accent))] px-6 text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {isSubmitting ? 'Đang lưu...' : isEditing ? t('goals.form.save') : t('goals.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
