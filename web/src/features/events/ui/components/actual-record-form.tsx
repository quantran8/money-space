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
import {
  Field,
  MoneyField,
  Segmented,
  TextareaField,
  fieldControlReset,
  fieldShell,
} from '@/components/ui/form-22'
import { ResponsiveDialogFooter } from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { EventEffect } from '@/features/events/ui/components/event-effect'
import type {
  ActualRecordForm as ActualRecordFormValues,
  QuickAction,
} from '@money-space/core/features/events/model/events-form'
import { cn } from '@money-space/core/shared/lib/utils'

type Option = { value: string; label: string }

type ActualRecordFormProps = {
  control: Control<ActualRecordFormValues>
  register: UseFormRegister<ActualRecordFormValues>
  errors: FieldErrors<ActualRecordFormValues>
  handleSubmit: UseFormHandleSubmit<ActualRecordFormValues>
  onSubmit: (values: ActualRecordFormValues) => void
  quickAction: QuickAction
  isRevaluation?: boolean
  isEditing?: boolean
  sourceAssetOptions: Option[]
  categoryOptions: Option[]
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
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
  isEditing = false,
  sourceAssetOptions,
  categoryOptions,
  showMoreDetails,
  onToggleMoreDetails,
  isSaving,
  onCancel,
}: ActualRecordFormProps) {
  const { t } = useTranslation()
  const isIncome = quickAction === 'income'
  const isExpense = quickAction === 'expense' || quickAction === 'payment_paid'
  const showsCategory = !isRevaluation && (quickAction === 'expense' || quickAction === 'income')
  const showsFrom =
    !isRevaluation &&
    (isExpense || quickAction === 'transfer')
  const showsTo = !isRevaluation && (isIncome || quickAction === 'transfer')

  const fromLabel =
    quickAction === 'transfer'
      ? t('events.form.transferFrom')
        : t('events.form.payFrom')

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {isRevaluation ? (
        <Controller
          control={control}
          name="revaluationDirection"
          render={({ field }) => (
            <Segmented
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'increase', label: t('events.form.revaluationIncrease') },
                { value: 'decrease', label: t('events.form.revaluationDecrease') },
              ]}
            />
          )}
        />
      ) : null}

      {/* §22.5 — standard height. A hero-size input says the number is an
          output; here it is the thing being entered. */}
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <MoneyField
            id="event-amount"
            label={t('events.form.amount')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />

      {showsCategory ? (
        <Field label={t('events.form.whatFor')} error={errors.category?.message}>
          <div className={cn(fieldShell, errors.category && 'border-alert-ink')}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldControlReset}>
                    <SelectValue placeholder={t('events.form.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </Field>
      ) : null}

      {showsFrom ? (
        <Field label={fromLabel} error={errors.fromAssetId?.message}>
          <div className={cn(fieldShell, errors.fromAssetId && 'border-alert-ink')}>
            <Controller
              control={control}
              name="fromAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldControlReset}>
                    <SelectValue placeholder={t('events.form.selectPlaceholder')} />
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
          </div>
        </Field>
      ) : null}

      {showsTo ? (
        <Field
          label={quickAction === 'transfer' ? t('events.form.transferTo') : t('events.form.receiveInto')}
          error={errors.toAssetId?.message}
        >
          <div className={cn(fieldShell, errors.toAssetId && 'border-alert-ink')}>
            <Controller
              control={control}
              name="toAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldControlReset}>
                    <SelectValue placeholder={t('events.form.selectPlaceholder')} />
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
          </div>
        </Field>
      ) : null}

      {/* §22.7 — the consequence, in one sentence, per keystroke. */}
      {!isRevaluation ? (
        <EventEffect control={control} quickAction={quickAction} isEditing={isEditing} />
      ) : null}

      {/* §22.2 — exactly one disclosure. Date lives here because it defaults to
          today and §22.1 says don't ask what the app already knows. */}
      <div>
        <button
          type="button"
          onClick={onToggleMoreDetails}
          aria-expanded={showMoreDetails}
          className="t-body-sm text-action transition-opacity hover:opacity-70"
        >
          {showMoreDetails ? t('events.form.less') : t('events.form.more')}
        </button>

        {showMoreDetails ? (
          <div className="mt-4 space-y-4">
            <Field
              label={t('events.form.shortDate')}
              error={errors.eventDate?.message}
            >
              <div className={cn(fieldShell, errors.eventDate && 'border-alert-ink')}>
                <Controller
                  control={control}
                  name="eventDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(fieldControlReset, 'justify-start [&_svg]:hidden')}
                    />
                  )}
                />
              </div>
            </Field>


            {!isRevaluation ? (
              <div className="flex items-center justify-between gap-4 rounded-[10px] bg-wash px-4 py-3">
                <span className="t-body-sm text-ink2">{t('events.form.attention')}</span>
                <Controller
                  control={control}
                  name="isAttentionNeeded"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            ) : null}

            <TextareaField
              id="event-note"
              label={t('events.form.note')}
              placeholder={t('events.form.shortNotePlaceholder')}
              error={errors.note?.message}
              {...register('note')}
            />
          </div>
        ) : null}
      </div>

      {/* No divider: spacing separates the action row (§2.2, §2.4). */}
      <ResponsiveDialogFooter className="mt-5 gap-2.5">
        <Button
          type="button"
          variant="secondary"
          className="px-4"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        {/* §22.10 — always enabled; errors say what is missing. */}
        <Button type="submit" className="px-5" disabled={isSaving}>
          {isSaving
            ? t('events.form.saving')
            : isEditing
              ? t('events.form.saveChanges')
              : t('events.form.save')}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
