import { Check, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormTrigger,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { MonthPicker } from '@/components/ui/month-picker'
import { EventMoneyInput } from '@/components/ui/event-field'
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
import type { DebtForm } from '@money-space/core/features/debts/model/debts-form'
import {
  toMonthStartIso,
  withDayOfMonth,
} from '@money-space/core/features/debts/model/debts-interest'
import { isFixedScheduleLender, type LenderType } from '@money-space/core/features/debts/model/debts.types'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type Option = { value: string; label: string }
type Step = 1 | 2 | 3 | 4 | 5 | 6

const LAST_STEP: Step = 6

const STEPS: Array<{ step: Step; key: string }> = [
  { step: 1, key: 'debt' },
  { step: 2, key: 'amount' },
  { step: 3, key: 'received' },
  { step: 4, key: 'schedule' },
  { step: 5, key: 'interest' },
  { step: 6, key: 'review' },
]

/**
 * The fields each step is allowed to block on. Advancing past a step validates
 * only these, so a later step's missing value never traps the user on an earlier
 * one. Fields that are conditionally required (`expectedFinalDueDate` and
 * `interestPeriods` for bank loans, `firstPaymentDate` once a frequency is set)
 * are listed on the step whose UI actually renders their error. The per-period
 * amount sits on the interest step, not the schedule one: its suggested value
 * is only right once we know whether the loan charges interest.
 */
const STEP_FIELDS: Record<Step, Array<keyof DebtForm>> = {
  1: ['name', 'lenderName'],
  2: ['originalAmount', 'outstandingAmount'],
  3: ['borrowedAt'],
  4: ['paymentFrequency', 'firstPaymentDate', 'expectedFinalDueDate'],
  5: ['interestPeriods', 'fixedPaymentAmount'],
  6: [],
}

const LENDER_TYPES: LenderType[] = ['bank_institution', 'relative', 'other']

const PAYMENT_FREQUENCIES: DebtForm['paymentFrequency'][] = ['monthly', 'quarterly', 'yearly', 'none']

const CALC_OPTIONS: Array<{ value: DebtForm['interestCalc']; labelKey: string; hintKey: string }> = [
  { value: 'reducing', labelKey: 'reducing', hintKey: 'reducingHint' },
  { value: 'fixed', labelKey: 'fixed', hintKey: 'fixedHint' },
]

function formatVnd(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value
  if (!amount || !Number.isFinite(amount)) return '—'
  return formatMoney(amount)
}

// Mirrors input.tsx: h-11, white fill, 1px committed stroke, rounded-control,
// and the blue focus ring. A field is never a wash fill — inside a white card
// that reads as a second surface rather than as a control.
const controlClass =
  'flex h-11 w-full items-center gap-2 rounded-control border border-committed bg-card px-4 transition-[border-color,box-shadow] duration-150 focus-within:border-data-primary focus-within:shadow-[0_0_0_3px_rgba(115,164,215,0.16)]'
const inputClass =
  'h-full min-w-0 w-full bg-transparent t-body leading-none text-ink outline-none placeholder:text-ink3'
const selectClass =
  'h-full rounded-none border-0 bg-transparent p-0 t-body text-ink shadow-none focus-visible:shadow-none data-[placeholder]:text-ink3'

type DebtFieldProps = {
  label: string
  htmlFor?: string
  error?: string
  optional?: boolean
  /** Quiet helper line under the control; an error takes its place. */
  hint?: string
  action?: ReactNode
  children: ReactNode
}

function DebtField({ label, htmlFor, error, optional, hint, action, children }: DebtFieldProps) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="mb-2 flex min-h-[18px] items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="t-body-sm leading-[1.4] text-ink2">
          {label}
          {optional ? <span className="text-ink3"> · {t('debts.form.optional')}</span> : null}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 t-caption text-alert-ink">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 t-caption text-ink3">{hint}</p>
      ) : null}
    </div>
  )
}

/**
 * Each step asks one question, and the heading is the whole of it — a sub-line
 * restating the question in other words is copy the reader has to read twice to
 * learn nothing.
 */
function StepHeading({ title }: { title: string }) {
  return <h2 className="t-title">{title}</h2>
}

/**
 * A short, fixed set of options picked in place. A Select would hide three or
 * four one-word choices behind a tap and give no sense of what the alternatives
 * are; chips wrap, so a long Vietnamese label never truncates.
 *
 * Takes the Button foundation as it comes — h-11, `rounded-control`, no stroke
 * and no shadow: the selected chip is an ink fill, the rest a sunk `wash` fill,
 * because a border is not how this system marks a control.
 */
function ChoiceChips<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-11 rounded-control bg-wash px-4 t-body-sm text-ink2 transition-colors hover:bg-committed',
            value === option.value && 'bg-action text-action-inverse hover:bg-ink2',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function MoneyControl({
  id,
  value,
  placeholder = '0',
  error,
  onChange,
  onBlur,
}: {
  id: string
  value: string
  placeholder?: string
  error?: string
  onChange: (value: string) => void
  onBlur?: () => void
}) {
  return (
    <div className={cn(controlClass, error && 'border-alert-ink')}>
      <EventMoneyInput
        id={id}
        className="h-full tracking-normal"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <span className="shrink-0 font-mono t-caption text-ink3">đ</span>
    </div>
  )
}

type DebtFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  control: Control<DebtForm>
  register: UseFormRegister<DebtForm>
  errors: FieldErrors<DebtForm>
  isValid: boolean
  isSavingDebt: boolean
  setValue: UseFormSetValue<DebtForm>
  trigger: UseFormTrigger<DebtForm>
  selectedLenderType: LenderType
  showMoreDetails: boolean
  setShowMoreDetails: (updater: (value: boolean) => boolean) => void
  receiveAssetOptions: Option[]
  memberOptions: Option[]
  termMonths: number | null
  /** RHF's handleSubmit(): needs the form event to call preventDefault(). */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pasteAmountFromClipboard: () => void
}

export function DebtFormDialog({
  open,
  onOpenChange,
  editingId,
  control,
  register,
  errors,
  isValid,
  isSavingDebt,
  setValue,
  trigger,
  selectedLenderType,
  setShowMoreDetails,
  receiveAssetOptions,
  memberOptions,
  termMonths,
  onSubmit,
  pasteAmountFromClipboard,
}: DebtFormDialogProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(1)
  // The furthest step reached, so the rail can offer a jump back to anything
  // already visited without letting the user skip ahead past validation.
  const [furthestStep, setFurthestStep] = useState<Step>(1)
  /**
   * Set only by a deliberate press of the Save button.
   *
   * `requestStep` awaits `trigger()`, so the step advances a microtask AFTER the
   * click handler returns, and the footer's action button is replaced by the
   * submit button in that same commit. The interaction still in flight (a held
   * Enter, or the click the browser dispatches on mouseup) then lands on the new
   * button and saves the debt straight from the review step. Requiring this flag
   * makes saving impossible except through the button itself: a submit event
   * that nobody armed is the race, and is dropped. A ref, not state — the submit
   * handler must read it in the same tick the click sets it.
   */
  const saveArmed = useRef(false)
  // Once the user types their own outstanding balance it stops following the
  // borrowed amount. Editing an existing debt starts untouched too — its saved
  // balance is already in the form, so nothing overwrites it.
  const [outstandingTouched, setOutstandingTouched] = useState(false)
  // An existing debt already has a real balance that has drifted from the
  // borrowed amount through repayments — never let mirroring overwrite it.
  const mirrorOutstanding = !outstandingTouched && !editingId
  const { fields: interestFields, append: appendInterest, remove: removeInterest } = useFieldArray({
    control,
    name: 'interestPeriods',
  })

  const hasInterest = useWatch({ control, name: 'hasInterest' })
  const borrowedAt = useWatch({ control, name: 'borrowedAt' })
  const firstPaymentDate = useWatch({ control, name: 'firstPaymentDate' })
  const expectedFinalDueDate = useWatch({ control, name: 'expectedFinalDueDate' })
  const watchedPeriods = useWatch({ control, name: 'interestPeriods' })
  const name = useWatch({ control, name: 'name' })
  const lenderName = useWatch({ control, name: 'lenderName' })
  const originalAmount = useWatch({ control, name: 'originalAmount' })
  const outstandingAmount = useWatch({ control, name: 'outstandingAmount' })
  const paymentFrequency = useWatch({ control, name: 'paymentFrequency' })
  const fixedPaymentAmount = useWatch({ control, name: 'fixedPaymentAmount' })
  const receivedToAssetId = useWatch({ control, name: 'receivedToAssetId' })
  const ownerMemberId = useWatch({ control, name: 'ownerMemberId' })
  const interestCalc = useWatch({ control, name: 'interestCalc' })

  const earlierStagesMonths = (watchedPeriods ?? []).slice(0, -1).reduce((sum, period) => {
    const months = Number(String(period?.months ?? '').replace(',', '.'))
    return sum + (Number.isFinite(months) && months > 0 ? months : 0)
  }, 0)
  const lastStageMonths = termMonths != null ? Math.max(0, termMonths - earlierStagesMonths) : null
  const interestIsOptional = !isFixedScheduleLender(selectedLenderType)
  const receivedAssetName = receiveAssetOptions.find((option) => option.value === receivedToAssetId)?.label
  const ownerName = memberOptions.find((option) => option.value === ownerMemberId)?.label

  function goToStep(nextStep: Step) {
    setStep(nextStep)
    setFurthestStep((reached) => (nextStep > reached ? nextStep : reached))
    setShowMoreDetails(() => nextStep > 1)
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
    if (!nextOpen) {
      goToStep(1)
      setFurthestStep(1)
      setOutstandingTouched(false)
    }
    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Steps 1-5 are not a submit. Pressing Enter in any input triggers the
    // browser's implicit submission, and advancing to the review step swaps the
    // footer button under an in-flight click/keypress — both would otherwise
    // save from the middle of the wizard. This check is the single authority on
    // whether a submit is legitimate: the step must ALREADY be the last one when
    // the event arrives, so an event that raced the transition is swallowed and
    // turned into an advance instead.
    if (step < LAST_STEP) {
      event.preventDefault()
      void requestStep((step + 1) as Step)
      return
    }
    // A submit nobody armed is the race described on `saveArmed`, not an
    // intention: the user has not read the review yet, let alone pressed Save.
    if (!saveArmed.current) {
      event.preventDefault()
      return
    }
    saveArmed.current = false
    // `onSubmit` is RHF's handleSubmit(), which calls preventDefault() itself —
    // but only when it receives the event. Forward it, or the browser performs a
    // native submit and reloads the page.
    //
    // The step is NOT reset here. Resetting it ran synchronously, before the
    // save resolved, so the form snapped back to step 1 while still open and a
    // failed save left the user on the wrong step with the error out of sight.
    // Closing the dialog resets it (`handleOpenChange`), which is the only
    // moment the wizard is really finished with.
    onSubmit(event)
  }

  /**
   * A bank/institution loan is a fixed-schedule debt: a rate is required, so
   * interest is not a choice there. Switching the lender type to a bank after
   * turning interest off would otherwise leave the form in a state validation
   * rejects with the switch no longer on screen to fix it.
   */
  useEffect(() => {
    if (!interestIsOptional && !hasInterest) {
      setValue('hasInterest', true, { shouldDirty: true, shouldValidate: true })
    }
  }, [interestIsOptional, hasInterest, setValue])

  /**
   * The day the final payment lands on. It follows the first repayment — the
   * payoff month is picked, its day is never asked for twice. Before a first
   * payment date exists we anchor on the borrow date, the only other date we
   * have.
   */
  const dueAnchor = firstPaymentDate || borrowedAt

  /**
   * The final due date is chosen as a month; the day it lands on is the day the
   * repayments land on. Re-anchor it whenever that day moves, so changing the
   * first payment date after picking a month does not leave the two out of step.
   */
  useEffect(() => {
    if (!expectedFinalDueDate || !dueAnchor) return
    const merged = withDayOfMonth(expectedFinalDueDate, dueAnchor)
    if (merged && merged !== expectedFinalDueDate) {
      setValue('expectedFinalDueDate', merged, { shouldValidate: true })
    }
  }, [expectedFinalDueDate, dueAnchor, setValue])

  function updateOutstanding(value: string) {
    setOutstandingTouched(true)
    setValue('outstandingAmount', value, { shouldDirty: true, shouldValidate: true })
  }

  /**
   * The borrowed amount is the field the user must fill. While the outstanding
   * balance is still untouched it tracks this value, so a loan nobody has repaid
   * yet needs one number instead of the same number twice. Once the user edits
   * the balance themselves, it stops mirroring.
   */
  function updateOriginalAmount(value: string) {
    setValue('originalAmount', value, { shouldDirty: true, shouldValidate: true })
    if (mirrorOutstanding) {
      setValue('outstandingAmount', value, { shouldDirty: true, shouldValidate: true })
    }
  }

  /**
   * One line per rail row, so the sidebar doubles as the running summary of
   * what has been answered so far. Falls back to a placeholder rather than an
   * empty row, which would read as a rendering bug.
   */
  function railSummary(target: Step): string {
    const empty = t('debts.form.rail.empty')
    if (target === 1) {
      return [name, lenderName].filter(Boolean).join(' · ') || empty
    }
    if (target === 2) {
      return originalAmount ? formatVnd(outstandingAmount || originalAmount) : empty
    }
    if (target === 3) {
      return [ownerName, receivedAssetName].filter(Boolean).join(' · ') || empty
    }
    if (target === 4) {
      const frequency = t(`debts.form.frequency.${paymentFrequency ?? 'none'}`)
      return firstPaymentDate ? `${frequency} · ${firstPaymentDate}` : frequency
    }
    if (target === 5) {
      const rate = hasInterest ? `${watchedPeriods?.[0]?.ratePct || '—'}%` : t('debts.form.review.noInterest')
      return fixedPaymentAmount ? `${rate} · ${formatVnd(fixedPaymentAmount)}` : rate
    }
    return t('debts.form.rail.reviewAll')
  }

  function toggleReceiveEvent(enabled: boolean) {
    setValue('receivedToAssetId', enabled ? (receiveAssetOptions[0]?.value ?? '') : '', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      {/* The height is FIXED on desktop, not fitted to each step. A centred
          dialog that resizes between steps moves its own footer and re-centres
          itself under the cursor on every Continue — the step content scrolls
          inside instead. The mobile sheet is anchored to the bottom edge, so it
          keeps growing to fit. The height is pinned from `md`, which is where
          ResponsiveDialog switches from Sheet to Dialog (useIsDesktop), not
          from `lg` where the rail appears — between the two it is still a
          centred dialog that would otherwise jump. */}
      <ResponsiveDialogContent className="grid max-h-[92dvh] gap-0 overflow-hidden p-0 md:h-[min(680px,92dvh)] sm:max-w-[920px] lg:grid-cols-[250px_1fr]">
        <aside className="hidden min-h-0 flex-col overflow-y-auto border-r border-divider bg-canvas p-5 lg:flex">
          <ResponsiveDialogTitle className="mt-1 t-subtitle">
            {editingId ? t('debts.form.editTitle') : t('debts.form.createTitle')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            {t('debts.form.description')}
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
                    <span className="t-caption text-ink3">{t(`debts.form.steps.${item.key}`)}</span>
                    <RailStatus step={item.step} current={step} done={item.step < furthestStep} />
                  </div>
                  <p className="mt-1 truncate t-body-sm">{railSummary(item.step)}</p>
                </button>
              )
            })}
          </div>
        </aside>

        {/* `max-h-[inherit]` is what makes the inner `1fr` row scroll. The grid
            parent caps itself at 92dvh, but a grid ROW is `auto` by default, so
            without this the form grew to its content, overflowed the cap and was
            simply clipped by `overflow-hidden` — the scroll region never got
            squeezed, so on a narrow screen (a Sheet, no fixed height) a long list
            of wallets could not be reached. */}
        <form
          className="grid max-h-[inherit] min-h-0 grid-rows-[auto_1fr_auto]"
          onSubmit={handleSubmit}
          noValidate
        >
          <ResponsiveDialogHeader className="px-5 pb-2 pt-5 pr-16 text-left sm:px-8 sm:pt-7 sm:pr-16">
            <p className="t-body-sm text-ink3">
              {t('debts.form.rail.stepOf', { step, total: LAST_STEP })}
            </p>
            {/* The rail carries the dialog title on wide screens; the narrow
                layout drops the rail, so the title is restated here. */}
            <ResponsiveDialogTitle className="mt-1 t-subhead font-medium tracking-[-0.015em] lg:hidden">
              {editingId ? t('debts.form.editTitle') : t('debts.form.createTitle')}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-4 sm:px-8">
            {step === 1 ? (
              <div className="space-y-5">
                <StepHeading title={t('debts.form.sections.debt')} />

                <div className="grid gap-4">
                  <DebtField label={t('debts.form.fields.name')} htmlFor="debt-name" error={errors.name?.message}>
                    <div className={cn(controlClass, errors.name && 'border-alert-ink')}>
                      <input id="debt-name" className={inputClass} placeholder={t('debts.form.fields.namePlaceholder')} {...register('name')} />
                    </div>
                  </DebtField>
                  <DebtField label={t('debts.form.fields.lender')} htmlFor="debt-lender" error={errors.lenderName?.message}>
                    <div className={cn(controlClass, errors.lenderName && 'border-alert-ink')}>
                      <input id="debt-lender" className={inputClass} placeholder={t('debts.form.fields.lenderPlaceholder')} {...register('lenderName')} />
                    </div>
                  </DebtField>
                </div>
                <div className="grid gap-4">
                  <DebtField label={t('debts.form.fields.lenderType')}>
                    <Controller control={control} name="lenderType" render={({ field }) => (
                      <ChoiceChips
                        label={t('debts.form.fields.lenderType')}
                        value={field.value}
                        onChange={field.onChange}
                        options={LENDER_TYPES.map((value) => ({
                          value,
                          label: t(`debts.form.lenderType.${value}`),
                        }))}
                      />
                    )} />
                  </DebtField>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <StepHeading title={t('debts.form.sections.amount')} />

                <div className="grid gap-4">
                  <DebtField
                    label={t('debts.form.fields.originalAmount')}
                    htmlFor="debt-original"
                    error={errors.originalAmount?.message}
                    action={<button type="button" onClick={pasteAmountFromClipboard} className="t-caption font-medium text-action">{t('debts.form.pasteAmount')}</button>}
                  >
                    <Controller control={control} name="originalAmount" render={({ field }) => (
                      <MoneyControl id="debt-original" value={field.value} error={errors.originalAmount?.message} onChange={updateOriginalAmount} onBlur={field.onBlur} />
                    )} />
                  </DebtField>
                  <DebtField
                    label={t('debts.form.fields.outstanding')}
                    htmlFor="debt-outstanding"
                    optional
                    error={errors.outstandingAmount?.message}
                    hint={t('debts.form.fields.outstandingHint')}
                  >
                    <Controller control={control} name="outstandingAmount" render={({ field }) => (
                      <MoneyControl id="debt-outstanding" value={field.value} error={errors.outstandingAmount?.message} onChange={updateOutstanding} onBlur={field.onBlur} />
                    )} />
                  </DebtField>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <StepHeading title={t('debts.form.sections.received')} />

                <div className="grid gap-4">
                  <DebtField label={t('debts.form.fields.owner')}>
                    <div className={controlClass}>
                      <Controller control={control} name="ownerMemberId" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={selectClass}><SelectValue placeholder={t('debts.form.fields.ownerPlaceholder')} /></SelectTrigger>
                          <SelectContent>{memberOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                        </Select>
                      )} />
                    </div>
                  </DebtField>
                  <DebtField label={t('debts.form.fields.borrowedAt')} error={errors.borrowedAt?.message}>
                    <div className={cn(controlClass, errors.borrowedAt && 'border-alert-ink')}>
                      <Controller control={control} name="borrowedAt" render={({ field }) => (
                        <DatePicker value={field.value} onChange={field.onChange} aria-invalid={Boolean(errors.borrowedAt)} className="h-full rounded-none border-0 bg-transparent p-0 font-mono t-body shadow-none hover:bg-transparent [&_svg]:hidden" />
                      )} />
                    </div>
                  </DebtField>
                </div>

                <div className="rounded-control bg-wash p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="t-body-sm font-medium">{t('debts.form.fields.received')}</p>
                    <Switch checked={Boolean(receivedToAssetId)} onCheckedChange={toggleReceiveEvent} />
                  </div>
                  {receivedToAssetId ? (
                    <div className="mt-4">
                      <DebtField label={t('debts.form.fields.receivedDestination')}>
                        <div className={cn(controlClass, 'bg-card')}>
                          <Controller control={control} name="receivedToAssetId" render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className={selectClass}><SelectValue placeholder={t('debts.form.fields.receivedPlaceholder')} /></SelectTrigger>
                              <SelectContent>{receiveAssetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                          )} />
                        </div>
                      </DebtField>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <StepHeading title={t('debts.form.sections.schedule')} />

                <div className="grid gap-4">
                  <DebtField label={t('debts.form.fields.frequency')}>
                    <Controller control={control} name="paymentFrequency" render={({ field }) => (
                      <ChoiceChips
                        label={t('debts.form.fields.frequency')}
                        value={field.value}
                        onChange={field.onChange}
                        options={PAYMENT_FREQUENCIES.map((value) => ({
                          value,
                          label: t(`debts.form.frequency.${value}`),
                        }))}
                      />
                    )} />
                  </DebtField>
                  <DebtField label={t('debts.form.fields.firstPaymentDate')} error={errors.firstPaymentDate?.message}>
                    <>
                      <div className={cn(controlClass, errors.firstPaymentDate && 'border-alert-ink')}>
                        <Controller control={control} name="firstPaymentDate" render={({ field }) => (
                          <DatePicker value={field.value} onChange={field.onChange} aria-invalid={Boolean(errors.firstPaymentDate)} className="h-full rounded-none border-0 bg-transparent p-0 font-mono t-body shadow-none hover:bg-transparent [&_svg]:hidden" />
                        )} />
                      </div>
                      <p className="mt-1.5 t-caption leading-5 text-ink3">
                        {t('debts.form.fields.firstPaymentDateHelp')}
                      </p>
                    </>
                  </DebtField>
                </div>

                <DebtField label={t('debts.form.fields.finalDueDate')} error={errors.expectedFinalDueDate?.message}>
                  <div className={cn(controlClass, errors.expectedFinalDueDate && 'border-alert-ink')}>
                    <Controller control={control} name="expectedFinalDueDate" render={({ field }) => (
                      <MonthPicker value={toMonthStartIso(field.value)} onChange={(month) => field.onChange(withDayOfMonth(month, dueAnchor))} aria-invalid={Boolean(errors.expectedFinalDueDate)} className="h-full rounded-none border-0 bg-transparent p-0 font-mono t-body shadow-none hover:bg-transparent [&_svg]:hidden" />
                    )} />
                  </div>
                </DebtField>

                {paymentFrequency !== 'none' ? (
                  <DebtField
                    label={t('debts.form.fields.repaymentAsset')}
                    optional
                    hint={t('debts.form.fields.repaymentAssetHint')}
                  >
                    <div className={controlClass}>
                      <Controller control={control} name="repaymentAssetId" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={selectClass}><SelectValue placeholder={t('debts.form.fields.repaymentAssetPlaceholder')} /></SelectTrigger>
                          <SelectContent>{receiveAssetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                        </Select>
                      )} />
                    </div>
                  </DebtField>
                ) : null}
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-5">
                <StepHeading title={t('debts.form.sections.interest')} />

                {!interestIsOptional ? (
                  <p className="rounded-control bg-attention-tint px-4 py-3 t-body-sm leading-5 text-ink2">
                    {t('debts.form.bankRequirement')}
                  </p>
                ) : null}

                <div className="rounded-control bg-wash p-4">
                  {/* No switch for a bank loan: the rules REQUIRE a rate (see
                      memory/debts.md), so offering a choice that validation then
                      refuses is a question with one answer. The requirement note
                      above already says why, and the effect on
                      `interestIsOptional` keeps the stored value honest. */}
                  {interestIsOptional ? (
                    <div className="flex items-center justify-between gap-4">
                      <p className="t-body-sm font-medium">{t('debts.form.fields.hasInterest')}</p>
                      <Controller control={control} name="hasInterest" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                    </div>
                  ) : null}

                  {hasInterest ? (
                    <div className="mt-4 space-y-4">
                      <InterestPeriods fields={interestFields} register={register} lastStageMonths={lastStageMonths} onAppend={() => appendInterest({ ratePct: '', months: '' })} onRemove={removeInterest} error={errors.interestPeriods?.message} />

                      <DebtField label={t('debts.form.fields.interestCalc')}>
                        {/* Selected is a sunk fill, not a stroke: per the Button
                            rule a border is not how this system marks a control.
                            The hint tracks the label's colour so it stays legible
                            once the tile is filled. */}
                        <Controller control={control} name="interestCalc" render={({ field }) => (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {CALC_OPTIONS.map((option) => {
                              const active = field.value === option.value
                              return (
                                <button key={option.value} type="button" aria-pressed={active} onClick={() => field.onChange(option.value)} className={cn('min-h-[58px] rounded-control bg-card px-4 py-2.5 text-left text-ink2 transition-colors', active && 'bg-action text-action-inverse')}>
                                  <span className="block t-body-sm font-medium">{t(`debts.form.calc.${option.labelKey}`)}</span>
                                  <span className={cn('mt-1 block t-caption leading-4', active ? 'opacity-80' : 'text-ink3')}>{t(`debts.form.calc.${option.hintKey}`)}</span>
                                </button>
                              )
                            })}
                          </div>
                        )} />
                      </DebtField>
                    </div>
                  ) : null}
                </div>

                {/* The payment is the answer this step exists to produce, so it
                    is set at the figure tier rather than in a normal field. It
                    still auto-fills from the live estimate until the user types
                    their own figure (`fixedPaymentTouched`), so the suggestion
                    arrives in the field itself rather than as a line of copy
                    restating it. */}
                <div className="border-t border-divider pt-5">
                  <DebtField label={t('debts.form.fields.paymentAmount')} htmlFor="debt-payment" error={errors.fixedPaymentAmount?.message}>
                    <div className="flex items-baseline gap-2">
                      <Controller control={control} name="fixedPaymentAmount" render={({ field }) => (
                        <EventMoneyInput
                          id="debt-payment"
                          className={cn('w-auto max-w-[260px]', errors.fixedPaymentAmount && 'text-alert-ink')}
                          placeholder={t('debts.form.fields.paymentPlaceholder')}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value)
                            setValue('fixedPaymentTouched', true, { shouldDirty: true })
                          }}
                          onBlur={field.onBlur}
                        />
                      )} />
                      <span className="shrink-0 font-mono t-body text-ink2">đ</span>
                    </div>
                  </DebtField>
                </div>

                <DebtField label={t('debts.form.fields.note')} htmlFor="debt-note" optional>
                  <textarea id="debt-note" rows={3} className="min-h-[92px] w-full resize-y rounded-control border border-committed bg-card px-4 py-3 t-body leading-6 text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink3 focus:border-data-primary focus:shadow-[0_0_0_3px_rgba(115,164,215,0.16)]" placeholder={t('debts.form.fields.notePlaceholder')} {...register('note')} />
                </DebtField>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-5">
                <StepHeading title={t(editingId ? 'debts.form.sections.reviewEdit' : 'debts.form.sections.reviewCreate')} />

                <div className="border-t border-divider pt-4">
                  <dl className="space-y-3 t-body-sm">
                    <SummaryRow label={t('debts.form.fields.name')} value={name || '—'} />
                    <SummaryRow label={t('debts.form.fields.lender')} value={lenderName || '—'} />
                    <SummaryRow label={t('debts.form.fields.outstanding')} value={formatVnd(outstandingAmount)} numeric />
                    <SummaryRow label={t('debts.form.fields.originalAmount')} value={formatVnd(originalAmount)} numeric />
                    <SummaryRow label={t('debts.form.fields.lenderType')} value={t(`debts.form.lenderType.${selectedLenderType}`)} />
                    <SummaryRow label={t('debts.form.fields.firstPaymentDate')} value={firstPaymentDate || '—'} mono />
                    <SummaryRow label={t('debts.form.fields.finalDueDate')} value={expectedFinalDueDate || '—'} mono />
                    <SummaryRow label={t('debts.form.fields.frequency')} value={t(`debts.form.frequency.${paymentFrequency ?? 'none'}`)} />
                    <SummaryRow label={t('debts.form.fields.paymentAmount')} value={formatVnd(fixedPaymentAmount)} numeric />
                    <SummaryRow label={t('debts.form.steps.interest')} value={hasInterest ? `${watchedPeriods?.[0]?.ratePct || '—'}% · ${t(`debts.form.calc.${CALC_OPTIONS.find((option) => option.value === interestCalc)?.labelKey ?? 'fixed'}`)}` : t('debts.form.review.noInterest')} />
                    <SummaryRow label={t('debts.form.fields.owner')} value={ownerName || t('debts.form.review.unassigned')} />
                    <SummaryRow label={t('debts.form.fields.receivedDestination')} value={receivedAssetName || t('debts.form.review.notRecorded')} />
                  </dl>
                </div>
                <div className="rounded-control bg-accent-soft px-4 py-3.5 t-body-sm leading-5 text-ink2">
                  {t('debts.form.review.notice')}
                </div>
              </div>
            ) : null}
          </div>

          <ResponsiveDialogFooter className="shrink-0 flex-row items-center justify-between px-5 pb-5 pt-3 sm:px-8 sm:pb-7">
            <div>
              {step > 1 ? (
                <Button type="button" variant="ghost" className="h-11 px-4" onClick={() => goToStep((step - 1) as Step)}>
                  ← {t('debts.form.actions.back')}
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5">
              {/* <Button type="button" variant="ghost" className="h-11 px-4" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button> */}
              {step < LAST_STEP ? (
                /*
                 * `key` forces React to MOUNT a new element when the step
                 * changes rather than reuse this one. `requestStep` awaits
                 * `trigger()`, so the step advances a microtask after the click
                 * handler returns: reusing the node let the freshly-rendered
                 * submit button inherit focus and the in-flight Enter keypress,
                 * which saved the debt straight from the review step. A distinct
                 * key means the old button unmounts and the keypress has nothing
                 * to land on.
                 */
                <Button key="advance" type="button" className="h-11 px-5" onClick={() => void requestStep((step + 1) as Step)}>
                  {t(step === LAST_STEP - 1 ? 'debts.form.actions.review' : 'debts.form.actions.continue')}
                </Button>
              ) : (
                <Button key="save" type="submit" className="h-11 px-5" disabled={!isValid || isSavingDebt} onClick={() => { saveArmed.current = true }}>
                  {isSavingDebt
                    ? t('debts.form.actions.saving')
                    : editingId
                      ? t('debts.form.actions.save')
                      : t('debts.form.actions.create')}
                </Button>
              )}
            </div>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
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

function SummaryRow({ label, value, numeric, mono }: { label: string; value: string; numeric?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink2">{label}</dt>
      <dd className={cn('text-right font-medium', numeric && 'num', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}

function InterestPeriods({
  fields,
  register,
  lastStageMonths,
  onAppend,
  onRemove,
  error,
}: {
  fields: Array<{ id: string }>
  register: UseFormRegister<DebtForm>
  lastStageMonths: number | null
  onAppend: () => void
  onRemove: (index: number) => void
  error?: string
}) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="t-body-sm text-ink2">{t('debts.form.fields.interestPeriods')}</p>
        <button type="button" onClick={onAppend} className="inline-flex items-center gap-1 t-body-sm font-medium text-action">
          <Plus className="size-4" /> {t('debts.form.interestPeriods.add')}
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {fields.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-control bg-card p-3 sm:grid-cols-[1fr_150px_auto]">
            <DebtField label={t('debts.form.fields.annualRate')}>
              <div className={controlClass}>
                <input inputMode="decimal" placeholder="8,2" className={cn(inputClass, 'num font-medium')} {...register(`interestPeriods.${index}.ratePct` as const)} />
                <span className="shrink-0 font-mono t-caption text-ink3">%</span>
              </div>
            </DebtField>
            <DebtField label={t('debts.form.fields.duration')}>
              {index === fields.length - 1 ? (
                <div className={cn(controlClass, 't-body-sm text-ink2')}>
                  {lastStageMonths != null
                    ? t('debts.form.interestPeriods.months', { count: lastStageMonths })
                    : t('debts.form.interestPeriods.unknownMonths')}
                </div>
              ) : (
                <div className={controlClass}>
                  <input inputMode="numeric" placeholder="12" className={cn(inputClass, 'num font-medium')} {...register(`interestPeriods.${index}.months` as const)} />
                  <span className="shrink-0 font-mono t-caption text-ink3">
                    {t('debts.form.interestPeriods.monthUnit')}
                  </span>
                </div>
              )}
            </DebtField>
            {fields.length > 1 ? (
              <button type="button" onClick={() => onRemove(index)} className="mt-6 grid size-11 place-items-center rounded-control text-alert-ink" aria-label={t('debts.form.interestPeriods.remove')}>
                <X className="size-4" />
              </button>
            ) : <span />}
          </div>
        ))}
      </div>
      {error ? <p className="mt-1.5 t-caption text-alert-ink">{error}</p> : null}
      <p className="mt-2 t-caption leading-5 text-ink3">{t('debts.form.interestPeriods.remainingHint')}</p>
    </div>
  )
}
