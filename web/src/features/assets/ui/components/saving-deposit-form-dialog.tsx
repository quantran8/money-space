import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Controller, useWatch, type UseFormReturn, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DecimalField,
  Field,
  MoneyField,
  Segmented,
  TextField,
  TextareaField,
  fieldControlReset,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AssetClassificationFields } from '@/features/assets/ui/components/asset-classification-fields'
import type { AssetForm } from '@money-space/core/features/assets/model/assets-form'
import {
  maturityDateFromTerm,
  previewSavingDeposit,
  savingTermPresetMonths,
  termPresetForDates,
  type SavingPreview,
} from '@money-space/core/features/assets/model/saving-preview'
import { formatVndExact } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type WalletOption = { value: string; label: string; balance?: number }

type Step = 1 | 2 | 3 | 4

const LAST_STEP: Step = 4

const STEPS: Array<{ step: Step; key: string }> = [
  { step: 1, key: 'account' },
  { step: 2, key: 'amount' },
  { step: 3, key: 'interest' },
  { step: 4, key: 'review' },
]

/**
 * The fields each step may block on. Advancing validates only these, so a
 * later step's missing value never traps the user on an earlier one — the same
 * contract the debt wizard uses.
 *
 * `maturityDate` sits on the amount step because that is where the term picker
 * renders its error, and `receivingWalletId` on the interest step for the same
 * reason: an error must appear on the screen that owns the control.
 */
const STEP_FIELDS: Record<Step, Array<keyof AssetForm>> = {
  1: ['name'],
  2: ['principal', 'startDate', 'maturityDate'],
  3: ['interestRate', 'nonTermRate', 'receivingWalletId'],
  4: [],
}

type SavingDepositFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<AssetForm>
  setValue: UseFormSetValue<AssetForm>
  walletOptions: WalletOption[]
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onRemove?: () => void
}

/**
 * The saving-deposit branch of the asset form, as a wizard.
 *
 * A passbook is not "an asset with some extra detail": it is four decisions
 * taken together at the bank counter — how much, for how long, at what rate,
 * and where the interest lands. Every one of them is required to save, so the
 * §22.2 disclosure the generic asset form uses was the wrong container twice
 * over: it hid a REQUIRED field (`nonTermRate`), which made "Thêm nguồn tiền"
 * report an error against a control the form was not rendering, and it filed
 * as "secondary detail" the very terms that decide what the household is
 * promised.
 *
 * Steps rather than one long column, matching the debt wizard: both record an
 * instrument with a term, a rate and a schedule, and neither fits §22.0's
 * "≤ 4 fields visible" in a single pane. The wizard keeps each pane at three
 * or four fields and turns the length into a sequence the user can see the end
 * of.
 */
export function SavingDepositFormDialog({
  open,
  onOpenChange,
  form,
  setValue,
  walletOptions,
  isEditing,
  isSubmitting,
  onSubmit,
  onRemove,
}: SavingDepositFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    trigger,
    formState: { errors },
  } = form

  const [step, setStep] = useState<Step>(1)
  // The furthest step reached, so the rail offers a jump back to anything
  // already visited without letting the user skip ahead past validation.
  const [furthestStep, setFurthestStep] = useState<Step>(1)
  /**
   * Armed only by a deliberate press of Save. `requestStep` awaits `trigger()`,
   * so the step advances a microtask AFTER the click handler returns and the
   * footer's button is swapped under an in-flight click or held Enter — which
   * would otherwise save straight from the review step. A ref, not state: the
   * submit handler must read it in the same tick the click sets it.
   */
  const saveArmed = useRef(false)

  const name = useWatch({ control, name: 'name' })
  const principal = useWatch({ control, name: 'principal' })
  const startDate = useWatch({ control, name: 'startDate' })
  const maturityDate = useWatch({ control, name: 'maturityDate' })
  const interestRate = useWatch({ control, name: 'interestRate' })
  const nonTermRate = useWatch({ control, name: 'nonTermRate' })
  const interestPayment = useWatch({ control, name: 'interestPayment' })
  const interestDestination = useWatch({ control, name: 'interestDestination' })
  const receivingWalletId = useWatch({ control, name: 'receivingWalletId' })
  const countsAsFlexible = useWatch({ control, name: 'countsAsFlexible' })

  const preview = previewSavingDeposit({
    type: 'saving_deposit',
    principal,
    interestRate,
    startDate,
    maturityDate,
    nonTermRate,
    interestPayment,
  })
  const walletName = walletOptions.find((option) => option.value === receivingWalletId)?.label

  function goToStep(nextStep: Step) {
    setStep(nextStep)
    setFurthestStep((reached) => (nextStep > reached ? nextStep : reached))
  }

  /**
   * Move forward only once every step between the current one and the target
   * passes. Jumping back is always allowed — the user is returning to fix
   * something, and re-validating there would flag fields they have not reached.
   */
  async function requestStep(nextStep: Step) {
    if (nextStep <= step) {
      goToStep(nextStep)
      return
    }
    for (let current = step; current < nextStep; current += 1) {
      const fields = STEP_FIELDS[current as Step]
      // Sequential on purpose: steps must fail in order so the user lands on
      // the earliest one that still needs input.
      const ok = fields.length === 0 || (await trigger(fields, { shouldFocus: true }))
      if (!ok) {
        goToStep(current as Step)
        return
      }
    }
    goToStep(nextStep)
  }

  function handleOpenChange(nextOpen: boolean) {
    // Onboarding renders the asset dialogs without a `key`, so this never
    // remounts — the step must be reset here or the next open lands mid-wizard.
    if (!nextOpen) {
      setStep(1)
      setFurthestStep(1)
    }
    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Steps 1–3 are not a submit: pressing Enter in any input triggers the
    // browser's implicit submission. This check is the single authority on
    // whether a submit is legitimate — the step must ALREADY be the last one
    // when the event arrives, so an event that raced the transition becomes an
    // advance instead of a save.
    if (step < LAST_STEP) {
      event.preventDefault()
      void requestStep((step + 1) as Step)
      return
    }
    if (!saveArmed.current) {
      event.preventDefault()
      return
    }
    saveArmed.current = false
    // The step is NOT reset here: a failed save would leave the user back on
    // step 1 with the error out of sight. Closing the dialog resets it.
    onSubmit(event)
  }

  /** One line per rail row, so the sidebar doubles as the running summary. */
  function railSummary(target: Step): string {
    const empty = t('assets.form.deposit.rail.empty')
    if (target === 1) return name?.trim() || empty
    if (target === 2) {
      if (!preview) return principal ? formatVndExact(Number(principal)) : empty
      return `${formatVndExact(preview.onTime.principal)} · ${t('assets.form.savingTermMonths', {
        count: preview.termMonths,
      })}`
    }
    if (target === 3) {
      if (!interestRate) return empty
      return `${interestRate}%/năm · ${t(`options.interestPayment.${interestPayment}`)}`
    }
    return preview ? formatVndExact(preview.onTime.total) : t('assets.form.deposit.rail.reviewAll')
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      {/* Fixed height on desktop, as in the debt wizard: a centred dialog that
          resizes per step moves its own footer and re-centres under the cursor
          on every Continue. The step content scrolls inside instead. */}
      <ResponsiveDialogContent className="grid max-h-[92dvh] gap-0 overflow-hidden p-0 md:h-[min(660px,92dvh)] sm:max-w-[900px] lg:grid-cols-[240px_1fr]">
        <aside className="hidden min-h-0 flex-col overflow-y-auto border-r border-divider bg-canvas p-5 lg:flex">
          <ResponsiveDialogTitle className="mt-1 t-subtitle">
            {isEditing ? t('assets.form.deposit.editTitle') : t('assets.form.deposit.createTitle')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            {t('assets.form.help')}
          </ResponsiveDialogDescription>

          <div className="mt-6 space-y-1">
            {STEPS.map((item) => {
              const reachable = item.step <= furthestStep
              return (
                <button
                  key={item.step}
                  type="button"
                  disabled={!reachable}
                  aria-current={step === item.step ? 'step' : undefined}
                  onClick={() => void requestStep(item.step)}
                  className={cn(
                    'w-full rounded-control px-3 py-2.5 text-left transition-colors',
                    reachable ? 'hover:bg-wash' : 'cursor-default',
                    step === item.step && 'bg-wash',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="t-caption text-ink3">
                      {t(`assets.form.deposit.steps.${item.key}`)}
                    </span>
                    <RailStatus step={item.step} current={step} done={item.step < furthestStep} />
                  </div>
                  <p className="mt-1 truncate t-body-sm">{railSummary(item.step)}</p>
                </button>
              )
            })}
          </div>
        </aside>

        {/* `max-h-[inherit]` is what makes the inner `1fr` row scroll: a grid
            ROW is `auto` by default, so without it the form grows past the cap
            and is simply clipped. */}
        <form
          className="grid max-h-[inherit] min-h-0 grid-rows-[auto_1fr_auto]"
          onSubmit={handleSubmit}
          noValidate
        >
          <ResponsiveDialogHeader className="px-5 pb-2 pr-16 pt-5 text-left sm:px-8 sm:pr-16 sm:pt-7">
            <p className="t-body-sm text-ink3">
              {t('assets.form.deposit.rail.stepOf', { step, total: LAST_STEP })}
            </p>
            {/* The rail carries the title on wide screens; the narrow layout
                drops the rail, so the title is restated here. */}
            <ResponsiveDialogTitle className="mt-1 t-subhead font-medium tracking-[-0.015em] lg:hidden">
              {isEditing ? t('assets.form.deposit.editTitle') : t('assets.form.deposit.createTitle')}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-4 sm:px-8">
            {step === 1 ? (
              <div className="space-y-5">
                <StepHeading title={t('assets.form.deposit.sections.account')} />

                <TextField
                  id="asset-name"
                  label={t('assets.form.name')}
                  placeholder={t('assets.form.deposit.namePlaceholder')}
                  error={errors.name?.message}
                  {...register('name')}
                />

                {/* §22.1 — the household's own call on what "money we can use"
                    means. Money in a passbook is not spendable by default, so
                    this starts off; flipping it moves the headline figure. */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <label
                      htmlFor="asset-counts-as-flexible"
                      className="t-body-sm leading-[1.4] text-ink2"
                    >
                      {t('assets.form.countsAsFlexible')}
                    </label>
                    <p className="mt-1 t-caption leading-[1.45] text-ink3">
                      {t('assets.form.countsAsFlexibleHint')}
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="countsAsFlexible"
                    render={({ field }) => (
                      <Switch
                        id="asset-counts-as-flexible"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* Who is responsible for the passbook, and any note about it.
                    Both answer this step's question — WHICH account is this —
                    so they sit here rather than on the review step, which is a
                    read-only check of what was already entered. */}
                <AssetClassificationFields form={form} defaultToCurrentMember={!isEditing} />

                <TextareaField
                  id="asset-note"
                  label={t('assets.form.note')}
                  placeholder={t('assets.form.notePlaceholder')}
                  error={errors.note?.message}
                  {...register('note')}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <StepHeading title={t('assets.form.deposit.sections.amount')} />

                <Controller
                  control={control}
                  name="principal"
                  render={({ field }) => (
                    <MoneyField
                      id="asset-principal"
                      label={t('assets.form.principal')}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.principal?.message}
                    />
                  )}
                />

                <Field
                  label={t('assets.form.savingStartDate')}
                  error={errors.startDate?.message}
                >
                  <div className={cn(fieldShell, errors.startDate && 'border-alert-ink')}>
                    <Controller
                      control={control}
                      name="startDate"
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

                <SavingTermField
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  t={t}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <StepHeading title={t('assets.form.deposit.sections.interest')} />

                <Controller
                  control={control}
                  name="interestRate"
                  render={({ field }) => (
                    <DecimalField
                      id="asset-interest-rate"
                      label={t('assets.form.interestRate')}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="5,2"
                      suffix="%/năm"
                      error={errors.interestRate?.message}
                    />
                  )}
                />

                <Field
                  label={t('assets.form.interestPayment')}
                  error={errors.interestPayment?.message}
                >
                  <Controller
                    control={control}
                    name="interestPayment"
                    render={({ field }) => (
                      <Segmented
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          {
                            value: 'end_of_term' as const,
                            label: t('options.interestPayment.end_of_term'),
                          },
                          {
                            value: 'monthly' as const,
                            label: t('options.interestPayment.monthly'),
                          },
                        ]}
                      />
                    )}
                  />
                </Field>

                <Controller
                  control={control}
                  name="nonTermRate"
                  render={({ field }) => (
                    <DecimalField
                      id="asset-non-term-rate"
                      label={t('assets.form.nonTermRate')}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0,2"
                      suffix="%/năm"
                      error={errors.nonTermRate?.message}
                    />
                  )}
                />

                <Field
                  label={t('assets.form.interestDestination')}
                  error={errors.interestDestination?.message}
                >
                  <div className={fieldShell}>
                    <Controller
                      control={control}
                      name="interestDestination"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={fieldControlReset}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="principal">
                              {t('options.interestDestination.principal')}
                            </SelectItem>
                            <SelectItem value="wallet">
                              {t('options.interestDestination.wallet')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </Field>

                {interestDestination === 'wallet' ? (
                  <Field
                    label={t('assets.form.receivingWallet')}
                    error={errors.receivingWalletId?.message}
                  >
                    <div
                      className={cn(fieldShell, errors.receivingWalletId && 'border-alert-ink')}
                    >
                      <Controller
                        control={control}
                        name="receivingWalletId"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={fieldControlReset}>
                              <SelectValue
                                placeholder={t('assets.form.receivingWalletPlaceholder')}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {walletOptions.map((option) => (
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

                {/* §22.7 — the consequence arrives with the rate that produces
                    it, not two screens later. A deposit's payout is the one
                    figure the household cannot work out in their head. */}
                <SavingPreviewBlock
                  preview={preview}
                  interestRate={interestRate}
                  interestPayment={interestPayment}
                  walletName={interestDestination === 'wallet' ? walletName : undefined}
                  t={t}
                />
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <StepHeading
                  title={t(
                    isEditing
                      ? 'assets.form.deposit.sections.reviewEdit'
                      : 'assets.form.deposit.sections.reviewCreate',
                  )}
                />

                {/* §29 — the answer first. The payout is what the review is
                    FOR; the field-by-field list below is how it was arrived at,
                    and reading it before the figure buries the conclusion. */}
                <SavingPreviewBlock
                  preview={preview}
                  interestRate={interestRate}
                  interestPayment={interestPayment}
                  walletName={interestDestination === 'wallet' ? walletName : undefined}
                  t={t}
                />

                {/* Only what the block above does NOT already show. Gốc, lãi
                    and the term are printed there; repeating them here made the
                    reader check the same figure twice on one screen. */}
                <div className="border-t border-divider pt-4">
                  <dl className="space-y-3 t-body-sm">
                    <SummaryRow label={t('assets.form.name')} value={name?.trim() || '—'} />
                    <SummaryRow
                      label={t('assets.form.savingStartDate')}
                      value={startDate ? formatIsoDate(startDate) : '—'}
                      numeric
                    />
                    <SummaryRow
                      label={t('assets.form.maturityDate')}
                      value={maturityDate ? formatIsoDate(maturityDate) : '—'}
                      numeric
                    />
                    <SummaryRow
                      label={t('assets.form.interestRate')}
                      value={interestRate ? `${interestRate}%/năm` : '—'}
                      numeric
                    />
                    <SummaryRow
                      label={t('assets.form.interestPayment')}
                      value={t(`options.interestPayment.${interestPayment}`)}
                    />
                    <SummaryRow
                      label={t('assets.form.nonTermRate')}
                      value={nonTermRate ? `${nonTermRate}%/năm` : '—'}
                      numeric
                    />
                    <SummaryRow
                      label={t('assets.form.interestDestination')}
                      value={
                        interestDestination === 'wallet'
                          ? (walletName ?? t('options.interestDestination.wallet'))
                          : t('options.interestDestination.principal')
                      }
                    />
                    <SummaryRow
                      label={t('assets.form.countsAsFlexible')}
                      value={t(
                        countsAsFlexible
                          ? 'assets.form.deposit.flexibleYes'
                          : 'assets.form.deposit.flexibleNo',
                      )}
                    />
                  </dl>
                </div>
              </div>
            ) : null}
          </div>

          <ResponsiveDialogFooter className="shrink-0 flex-row items-center justify-between px-5 pb-5 pt-3 sm:px-8 sm:pb-7">
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 px-4"
                  onClick={() => goToStep((step - 1) as Step)}
                >
                  ← {t('assets.form.deposit.actions.back')}
                </Button>
              ) : null}
              {/* §22.11 — the destructive action sits in the row, never in a
                  bordered "Danger zone", and only once there is a record to
                  remove. It waits for the review step so it can never be hit
                  while the user is still moving through the wizard. */}
              {isEditing && onRemove && step === LAST_STEP ? (
                <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
                  <Trash2Icon />
                  {t('assets.form.remove')}
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5">
              {step < LAST_STEP ? (
                /* `key` forces a fresh MOUNT when the step changes: reusing the
                   node let the freshly-rendered submit button inherit focus and
                   an in-flight Enter, saving straight from the review step. */
                <Button
                  key="advance"
                  type="button"
                  className="h-11 px-5"
                  onClick={() => void requestStep((step + 1) as Step)}
                >
                  {t(
                    step === LAST_STEP - 1
                      ? 'assets.form.deposit.actions.review'
                      : 'assets.form.deposit.actions.continue',
                  )}
                </Button>
              ) : (
                /* §22.10 — never disabled on validity; errors explain the reason. */
                <Button
                  key="save"
                  type="submit"
                  className="h-11 px-5"
                  disabled={isSubmitting}
                  onClick={() => {
                    saveArmed.current = true
                  }}
                >
                  {isSubmitting
                    ? t('assets.form.saving')
                    : isEditing
                      ? t('assets.form.update')
                      : t('assets.form.create')}
                </Button>
              )}
            </div>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

type Translate = (key: string, params?: Record<string, unknown>) => string
type Control = UseFormReturn<AssetForm>['control']
type Errors = UseFormReturn<AssetForm>['formState']['errors']

/**
 * Each step asks one question, and the heading is the whole of it — a sub-line
 * restating it in other words is copy the reader has to read twice to learn
 * nothing.
 */
function StepHeading({ title }: { title: string }) {
  return <h2 className="t-title">{title}</h2>
}

/**
 * The rail's per-step marker: a tick once the step is behind the user, a filled
 * dot for where they are, and a committed-grey dot for what is still ahead.
 */
function RailStatus({ step, current, done }: { step: Step; current: Step; done: boolean }) {
  if (done && step !== current) {
    return <Check className="size-4 shrink-0 text-ink" aria-hidden />
  }
  return (
    <span
      className={cn('size-2 shrink-0 rounded-full bg-committed', step === current && 'bg-action')}
      aria-hidden
    />
  )
}

function SummaryRow({
  label,
  value,
  numeric,
}: {
  label: string
  value: string
  numeric?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink2">{label}</dt>
      <dd className={cn('text-right font-medium', numeric && 'num')}>{value}</dd>
    </div>
  )
}

/**
 * The term, as the bank sells it: a row of tenors, not a calendar.
 *
 * `maturityDate` is still what the form submits — the presets only compute it —
 * so nothing downstream learns a new concept. "Khác" reveals the date picker
 * for a passbook whose term is not on the list.
 */
function SavingTermField({
  control,
  errors,
  setValue,
  t,
}: {
  control: Control
  errors: Errors
  setValue: UseFormSetValue<AssetForm>
  t: Translate
}) {
  const startDate = useWatch({ control, name: 'startDate' })
  const maturityDate = useWatch({ control, name: 'maturityDate' })
  const preset = termPresetForDates(startDate, maturityDate)
  // Sticky: a date matching no preset means the user chose "Khác" and picked
  // one, and the picker must stay open across the re-render that follows.
  const [custom, setCustom] = useState(() => Boolean(maturityDate) && preset === null)
  const showCustom = custom || (Boolean(maturityDate) && preset === null)

  // Moving the deposit date moves the maturity with it: "gửi 12 tháng" is a
  // length, and re-dating the passbook must not silently shorten the term.
  const previousStart = useRef(startDate)
  useEffect(() => {
    if (previousStart.current === startDate) return
    previousStart.current = startDate
    if (preset === null || !startDate) return
    setValue('maturityDate', maturityDateFromTerm(startDate, preset), { shouldDirty: true })
  }, [startDate, preset, setValue])

  function choosePreset(months: number) {
    setCustom(false)
    setValue('maturityDate', maturityDateFromTerm(startDate, months), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <Field label={t('assets.form.savingTerm')} error={errors.maturityDate?.message}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('assets.form.savingTerm')}>
        {savingTermPresetMonths.map((months) => {
          const active = !showCustom && preset === months
          return (
            <button
              key={months}
              type="button"
              aria-pressed={active}
              onClick={() => choosePreset(months)}
              className={cn(
                'h-11 rounded-control bg-wash px-4 t-body-sm text-ink2 transition-colors hover:bg-committed',
                active && 'bg-action text-action-inverse hover:bg-ink2',
              )}
            >
              {t('assets.form.savingTermMonths', { count: months })}
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={showCustom}
          onClick={() => setCustom(true)}
          className={cn(
            'h-11 rounded-control bg-wash px-4 t-body-sm text-ink2 transition-colors hover:bg-committed',
            showCustom && 'bg-action text-action-inverse hover:bg-ink2',
          )}
        >
          {t('assets.form.savingTermCustom')}
        </button>
      </div>

      {showCustom ? (
        <div className={cn(fieldShell, 'mt-2', errors.maturityDate && 'border-alert-ink')}>
          <Controller
            control={control}
            name="maturityDate"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                className={cn(fieldControlReset, 'justify-start [&_svg]:hidden')}
              />
            )}
          />
        </div>
      ) : maturityDate ? (
        // The chosen tenor, read back as the date the passbook will carry — the
        // figure the household checks against the paper in their hand.
        <p className="mt-2 num t-caption text-ink3">
          {t('assets.form.savingTermMaturity', { date: formatIsoDate(maturityDate) })}
        </p>
      ) : null}
    </Field>
  )
}

/**
 * What the deposit pays, before it is created.
 *
 * Laid out as §4 inline-summary rows under one divider — not the three-column
 * table the detail page uses. §19 allows rows and dividers inside a modeled
 * surface and forbids nested metric cards; §22.7's sentence rule is honoured by
 * the closing lines, which carry the payout schedule and the early-withdrawal
 * cost as prose rather than more columns.
 *
 * Exact đồng throughout: gốc + lãi = thực nhận is a subtraction the reader does
 * on screen, and these are numbers they typed moments ago and are about to
 * confirm — both triggers for `formatVndExact` (§6).
 */
function SavingPreviewBlock({
  preview,
  interestRate,
  interestPayment,
  walletName,
  t,
}: {
  preview: SavingPreview | null
  interestRate: string
  interestPayment: AssetForm['interestPayment']
  /** Only set when interest is paid out to a wallet AND one has been chosen. */
  walletName?: string
  t: Translate
}) {
  // The same block, holding its shape: an em-dash where the figure will land,
  // so filling the rate in does not make the surface jump a step in height.
  // §2.16 — never look more certain than the data; a placeholder is honest,
  // a zero would not be.
  if (!preview) {
    return (
      <div aria-live="polite" className="rounded-[14px] bg-accent-soft px-5 py-5">
        <p className="t-caption-sm font-medium text-ink3">{t('assets.form.preview.title')}</p>
        <p className="money-number mt-2 t-figure text-ink3">—</p>
        <p className="mt-1 t-body-sm text-ink3">{t('assets.form.preview.needsInput')}</p>
      </div>
    )
  }

  const monthly = interestPayment === 'monthly'
  // Naming a wallet the user has not picked yet would promise a destination
  // that does not exist, so the sentence falls back to the principal wording.
  const scheduleKey = monthly
    ? walletName
      ? 'assets.form.preview.monthlyToWallet'
      : 'assets.form.preview.monthlyToPrincipal'
    : walletName
      ? 'assets.form.preview.endOfTermToWallet'
      : 'assets.form.preview.endOfTermToPrincipal'

  return (
    <div aria-live="polite" className="rounded-[14px] bg-accent-soft px-5 py-5">
      {/* §32 — the answer leads, at hero weight. "Thực nhận" is the whole
          reason the household is filling this form in; as one more right-hand
          figure among four it read as a footnote to its own inputs. The parts
          that produce it are demoted below the divider, which is where §22.5's
          "số lớn là output, không phải input" points: the big number is the
          one the app computed, never one that was typed.

          `--accent-soft` is the surface for "what happens if I do this"
          (§22.7 / §11.7) — the same ground the consequence block uses
          everywhere else in the app, and the only surface that wears it. */}
      <p className="t-caption-sm font-medium text-ink3">{t('assets.form.preview.title')}</p>
      <p className="money-number mt-2 t-figure text-ink">
        {formatVndExact(preview.onTime.total)}
      </p>
      <p className="mt-1 t-body-sm text-ink2">{t('assets.form.preview.totalCaption')}</p>

      <div className="mt-4 space-y-2 border-t border-divider pt-4">
        <PreviewRow label={t('assets.form.preview.principal')} value={preview.onTime.principal} />
        <PreviewRow
          label={t('assets.form.preview.interest')}
          meta={t('assets.form.preview.interestMeta', {
            rate: interestRate,
            months: preview.termMonths,
          })}
          value={preview.onTime.interest}
        />
        {/* What lands each month, as its own figure. On a `monthly` passbook it
            is the amount that actually arrives — the number a household plans
            around — and quoting only the term total leaves them dividing it by
            hand. On `end_of_term` nothing arrives monthly, so it is labelled as
            the average the deposit earns rather than a payout. */}
        <PreviewRow
          label={t(
            monthly
              ? 'assets.form.preview.monthlyInterest'
              : 'assets.form.preview.monthlyAccrual',
          )}
          value={preview.monthlyInterest}
        />
      </div>

      <p className="mt-4 t-caption leading-[1.5] text-ink2">
        {t(scheduleKey, {
          amount: formatVndExact(monthly ? preview.monthlyInterest : preview.onTime.interest),
          wallet: walletName ?? '',
          count: preview.termMonths,
        })}
      </p>

      {/* Why the form asks for a non-term rate at all, answered in money. */}
      {preview.earlyPenalty > 0 ? (
        <p className="mt-1.5 t-caption leading-[1.5] text-ink2">
          {t('assets.form.preview.early', {
            month: preview.earlyMonth,
            total: formatVndExact(preview.early.total),
            penalty: formatVndExact(preview.earlyPenalty),
          })}
        </p>
      ) : null}
    </div>
  )
}

function PreviewRow({ label, meta, value }: { label: string; meta?: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 t-body-sm text-ink2">
        {label}
        {meta ? <span className="ml-1.5 t-caption text-ink3">{meta}</span> : null}
      </span>
      <span className="num shrink-0 t-body-sm text-ink">{formatVndExact(value)}</span>
    </div>
  )
}

/** `2027-09-05` → `05/09/2027`, the form the passbook itself uses. */
function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}
