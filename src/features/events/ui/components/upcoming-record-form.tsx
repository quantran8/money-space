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
  TextField,
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
  isEditing?: boolean
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
  isEditing = false,
  isSaving,
  onCancel,
}: UpcomingRecordFormProps) {
  const { t } = useTranslation()

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <MoneyField
            id="upcoming-amount"
            label={t('events.form.amount')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />

      <TextField
        id="upcoming-name"
        label={t('events.form.upcomingName')}
        placeholder={t('events.form.upcomingNamePlaceholder')}
        error={errors.name?.message}
        {...register('name')}
      />

      {/* §22.6 — a specific date, because an upcoming item genuinely has one. */}
      <Field label={t('events.form.dueDate')} error={errors.dueDate?.message}>
        <div className={cn(fieldShell, errors.dueDate && 'border-alert')}>
          <Controller
            control={control}
            name="dueDate"
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

      {/* Required by `buildUpcomingSchema`, so it stays visible and is NOT
          labelled optional — the old copy said "Không bắt buộc" while
          validation rejected an empty value. */}
      <Field label={t('events.form.expectedSource')} error={errors.expectedFromAssetId?.message}>
        <div className={cn(fieldShell, errors.expectedFromAssetId && 'border-alert')}>
          <Controller
            control={control}
            name="expectedFromAssetId"
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

      {/* §22.2 — exactly one disclosure. */}
      <div>
        <button
          type="button"
          onClick={onToggleMoreDetails}
          aria-expanded={showMoreDetails}
          className="text-[13px] text-accent transition-opacity hover:opacity-70"
        >
          {showMoreDetails ? t('events.form.less') : t('events.form.more')}
        </button>

        {showMoreDetails ? (
          <div className="mt-4 space-y-4">
            <Field label={t('events.form.frequency')} error={errors.frequency?.message}>
              <div className={fieldShell}>
                <Controller
                  control={control}
                  name="frequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldControlReset}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">{t('options.recurrence.once')}</SelectItem>
                        <SelectItem value="weekly">{t('options.recurrence.weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('options.recurrence.monthly')}</SelectItem>
                        <SelectItem value="quarterly">
                          {t('options.recurrence.quarterly')}
                        </SelectItem>
                        <SelectItem value="yearly">{t('options.recurrence.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </Field>

            <Field label={t('events.form.owner')}>
              <div className={fieldShell}>
                <Controller
                  control={control}
                  name="ownerMemberId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldControlReset}>
                        <SelectValue placeholder={t('events.form.optional')} />
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
              </div>
            </Field>

            <div className="flex items-center justify-between gap-4 rounded-[10px] bg-sunk px-4 py-3">
              <span className="text-[13px] text-ink2">{t('events.form.attention')}</span>
              <Controller
                control={control}
                name="isAttentionNeeded"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <TextareaField
              id="upcoming-note"
              label={t('events.form.note')}
              placeholder={t('events.form.shortNotePlaceholder')}
              error={errors.note?.message}
              {...register('note')}
            />
          </div>
        ) : null}
      </div>

      <ResponsiveDialogFooter className="mt-5 gap-2.5">
        <Button
          type="button"
          variant="secondary"
          className="h-10 px-4 text-[13px]"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        {/* §22.10 — always enabled. */}
        <Button type="submit" className="h-10 px-5 text-[13px]" disabled={isSaving}>
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
