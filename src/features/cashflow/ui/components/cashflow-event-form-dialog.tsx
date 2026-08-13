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
import {
  RECURRENCE_OPTIONS,
  type CashflowEventForm,
} from '@/features/cashflow/model/cashflow-form'
import { cn } from '@/shared/lib/utils'

type CashflowEventFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<CashflowEventForm>
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

/**
 * Create/edit a cashflow event — the only thing that feeds the forecast (§18).
 *
 * `direction` is a segmented choice at the top rather than a dropdown: money in
 * and money out are the two different things this form makes, and which one you
 * are recording changes what the rest of the fields mean.
 */
export function CashflowEventFormDialog({
  open,
  onOpenChange,
  form,
  isEditing,
  isSubmitting,
  onSubmit,
}: CashflowEventFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
  } = form

  const direction = watch('direction')
  const isOutgoing = direction === 'outgoing'

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-ink2">
            {isEditing ? t('upcoming.form.editEyebrow') : t('upcoming.form.eyebrow')}
          </p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {isEditing ? t('upcoming.form.editTitle') : t('upcoming.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {t('upcoming.form.help')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8"
          onSubmit={onSubmit}
          noValidate
        >
          {/* Direction — money in or money out. */}
          <Controller
            control={control}
            name="direction"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-sunk p-1.5">
                {(['outgoing', 'incoming'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      'rounded-[14px] px-4 py-2.5 text-sm font-semibold transition-colors',
                      field.value === value
                        ? 'bg-[hsl(var(--card))] text-foreground shadow-[0_1px_3px_rgba(20,20,28,0.08)]'
                        : 'text-ink2',
                    )}
                  >
                    {t(`upcoming.form.direction.${value}`)}
                  </button>
                ))}
              </div>
            )}
          />

          {/* Hero amount field. */}
          <EventField
            label={t('upcoming.form.amount')}
            error={errors.amount?.message}
            trailing={
              <span className="text-lg font-semibold text-ink2">₫</span>
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

          <EventField label={t('upcoming.form.name')} error={errors.name?.message}>
            <EventFieldInput
              placeholder={
                isOutgoing
                  ? t('upcoming.form.namePlaceholderOutgoing')
                  : t('upcoming.form.namePlaceholderIncoming')
              }
              {...register('name')}
            />
          </EventField>

          <div className="grid gap-4 sm:grid-cols-2">
            <EventField
              label={t('upcoming.form.expectedDate')}
              error={errors.expectedDate?.message}
            >
              <Controller
                control={control}
                name="expectedDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className={eventDateTriggerClass}
                  />
                )}
              />
            </EventField>

            <EventField label={t('upcoming.form.recurrence')}>
              <Controller
                control={control}
                name="recurrence"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`upcoming.form.recurrenceOption.${option}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </EventField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/*
              Requirement is outgoing-only: the backend forces `null` for
              incoming, because nothing obliges money to arrive.
            */}
            {isOutgoing ? (
              <EventField label={t('upcoming.form.requirement')}>
                <Controller
                  control={control}
                  name="requirement"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={eventSelectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">
                          {t('upcoming.markers.required')}
                        </SelectItem>
                        <SelectItem value="planned">
                          {t('upcoming.markers.planned')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </EventField>
            ) : null}

            <EventField label={t('upcoming.form.certainty')}>
              <Controller
                control={control}
                name="certainty"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">
                        {t('upcoming.markers.confirmed')}
                      </SelectItem>
                      <SelectItem value="estimated">
                        {t('upcoming.markers.estimated')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </EventField>
          </div>

          {/* Estimated incoming is shown on the timeline but never banked — say
              so here, so the choice is understood before it is made. */}
          {!isOutgoing && watch('certainty') === 'estimated' ? (
            <p className="px-1 text-sm leading-6 text-ink2">
              {t('upcoming.form.estimatedIncomingHint')}
            </p>
          ) : null}

          <EventField label={t('upcoming.form.note')} error={errors.note?.message}>
            <EventFieldTextarea
              rows={3}
              placeholder={t('upcoming.form.notePlaceholder')}
              {...register('note')}
            />
          </EventField>

          <ResponsiveDialogFooter className="flex-row items-center justify-end gap-2 px-0 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isEditing ? t('upcoming.form.saveEdit') : t('upcoming.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
