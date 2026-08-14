import type { ReactNode } from 'react'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { EventMoneyInput } from '@/components/ui/event-field'
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
import { formatMoney } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type GoalFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<GoalForm>
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

type GoalFieldProps = {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
  className?: string
}

function GoalField({ label, htmlFor, error, children, className }: GoalFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-[7px] block text-[13px] font-normal leading-[1.4] text-ink2"
      >
        {label}
      </label>
      {children}
      {error ? <p className="mt-2 px-1 text-[12px] text-alert">{error}</p> : null}
    </div>
  )
}

const controlClass =
  'flex h-[46px] w-full items-center gap-2 rounded-[10px] border border-transparent bg-sunk px-3.5 transition-colors focus-within:border-accent focus-within:bg-panel'
const inputClass =
  'h-full min-w-0 w-full bg-transparent text-[16px] leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3'

/** Raw digit string → number. Empty / malformed reads as 0. */
function toNumber(raw: string | undefined): number {
  if (!raw) return 0
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
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

  const target = toNumber(useWatch({ control, name: 'target' }))
  const current = toNumber(useWatch({ control, name: 'current' }))
  const plannedMonthly = toNumber(useWatch({ control, name: 'plannedMonthly' }))

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
            <GoalField
              label={t('goals.form.target')}
              htmlFor="goal-target"
              error={errors.target?.message}
            >
              <div className={cn(controlClass, errors.target && 'border-alert')}>
                <Controller
                  control={control}
                  name="target"
                  render={({ field }) => (
                    <EventMoneyInput
                      id="goal-target"
                      className="h-full text-[16px] font-medium tracking-normal sm:text-[16px]"
                      placeholder="0"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <span className="shrink-0 font-mono text-[12px] text-ink3">đ</span>
              </div>
            </GoalField>

            <GoalField
              label={t('goals.form.name')}
              htmlFor="goal-name"
              error={errors.name?.message}
            >
              <div className={cn(controlClass, errors.name && 'border-alert')}>
                <input
                  id="goal-name"
                  className={inputClass}
                  placeholder={t('goals.form.namePlaceholder')}
                  {...register('name')}
                />
              </div>
            </GoalField>

          {/* Create-only. `UpdateFinancialGoalDto` omits currentAmount, so after
              creation the stored total may only move through a goal_contribution
              event — rendering an editable field on edit would promise an edit
              the API silently drops. */}
            {isEditing ? (
              <GoalField label={t('goals.form.currentLocked')}>
                <div className={cn(controlClass, 'justify-between')}>
                  <span className="num text-[16px] font-medium text-ink">
                    {formatMoney(current)}
                  </span>
                  <span className="text-[12px] text-ink3">
                    {t('goals.form.currentLockedHelp')}
                  </span>
                </div>
              </GoalField>
            ) : (
              <GoalField
                label={t('goals.form.current')}
                htmlFor="goal-current"
                error={errors.current?.message}
              >
                <div className={cn(controlClass, errors.current && 'border-alert')}>
                  <Controller
                    control={control}
                    name="current"
                    render={({ field }) => (
                      <EventMoneyInput
                        id="goal-current"
                        className="h-full text-[16px] font-medium tracking-normal sm:text-[16px]"
                        placeholder="0"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <span className="shrink-0 font-mono text-[12px] text-ink3">đ</span>
                </div>
              </GoalField>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <GoalField label={t('goals.form.deadline')}>
                <div className={controlClass}>
                  <Controller
                    control={control}
                    name="targetDate"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        className="h-full rounded-none bg-transparent p-0 text-[16px] font-normal hover:bg-transparent [&_svg]:hidden"
                      />
                    )}
                  />
                </div>
              </GoalField>

              <GoalField
                label={t('goals.form.priority')}
                error={errors.priority?.message}
              >
                <div className={cn(controlClass, errors.priority && 'border-alert')}>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-full rounded-none bg-transparent p-0 text-[16px] font-normal text-ink data-[placeholder]:text-ink3">
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
              </GoalField>
            </div>

          {/* The field the projection depends on. Undeclared → the API returns
              reason: 'no_contribution' and every goal surface can show progress
              only (§14.3, §2.16). */}
            <GoalField
              label={t('goals.form.monthly')}
              htmlFor="goal-monthly"
              error={errors.plannedMonthly?.message}
            >
              <div className={cn(controlClass, errors.plannedMonthly && 'border-alert')}>
                <Controller
                  control={control}
                  name="plannedMonthly"
                  render={({ field }) => (
                    <EventMoneyInput
                      id="goal-monthly"
                      className="h-full text-[16px] font-medium tracking-normal sm:text-[16px]"
                      placeholder="0"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <span className="shrink-0 font-mono text-[12px] text-ink3">đ</span>
              </div>
            </GoalField>

          {/* Consequence preview: what the numbers above mean, shown only once a
              target exists. Never a recommendation (§16.1) — it states the
              remaining amount, and a duration only when one is honestly derivable. */}
            <div>
              <p className="mb-2 text-[12px] leading-5 text-ink3">
                {t('goals.form.monthlyHelp')}
              </p>
              {target > 0 ? (
                <div className="rounded-[10px] bg-sunk px-4 py-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-ink2">
                      {t('goals.form.remaining')}
                    </span>
                    <span className="num text-[14px] font-medium text-ink">
                      {formatMoney(remaining)}
                    </span>
                  </div>
                  {monthsToGoal !== null ? (
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span className="text-[13px] text-ink2">
                        {t('goals.form.estimate')}
                      </span>
                      <span className="text-right text-[13px] font-medium text-ink">
                        {t('goals.form.estimateMonths', { count: monthsToGoal })}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12px] leading-[1.5] text-ink3">
                      {t('goals.form.monthlyEmpty')}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <GoalField
              label={t('goals.form.note')}
              htmlFor="goal-note"
              error={errors.note?.message}
            >
              <textarea
                id="goal-note"
                rows={3}
                className={cn(
                  'min-h-[92px] w-full resize-y rounded-[10px] border border-transparent bg-sunk px-3.5 py-[11px] text-[16px] leading-6 text-ink outline-none transition-colors placeholder:text-ink3 focus:border-accent focus:bg-panel',
                  errors.note && 'border-alert',
                )}
                placeholder={t('goals.form.notePlaceholder')}
                {...register('note')}
              />
            </GoalField>
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
              disabled={!isValid || isSubmitting}
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
