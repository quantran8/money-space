import { Plus, X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
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
import { addMonthsIso, type RepaymentEstimate } from '@money-space/core/features/debts/model/debts-interest'
import { isFixedScheduleLender, type LenderType } from '@money-space/core/features/debts/model/debts.types'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type Option = { value: string; label: string }
type Step = 1 | 2 | 3 | 4

const STEPS: Array<{ step: Step; key: string }> = [
  { step: 1, key: 'debt' },
  { step: 2, key: 'schedule' },
  { step: 3, key: 'interest' },
  { step: 4, key: 'review' },
]

/**
 * The fields each step is allowed to block on. Advancing past a step validates
 * only these, so a later step's missing value never traps the user on an earlier
 * one. Fields that are conditionally required (`expectedFinalDueDate` and
 * `interestPeriods` for bank loans, `firstPaymentDate` once a frequency is set)
 * are listed on the step whose UI actually renders their error.
 */
const STEP_FIELDS: Record<Step, Array<keyof DebtForm>> = {
  1: ['name', 'lenderName', 'originalAmount', 'outstandingAmount', 'borrowedAt'],
  2: ['paymentFrequency', 'firstPaymentDate', 'fixedPaymentAmount', 'expectedFinalDueDate'],
  3: ['interestPeriods'],
  4: [],
}

const DUE_DATE_PRESETS = [
  { key: 'sixMonths', months: 6 },
  { key: 'oneYear', months: 12 },
  { key: 'twoYears', months: 24 },
  { key: 'threeYears', months: 36 },
  { key: 'fiveYears', months: 60 },
]

const CALC_OPTIONS: Array<{ value: DebtForm['interestCalc']; labelKey: string; hintKey: string }> = [
  { value: 'reducing', labelKey: 'reducing', hintKey: 'reducingHint' },
  { value: 'fixed', labelKey: 'fixed', hintKey: 'fixedHint' },
]

function formatVnd(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value
  if (!amount || !Number.isFinite(amount)) return '—'
  return formatMoney(amount)
}

const controlClass =
  'flex h-[46px] w-full items-center gap-2 rounded-[10px] border border-transparent bg-wash px-3.5 transition-colors focus-within:border-action focus-within:bg-card'
const inputClass =
  'h-full min-w-0 w-full bg-transparent text-[16px] leading-none text-ink outline-none placeholder:text-ink3'
const selectClass =
  'h-full rounded-none bg-transparent p-0 text-[16px] font-normal text-ink data-[placeholder]:text-ink3'

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
      <div className="mb-[7px] flex min-h-[18px] items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-normal leading-[1.4] text-ink2">
          {label}
          {optional ? <span className="text-ink3"> · {t('debts.form.optional')}</span> : null}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] leading-[1.45] text-alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] leading-[1.45] text-ink3">{hint}</p>
      ) : null}
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
    <div className={cn(controlClass, error && 'border-alert')}>
      <EventMoneyInput
        id={id}
        className="h-full text-[16px] font-medium tracking-normal sm:text-[16px]"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <span className="shrink-0 font-mono text-[12px] text-ink3">đ</span>
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
  repaymentEstimate: RepaymentEstimate | null
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
  repaymentEstimate,
  termMonths,
  onSubmit,
  pasteAmountFromClipboard,
}: DebtFormDialogProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(1)
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
  const receivedAssetName = receiveAssetOptions.find((option) => option.value === receivedToAssetId)?.label
  const ownerName = memberOptions.find((option) => option.value === ownerMemberId)?.label

  function goToStep(nextStep: Step) {
    setStep(nextStep)
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
      setOutstandingTouched(false)
    }
    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Steps 1-3 are not a submit. Pressing Enter in any input triggers the
    // browser's implicit submission, which would otherwise save (or, when the
    // form was valid, bounce the user back to step 1). Swallow it and advance
    // instead, which is what Enter should mean mid-wizard.
    if (step < 4) {
      event.preventDefault()
      void requestStep((step + 1) as Step)
      return
    }
    // `onSubmit` is RHF's handleSubmit(), which calls preventDefault() itself —
    // but only when it receives the event. Forward it, or the browser performs a
    // native submit and reloads the page.
    if (isValid) goToStep(1)
    onSubmit(event)
  }

  /**
   * The preset chips are a loan term, so they count from the first repayment —
   * "1 năm" means a year of payments, not a year from the day the money landed.
   * Before a first payment date is picked we anchor on the borrow date, which is
   * the only other date we have.
   */
  const dueAnchor = firstPaymentDate || borrowedAt

  function applyDuePreset(months: number) {
    if (!dueAnchor) return
    setValue('expectedFinalDueDate', addMonthsIso(dueAnchor, months), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

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

  function toggleReceiveEvent(enabled: boolean) {
    setValue('receivedToAssetId', enabled ? (receiveAssetOptions[0]?.value ?? '') : '', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[92dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[900px]">
        <ResponsiveDialogHeader className="px-5 pb-4 pt-5 pr-16 text-left sm:px-8 sm:pt-7 sm:pr-16">
          <ResponsiveDialogTitle className="text-[19px] font-medium tracking-[-0.015em]">
            {editingId ? t('debts.form.editTitle') : t('debts.form.createTitle')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            {t('debts.form.description')}
          </ResponsiveDialogDescription>

          <div className="mt-4 grid grid-cols-2 gap-2 px-1 sm:grid-cols-4">
            {STEPS.map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => void requestStep(item.step)}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-control px-2 text-left text-[13px] text-ink3',
                  step === item.step && 'font-medium text-ink',
                )}
              >
                <span
                  className={cn(
                    'size-[7px] shrink-0 rounded-full bg-[#D2D6DA]',
                    step === item.step && 'bg-action',
                  )}
                />
                <span>{item.step}. {t(`debts.form.steps.${item.key}`)}</span>
              </button>
            ))}
          </div>
        </ResponsiveDialogHeader>

        <form className="grid min-h-0 grid-rows-[1fr_auto]" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 overflow-y-auto px-5 pb-5 sm:px-8">
            {step === 1 ? (
              <div className="space-y-5">
                <h2 className="text-[16px] font-medium">{t('debts.form.sections.debt')}</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DebtField label={t('debts.form.fields.name')} htmlFor="debt-name" error={errors.name?.message}>
                    <div className={cn(controlClass, errors.name && 'border-alert')}>
                      <input id="debt-name" className={inputClass} placeholder={t('debts.form.fields.namePlaceholder')} {...register('name')} />
                    </div>
                  </DebtField>
                  <DebtField label={t('debts.form.fields.lender')} htmlFor="debt-lender" error={errors.lenderName?.message}>
                    <div className={cn(controlClass, errors.lenderName && 'border-alert')}>
                      <input id="debt-lender" className={inputClass} placeholder={t('debts.form.fields.lenderPlaceholder')} {...register('lenderName')} />
                    </div>
                  </DebtField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DebtField
                    label={t('debts.form.fields.originalAmount')}
                    htmlFor="debt-original"
                    error={errors.originalAmount?.message}
                    action={<button type="button" onClick={pasteAmountFromClipboard} className="text-[12px] font-medium text-action">{t('debts.form.pasteAmount')}</button>}
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

                <div className="grid gap-4 sm:grid-cols-3">
                  <DebtField label={t('debts.form.fields.lenderType')}>
                    <div className={controlClass}>
                      <Controller control={control} name="lenderType" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_institution">{t('debts.form.lenderType.bank_institution')}</SelectItem>
                            <SelectItem value="relative">{t('debts.form.lenderType.relative')}</SelectItem>
                            <SelectItem value="other">{t('debts.form.lenderType.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  </DebtField>
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
                    <div className={cn(controlClass, errors.borrowedAt && 'border-alert')}>
                      <Controller control={control} name="borrowedAt" render={({ field }) => (
                        <DatePicker value={field.value} onChange={field.onChange} aria-invalid={Boolean(errors.borrowedAt)} className="h-full rounded-none bg-transparent p-0 font-mono text-[16px] font-normal hover:bg-transparent [&_svg]:hidden" />
                      )} />
                    </div>
                  </DebtField>
                </div>

                <div className="rounded-[10px] bg-wash p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[13px] font-medium">{t('debts.form.fields.received')}</p>
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

            {step === 2 ? (
              <div className="space-y-5">
                <h2 className="text-[16px] font-medium">{t('debts.form.sections.schedule')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DebtField label={t('debts.form.fields.frequency')}>
                    <div className={controlClass}>
                      <Controller control={control} name="paymentFrequency" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">{t('debts.form.frequency.monthly')}</SelectItem>
                            <SelectItem value="quarterly">{t('debts.form.frequency.quarterly')}</SelectItem>
                            <SelectItem value="yearly">{t('debts.form.frequency.yearly')}</SelectItem>
                            <SelectItem value="none">{t('debts.form.frequency.none')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  </DebtField>
                  <DebtField label={t('debts.form.fields.firstPaymentDate')} error={errors.firstPaymentDate?.message}>
                    <>
                      <div className={cn(controlClass, errors.firstPaymentDate && 'border-alert')}>
                        <Controller control={control} name="firstPaymentDate" render={({ field }) => (
                          <DatePicker value={field.value} onChange={field.onChange} aria-invalid={Boolean(errors.firstPaymentDate)} className="h-full rounded-none bg-transparent p-0 font-mono text-[16px] font-normal hover:bg-transparent [&_svg]:hidden" />
                        )} />
                      </div>
                      <p className="mt-1.5 text-[12px] leading-5 text-ink3">
                        {t('debts.form.fields.firstPaymentDateHelp')}
                      </p>
                    </>
                  </DebtField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DebtField label={t('debts.form.fields.paymentAmount')} htmlFor="debt-payment" error={errors.fixedPaymentAmount?.message}>
                    <Controller control={control} name="fixedPaymentAmount" render={({ field }) => (
                      <MoneyControl
                        id="debt-payment"
                        value={field.value}
                        placeholder={t('debts.form.fields.paymentPlaceholder')}
                        error={errors.fixedPaymentAmount?.message}
                        onChange={(value) => {
                          field.onChange(value)
                          setValue('fixedPaymentTouched', true, { shouldDirty: true })
                        }}
                        onBlur={field.onBlur}
                      />
                    )} />
                  </DebtField>
                  <DebtField label={t('debts.form.fields.finalDueDate')} error={errors.expectedFinalDueDate?.message}>
                    <div className={cn(controlClass, errors.expectedFinalDueDate && 'border-alert')}>
                      <Controller control={control} name="expectedFinalDueDate" render={({ field }) => (
                        <DatePicker value={field.value} onChange={field.onChange} aria-invalid={Boolean(errors.expectedFinalDueDate)} className="h-full rounded-none bg-transparent p-0 font-mono text-[16px] font-normal hover:bg-transparent [&_svg]:hidden" />
                      )} />
                    </div>
                  </DebtField>
                </div>

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

                <div className="flex flex-wrap gap-1.5">
                  {DUE_DATE_PRESETS.map((preset) => {
                    const active = Boolean(dueAnchor) && expectedFinalDueDate === addMonthsIso(dueAnchor, preset.months)
                    return (
                      <button key={preset.months} type="button" disabled={!dueAnchor} onClick={() => applyDuePreset(preset.months)} className={cn('rounded-full bg-wash px-3 py-1.5 text-[12px] font-medium text-ink2 transition disabled:opacity-40', active && 'bg-action text-white')}>
                        {t(`debts.form.presets.${preset.key}`)}
                      </button>
                    )
                  })}
                </div>

                <div className="rounded-[10px] bg-accent-soft px-4 py-3.5 text-[13px] leading-5 text-ink2">
                  {repaymentEstimate ? (
                    <div className="flex items-center justify-between gap-4">
                      <p>
                        {t(
                          termMonths
                            ? 'debts.form.schedule.suggestionWithTerm'
                            : 'debts.form.schedule.suggestion',
                          {
                            amount: formatMoney(repaymentEstimate.perPayment),
                            installments: repaymentEstimate.installments,
                            months: termMonths,
                          },
                        )}
                      </p>
                      <button type="button" onClick={() => {
                        setValue('fixedPaymentAmount', String(repaymentEstimate.perPayment), { shouldValidate: true })
                        setValue('fixedPaymentTouched', false, { shouldDirty: true })
                      }} className="shrink-0 text-[13px] font-medium text-action">{t('debts.form.schedule.use')}</button>
                    </div>
                  ) : (
                    <p>{t('debts.form.schedule.empty')}</p>
                  )}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <h2 className="text-[16px] font-medium">{t('debts.form.sections.interest')}</h2>

                {isFixedScheduleLender(selectedLenderType) ? (
                  <p className="rounded-[10px] bg-attention-tint px-4 py-3 text-[13px] leading-5 text-ink2">
                    {t('debts.form.bankRequirement')}
                  </p>
                ) : null}

                <div className="rounded-[10px] bg-wash p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[13px] font-medium">{t('debts.form.fields.hasInterest')}</p>
                    <Controller control={control} name="hasInterest" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                  </div>

                  {hasInterest ? (
                    <div className="mt-4 space-y-4">
                      <InterestPeriods fields={interestFields} register={register} lastStageMonths={lastStageMonths} onAppend={() => appendInterest({ ratePct: '', months: '' })} onRemove={removeInterest} error={errors.interestPeriods?.message} />

                      <DebtField label={t('debts.form.fields.interestCalc')}>
                        <Controller control={control} name="interestCalc" render={({ field }) => (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {CALC_OPTIONS.map((option) => (
                              <button key={option.value} type="button" aria-pressed={field.value === option.value} onClick={() => field.onChange(option.value)} className={cn('min-h-[58px] rounded-[10px] border border-transparent bg-card px-3.5 py-2.5 text-left text-ink2', field.value === option.value && 'border-action text-ink')}>
                                <span className="block text-[13px] font-medium">{t(`debts.form.calc.${option.labelKey}`)}</span>
                                <span className="mt-1 block text-[12px] leading-4 text-ink3">{t(`debts.form.calc.${option.hintKey}`)}</span>
                              </button>
                            ))}
                          </div>
                        )} />
                      </DebtField>
                    </div>
                  ) : null}
                </div>

                <DebtField label={t('debts.form.fields.note')} htmlFor="debt-note" optional>
                  <textarea id="debt-note" rows={3} className="min-h-[92px] w-full resize-y rounded-[10px] border border-transparent bg-wash px-3.5 py-[11px] text-[16px] leading-6 text-ink outline-none transition-colors placeholder:text-ink3 focus:border-action focus:bg-card" placeholder={t('debts.form.fields.notePlaceholder')} {...register('note')} />
                </DebtField>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <h2 className="text-[16px] font-medium">{t(editingId ? 'debts.form.sections.reviewEdit' : 'debts.form.sections.reviewCreate')}</h2>
                <div className="rounded-[10px] bg-wash p-4">
                  <dl className="space-y-3 text-[13px]">
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
                <div className="rounded-[10px] bg-accent-soft px-4 py-3.5 text-[13px] leading-5 text-ink2">
                  {t('debts.form.review.notice')}
                </div>
              </div>
            ) : null}
          </div>

          <ResponsiveDialogFooter className="shrink-0 flex-row items-center justify-between px-5 pb-5 pt-3 sm:px-8 sm:pb-7">
            <div>
              {step > 1 ? (
                <Button type="button" variant="ghost" className="h-11 px-4 text-[13px]" onClick={() => goToStep((step - 1) as Step)}>
                  ← {t('debts.form.actions.back')}
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="ghost" className="h-11 px-4 text-[13px]" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
              {step < 4 ? (
                <Button type="button" className="h-11 px-5 text-[13px]" onClick={() => void requestStep((step + 1) as Step)}>
                  {t(step === 3 ? 'debts.form.actions.review' : 'debts.form.actions.continue')}
                </Button>
              ) : (
                <Button type="submit" className="h-11 px-5 text-[13px]" disabled={!isValid || isSavingDebt}>
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
        <p className="text-[13px] text-ink2">{t('debts.form.fields.interestPeriods')}</p>
        <button type="button" onClick={onAppend} className="inline-flex items-center gap-1 text-[13px] font-medium text-action">
          <Plus className="size-4" /> {t('debts.form.interestPeriods.add')}
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {fields.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-[10px] bg-card p-3 sm:grid-cols-[1fr_150px_auto]">
            <DebtField label={t('debts.form.fields.annualRate')}>
              <div className={controlClass}>
                <input inputMode="decimal" placeholder="8,2" className={cn(inputClass, 'num font-medium')} {...register(`interestPeriods.${index}.ratePct` as const)} />
                <span className="shrink-0 font-mono text-[12px] text-ink3">%</span>
              </div>
            </DebtField>
            <DebtField label={t('debts.form.fields.duration')}>
              {index === fields.length - 1 ? (
                <div className={cn(controlClass, 'text-[14px] text-ink2')}>
                  {lastStageMonths != null
                    ? t('debts.form.interestPeriods.months', { count: lastStageMonths })
                    : t('debts.form.interestPeriods.unknownMonths')}
                </div>
              ) : (
                <div className={controlClass}>
                  <input inputMode="numeric" placeholder="12" className={cn(inputClass, 'num font-medium')} {...register(`interestPeriods.${index}.months` as const)} />
                  <span className="shrink-0 font-mono text-[12px] text-ink3">
                    {t('debts.form.interestPeriods.monthUnit')}
                  </span>
                </div>
              )}
            </DebtField>
            {fields.length > 1 ? (
              <button type="button" onClick={() => onRemove(index)} className="mt-[25px] grid size-11 place-items-center rounded-control text-alert" aria-label={t('debts.form.interestPeriods.remove')}>
                <X className="size-4" />
              </button>
            ) : <span />}
          </div>
        ))}
      </div>
      {error ? <p className="mt-1.5 text-[12px] leading-[1.45] text-alert">{error}</p> : null}
      <p className="mt-2 text-[12px] leading-5 text-ink3">{t('debts.form.interestPeriods.remainingHint')}</p>
    </div>
  )
}
