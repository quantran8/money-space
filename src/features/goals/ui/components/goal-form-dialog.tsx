import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Consequence,
  Field,
  MoneyField,
  Num,
  TextareaField,
  fieldControlReset,
  fieldInput,
  fieldShell,
} from '@/components/ui/form-22'
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
import { Sunk } from '@/components/ui/panel'
import { GoalAllocationsField } from '@/features/goals/ui/components/goal-allocations-field'
import type { AllocationAssetOption } from '@/features/goals/ui/components/goal-allocations-section'
import type { GoalForm } from '@/features/goals/model/goals-form'
import { formatMoney } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type GoalFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<GoalForm>
  /** Every asset the household holds — any of them can back a goal. */
  assetOptions: AllocationAssetOption[]
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

function toNumber(raw: string | undefined): number {
  if (!raw) return 0
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

export function GoalFormDialog({
  open,
  onOpenChange,
  form,
  assetOptions,
  isEditing,
  isSubmitting,
  onSubmit,
}: GoalFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors },
  } = form

  const target = toNumber(useWatch({ control, name: 'target' }))
  const current = toNumber(useWatch({ control, name: 'current' }))
  const allocations = useWatch({ control, name: 'allocations' })
  // The pace is not a field on this form. On create it is the sum of what the
  // wallet rows below say they put in each month; on edit it is the figure the
  // server already keeps, shown only so the sentence below can be honest — the
  // amounts themselves are edited on the goal's assets panel, one wallet at a
  // time, which is where each one can be seen against the account it comes from.
  const storedMonthly = toNumber(useWatch({ control, name: 'plannedMonthly' }))
  const plannedMonthly = isEditing
    ? storedMonthly
    : (allocations ?? []).reduce(
        (sum, row) => sum + toNumber(row.monthlyContribution),
        0,
      )

  const remaining = Math.max(target - current, 0)
  // The §26C rule, mirrored client-side purely as a preview: with no declared
  // monthly contribution there is no honest projected date, so we show the
  // invitation to declare one instead of inventing a number.
  const monthsToGoal =
    plannedMonthly > 0 && remaining > 0 ? Math.ceil(remaining / plannedMonthly) : null

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[92dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <ResponsiveDialogHeader className="px-5 pb-5 pt-5 pr-16 text-left sm:px-8 sm:pt-7 sm:pr-16">
          <ResponsiveDialogTitle className="text-[19px] font-medium tracking-[-0.015em]">
            {isEditing ? t('goals.form.editTitle') : t('goals.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            {t('goals.form.help')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="overflow-y-auto px-5 pb-5 sm:px-8 sm:pb-7"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="space-y-4">
            <Controller
              control={control}
              name="target"
              render={({ field }) => (
                <MoneyField
                  id="goal-target"
                  label={t('goals.form.target')}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.target?.message}
                />
              )}
            />

            <Field
              label={t('goals.form.name')}
              htmlFor="goal-name"
              error={errors.name?.message}
            >
              <div className={cn(fieldShell, errors.name && 'border-alert')}>
                <input
                  id="goal-name"
                  className={fieldInput}
                  placeholder={t('goals.form.namePlaceholder')}
                  {...register('name')}
                />
              </div>
            </Field>

            {/* Which money this goal is made of. Create-only: afterwards each
                share is edited on its own, where the write can be checked
                against what the asset still has free. */}
            {!isEditing ? (
              <Controller
                control={control}
                name="allocations"
                render={({ field }) => (
                  <GoalAllocationsField
                    value={field.value}
                    onChange={field.onChange}
                    assetOptions={assetOptions}
                    error={
                      typeof errors.allocations?.message === 'string'
                        ? errors.allocations.message
                        : undefined
                    }
                  />
                )}
              />
            ) : null}

            {/* Shown only while editing, and read-only: progress is derived
                from the goal's allocations, so there is nothing to type. */}
            {isEditing ? (
              <Field label={t('goals.form.currentLocked')}>
                <Sunk className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <span className="num text-[17px] font-medium text-ink">
                    {formatMoney(current)}
                  </span>
                  <span className="text-[12px] text-ink3">
                    {t('goals.form.currentLockedHelp')}
                  </span>
                </Sunk>
              </Field>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('goals.form.deadline')}>
                <div className={fieldShell}>
                  <Controller
                    control={control}
                    name="targetDate"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        className={cn(fieldControlReset, '[&_svg]:hidden')}
                      />
                    )}
                  />
                </div>
              </Field>

              <Field label={t('goals.form.priority')} error={errors.priority?.message}>
                <div className={cn(fieldShell, errors.priority && 'border-alert')}>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={fieldControlReset}>
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
                </div>
              </Field>
            </div>

            {/* §22.7 — the consequence as a SENTENCE on `--accent-soft`, not a
                labelled grid (that is the language of a report). Never a
                recommendation (§16.1): it states what remains, and a duration
                only when one is honestly derivable. */}
            {target > 0 ? (
              <Consequence>
                {t('goals.form.consequenceRemaining')}{' '}
                <Num>{formatMoney(remaining)}</Num>.{' '}
                {monthsToGoal !== null
                  ? t('goals.form.consequenceMonths', { count: monthsToGoal })
                  : t('goals.form.monthlyEmpty')}
              </Consequence>
            ) : null}

            <TextareaField
              id="goal-note"
              label={t('goals.form.note')}
              placeholder={t('goals.form.notePlaceholder')}
              error={errors.note?.message}
              className="[&_textarea]:min-h-[92px]"
              {...register('note')}
            />
          </div>

          {/* No divider: v4.0 removes the rule above a footer (§2.2, §2.4) —
              spacing is what separates the action row. */}
          <ResponsiveDialogFooter className="mt-5 gap-2.5">
            <Button
              type="button"
              variant="secondary"
              className="h-10 px-4 text-[13px]"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="h-10 px-5 text-[13px]"
            >
              {isSubmitting
                ? t('goals.form.saving')
                : isEditing
                  ? t('goals.form.save')
                  : t('goals.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
