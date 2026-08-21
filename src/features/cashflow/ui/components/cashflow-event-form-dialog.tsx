import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
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
import {
  RECURRENCE_OPTIONS,
  type CashflowEventForm,
} from '@/features/cashflow/model/cashflow-form'
import { GoalImpactNotice } from '@/features/cashflow/ui/components/goal-impact-notice'
import { cashflowAmountToVnd } from '@/features/cashflow/model/cashflow-form'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { canSettleCashflow } from '@/features/assets/model/assets'
import { cn } from '@/shared/lib/utils'

type CashflowEventFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<CashflowEventForm>
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

type CashflowFieldProps = {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
}

function CashflowField({ label, htmlFor, error, children }: CashflowFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-[7px] block text-[13px] font-normal leading-[1.4] text-ink2"
      >
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-[12px] leading-[1.45] text-alert">{error}</p> : null}
    </div>
  )
}

const controlClass =
  'flex h-[46px] w-full items-center gap-2 rounded-[10px] border border-transparent bg-sunk px-3.5 transition-colors focus-within:border-accent focus-within:bg-panel'
const inputClass =
  'h-full min-w-0 w-full bg-transparent text-[16px] leading-none text-ink outline-none placeholder:text-ink3'
const selectClass =
  'h-full rounded-none bg-transparent p-0 text-[16px] font-normal text-ink data-[placeholder]:text-ink3'

/**
 * Create/edit a cashflow event — the only thing that feeds the forecast (§18).
 * The compact default view asks only for the three facts needed to place an
 * event on the timeline; recurrence and confidence remain one disclosure away.
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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
  } = form

  const direction = watch('direction')
  const certainty = watch('certainty')
  const settlementAssetId = watch('settlementAssetId')
  const amount = watch('amount')
  const { assets } = useAssets()
  // Only wallets the API will accept — flexible money that holds a balance.
  const settlementOptions = assets.filter(canSettleCashflow)
  const isOutgoing = direction === 'outgoing'

  /**
   * The wallet this event settles through.
   *
   * Rendered inline for OUTGOING and inside the disclosure for incoming, because
   * the two directions ask different questions of it. An outflow must name its
   * wallet — both `buildCashflowSchema` and the server reject one without — so
   * hiding it behind "more details" left the submit button disabled with the
   * blocking field and its error message out of sight. Incoming keeps it
   * optional: money arriving backs no goal until it lands.
   *
   * Always rendered, even with no eligible wallet, so the requirement and its
   * error stay visible rather than the form silently refusing to submit.
   */
  const walletSection =
    settlementOptions.length > 0 ? (
      <>
        <CashflowField
          label={t(isOutgoing ? 'upcoming.form.walletOut' : 'upcoming.form.walletIn')}
          error={errors.settlementAssetId?.message}
        >
          <div
            className={cn(
              controlClass,
              errors.settlementAssetId && 'border-alert',
            )}
          >
            <Controller
              control={control}
              name="settlementAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder={t('upcoming.complete.walletPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {settlementOptions.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CashflowField>
        <p className="px-1 text-[12px] leading-5 text-ink2">
          {t(isOutgoing ? 'upcoming.form.walletHintOut' : 'upcoming.form.walletHintIn')}
        </p>
      </>
    ) : (
      /* No eligible wallet exists. An outflow cannot be saved at all in this
         state, so say why instead of leaving the button dead. */
      <p className="rounded-control bg-surface2 px-3 py-2.5 text-[13px] leading-5 text-ink2">
        {t(isOutgoing ? 'upcoming.form.walletNoneOut' : 'upcoming.form.walletNoneIn')}
      </p>
    )

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setDetailsOpen(false)
    onOpenChange(nextOpen)
  }

  function handleSubmit() {
    if (isValid) setDetailsOpen(false)
    onSubmit()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[88dvh] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <ResponsiveDialogHeader className="px-5 pb-4 pt-5 pr-16 text-left sm:px-8 sm:pt-7 sm:pr-16">
          <ResponsiveDialogTitle className="text-[19px] font-medium tracking-[-0.015em]">
            {isEditing ? t('upcoming.form.editTitle') : t('upcoming.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            {t('upcoming.form.help')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="contents" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 overflow-y-auto px-5 pb-5 sm:px-8">
            <div className="space-y-4">
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <div
                    className="grid grid-cols-2 rounded-[10px] bg-sunk p-1"
                    role="group"
                    aria-label={t('upcoming.form.eyebrow')}
                  >
                    {(['outgoing', 'incoming'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={field.value === value}
                        onClick={() => field.onChange(value)}
                        className={cn(
                          'h-[38px] rounded-control text-[13px] font-medium text-ink2 transition-colors',
                          field.value === value && 'bg-panel text-ink',
                        )}
                      >
                        {t(`upcoming.form.direction.${value}`)}
                      </button>
                    ))}
                  </div>
                )}
              />

              <CashflowField
                label={t('upcoming.form.amount')}
                htmlFor="cashflow-amount"
                error={errors.amount?.message}
              >
                <div className={cn(controlClass, errors.amount && 'border-alert')}>
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                      <EventMoneyInput
                        id="cashflow-amount"
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
              </CashflowField>

              <CashflowField
                label={t('upcoming.form.name')}
                htmlFor="cashflow-name"
                error={errors.name?.message}
              >
                <div className={cn(controlClass, errors.name && 'border-alert')}>
                  <input
                    id="cashflow-name"
                    className={inputClass}
                    placeholder={
                      isOutgoing
                        ? t('upcoming.form.namePlaceholderOutgoing')
                        : t('upcoming.form.namePlaceholderIncoming')
                    }
                    {...register('name')}
                  />
                </div>
              </CashflowField>

              <CashflowField
                label={t('upcoming.form.expectedDate')}
                error={errors.expectedDate?.message}
              >
                <div className={cn(controlClass, errors.expectedDate && 'border-alert')}>
                  <Controller
                    control={control}
                    name="expectedDate"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={Boolean(errors.expectedDate)}
                        className="h-full rounded-none bg-transparent p-0 font-mono text-[16px] font-normal hover:bg-transparent [&_svg]:hidden"
                      />
                    )}
                  />
                </div>
              </CashflowField>

              {/* Outgoing asks for the wallet up front: it is required, and the
                  goal impact below cannot be worked out without it. */}
              {isOutgoing ? walletSection : null}

              {/* What this outflow takes from the goals saving into that wallet.
                  Computed locally, so it appears as the amount is typed — the
                  household sees the trade BEFORE saving, not on the goal screen
                  afterwards. Renders nothing when no goal is affected. */}
              {isOutgoing ? (
                <GoalImpactNotice
                  assetId={settlementAssetId || undefined}
                  amount={cashflowAmountToVnd(amount)}
                />
              ) : null}

              <div>
                <button
                  type="button"
                  aria-expanded={detailsOpen}
                  aria-controls="cashflow-event-details"
                  onClick={() => setDetailsOpen((value) => !value)}
                  className="flex min-h-11 w-full items-center justify-between rounded-control text-left text-[13px] font-medium text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <span>{t('upcoming.form.moreDetails')}</span>
                  <ChevronDown
                    className={cn('size-4 transition-transform', detailsOpen && 'rotate-180')}
                  />
                </button>

                {detailsOpen ? (
                  <div id="cashflow-event-details" className="mt-3 space-y-4">
                    <CashflowField label={t('upcoming.form.recurrence')}>
                      <div className={controlClass}>
                        <Controller
                          control={control}
                          name="recurrence"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className={selectClass}>
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
                      </div>
                    </CashflowField>

                    {isOutgoing ? (
                      <CashflowField label={t('upcoming.form.requirement')}>
                        <div className={controlClass}>
                          <Controller
                            control={control}
                            name="requirement"
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className={selectClass}>
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
                        </div>
                      </CashflowField>
                    ) : null}

                    <CashflowField label={t('upcoming.form.certainty')}>
                      <div className={controlClass}>
                        <Controller
                          control={control}
                          name="certainty"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className={selectClass}>
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
                      </div>
                    </CashflowField>

                    {!isOutgoing && certainty === 'estimated' ? (
                      <p className="px-1 text-[12px] leading-5 text-ink2">
                        {t('upcoming.form.estimatedIncomingHint')}
                      </p>
                    ) : null}

                    {isOutgoing ? null : walletSection}

                    <CashflowField
                      label={t('upcoming.form.note')}
                      htmlFor="cashflow-note"
                      error={errors.note?.message}
                    >
                      <textarea
                        id="cashflow-note"
                        rows={3}
                        className={cn(
                          'min-h-[88px] w-full resize-y rounded-[10px] border border-transparent bg-sunk px-3.5 py-[11px] text-[16px] leading-6 text-ink outline-none transition-colors placeholder:text-ink3 focus:border-accent focus:bg-panel',
                          errors.note && 'border-alert',
                        )}
                        placeholder={t('upcoming.form.notePlaceholder')}
                        {...register('note')}
                      />
                    </CashflowField>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <ResponsiveDialogFooter className="shrink-0 flex-row items-center justify-end gap-2.5 px-5 pb-5 pt-3 sm:px-8 sm:pb-7">
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-4 text-[13px]"
              onClick={() => handleOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="h-11 px-5 text-[13px]"
              disabled={!isValid || isSubmitting}
            >
              {isEditing ? t('upcoming.form.saveEdit') : t('upcoming.form.title')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
