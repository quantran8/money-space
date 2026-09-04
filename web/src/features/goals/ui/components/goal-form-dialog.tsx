import { Check, Plus } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Controller, useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { MonthPicker } from '@/components/ui/month-picker'
import { Progress } from '@/components/ui/progress'
import {
  Field,
  MoneyField,
  TextareaField,
  fieldControlReset,
  fieldInput,
  fieldShell,
} from '@/components/ui/form-22'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { GoalAllocationsField } from '@/features/goals/ui/components/goal-allocations-field'
import type { AllocationAssetOption } from '@/features/goals/ui/components/goal-allocations-section'
import type { GoalAllocationDraft, GoalForm } from '@money-space/core/features/goals/model/goals-form'
import { formatVndExact, formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type GoalFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<GoalForm>
  assetOptions: AllocationAssetOption[]
  contestedWalletIds?: ReadonlySet<string>
  walletGoalNames?: ReadonlyMap<string, string[]>
  isEditing: boolean
  isSubmitting: boolean
  /** RHF's handleSubmit(): needs the form event to call preventDefault(). */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

type BuilderStep = 1 | 2 | 3

const PRIORITIES: GoalForm['priority'][] = ['high', 'medium', 'low']

const LAST_BUILDER_STEP: BuilderStep = 3

const BUILDER_STEPS: Array<{ step: BuilderStep; labelKey: string }> = [
  { step: 1, labelKey: 'goals.builder.stepPlan' },
  { step: 2, labelKey: 'goals.builder.stepSources' },
  { step: 3, labelKey: 'goals.builder.stepReview' },
]

function toNumber(raw: string | undefined): number {
  if (!raw) return 0
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

function toMonthValue(value: string): string {
  const match = value.match(/^(\d{4}-\d{2})/)
  return match?.[1] ?? ''
}

function monthLabel(value: string, empty: string): string {
  const month = toMonthValue(value)
  return month ? `${month.slice(5, 7)}/${month.slice(0, 4)}` : empty
}

function allocationCurrent(
  allocations: GoalAllocationDraft[],
  assetOptions: AllocationAssetOption[],
): number {
  return allocations.reduce((sum, row) => {
    const asset = assetOptions.find((option) => option.value === row.assetId)
    if (!asset) return sum
    if (row.role === 'holding' && row.kind === 'percent') {
      return sum + asset.balance * (toNumber(row.percent) / 100)
    }
    return sum + Math.min(toNumber(row.amount), asset.balance)
  }, 0)
}

function firstAllocationError(errors: FieldErrors<GoalForm>): string | undefined {
  function find(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') return undefined
    if ('message' in value && typeof value.message === 'string') return value.message
    for (const child of Object.values(value)) {
      const message = find(child)
      if (message) return message
    }
    return undefined
  }
  return find(errors.allocations)
}

export function GoalFormDialog({
  open,
  onOpenChange,
  form,
  assetOptions,
  contestedWalletIds,
  walletGoalNames,
  isEditing,
  isSubmitting,
  onSubmit,
}: GoalFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    trigger,
    formState: { errors, isDirty },
  } = form
  const [step, setStep] = useState<BuilderStep>(1)
  // The furthest step reached, so the rail can offer a jump back to anything
  // already visited without letting the user skip ahead past validation.
  const [furthestStep, setFurthestStep] = useState<BuilderStep>(1)
  /**
   * Set only by a deliberate press of the Save button.
   *
   * `continueCreate` awaits `trigger()`, so the step advances a microtask AFTER
   * the click handler returns, and the footer's Continue button is replaced by
   * the submit button in that same commit. The interaction still in flight (a
   * held Enter, or the click dispatched on mouseup) then lands on the new button
   * and saves the goal straight from the review step. Requiring this flag makes
   * saving impossible except through the button itself. A ref, not state — the
   * submit handler must read it in the same tick the click sets it.
   */
  const saveArmed = useRef(false)
  const [noteOpen, setNoteOpen] = useState(isEditing)

  const name = useWatch({ control, name: 'name' }) ?? ''
  const targetRaw = useWatch({ control, name: 'target' })
  const storedCurrentRaw = useWatch({ control, name: 'current' })
  const storedMonthlyRaw = useWatch({ control, name: 'plannedMonthly' })
  const allocations = useWatch({ control, name: 'allocations' }) ?? []
  const targetDate = useWatch({ control, name: 'targetDate' }) ?? ''
  const priority = useWatch({ control, name: 'priority' })
  const note = useWatch({ control, name: 'note' }) ?? ''

  const target = toNumber(targetRaw)
  const current = isEditing
    ? toNumber(storedCurrentRaw)
    : allocationCurrent(allocations, assetOptions)
  const plannedMonthly = isEditing
    ? toNumber(storedMonthlyRaw)
    : allocations.reduce(
        (sum, row) =>
          sum + (row.role === 'contribution' ? toNumber(row.monthlyContribution) : 0),
        0,
      )
  const remaining = Math.max(target - current, 0)
  const monthsToGoal =
    plannedMonthly > 0 && remaining > 0 ? Math.ceil(remaining / plannedMonthly) : null
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

  function requestOpenChange(next: boolean) {
    if (!next && isDirty && !window.confirm(t('goals.builder.discardChanges'))) return
    // Closing is the only moment the wizard is finished with, so the step resets
    // here rather than on submit — otherwise reopening to create the NEXT goal
    // landed on the review step with an empty form.
    if (!next) {
      setStep(1)
      setFurthestStep(1)
    }
    onOpenChange(next)
  }

  function goToStep(next: BuilderStep) {
    setStep(next)
    setFurthestStep((reached) => (next > reached ? next : reached))
  }

  /**
   * Rail navigation. Going back is always allowed — the user is returning to fix
   * something, and re-validating there would flag fields they have not reached.
   * Going forward runs the same checks the Continue button does, in order, so a
   * jump can never skip a step's validation.
   */
  async function requestStep(next: BuilderStep) {
    if (next <= step) {
      goToStep(next)
      return
    }
    for (let current = step; current < next; current += 1) {
      const ok =
        current === 1
          ? await trigger(['name', 'target'])
          : current === 2
            ? await trigger('allocations')
            : true
      if (!ok) {
        goToStep(current as BuilderStep)
        return
      }
    }
    goToStep(next)
  }

  /**
   * One line per rail row, so the sidebar doubles as the running summary of what
   * has been answered. Falls back to a placeholder rather than an empty row,
   * which would read as a rendering bug.
   */
  function railSummary(target: BuilderStep): string {
    const empty = t('goals.builder.rail.empty')
    if (target === 1) {
      return name.trim() || empty
    }
    if (target === 2) {
      return allocations.length > 0
        ? t('goals.builder.rail.sourceCount', { count: allocations.length })
        : empty
    }
    return t('goals.builder.rail.reviewAll')
  }

  async function continueCreate() {
    if (step === 1) {
      const valid = await trigger(['name', 'target'])
      if (valid) goToStep(2)
      return
    }
    if (step === 2) {
      const valid = await trigger('allocations')
      if (valid) goToStep(3)
    }
  }

  /**
   * Steps 1-2 are not a submit. Pressing Enter in any input fires the browser's
   * implicit submission, which would otherwise SAVE the goal from step 1 —
   * skipping the allocations and review the wizard exists to collect. Swallow it
   * and advance instead, which is what Enter should mean mid-wizard.
   *
   * Editing has no steps, so it submits straight away.
   */
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isEditing && step < 3) {
      event.preventDefault()
      void continueCreate()
      return
    }
    // A submit nobody armed is the race described on `saveArmed`, not an
    // intention: the user has not read the summary yet, let alone pressed Save.
    if (!saveArmed.current) {
      event.preventDefault()
      return
    }
    saveArmed.current = false
    // `onSubmit` is RHF's handleSubmit(), which calls preventDefault() itself —
    // but only when it receives the event. Forward it, or the browser performs a
    // native submit and reloads the page.
    onSubmit(event)
  }

  const priorityLabel = t(`options.priority.${priority}`)
  const noDeadline = t('goals.builder.noDeadline')

  return (
    <ResponsiveDialog open={open} onOpenChange={requestOpenChange}>
      {/* Same shell as the debt wizard: a fixed height from `md` (where
          ResponsiveDialog switches from Sheet to Dialog) so the box does not
          resize between steps, and a left rail from `lg`. */}
      <ResponsiveDialogContent className="grid max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-[920px] md:h-[min(680px,92dvh)] lg:grid-cols-[250px_1fr]">
        {/* The rail doubles as the running summary of what has been answered.
            Editing has no steps, so it renders only while creating. */}
        {!isEditing ? (
          <aside className="hidden min-h-0 flex-col overflow-y-auto border-r border-divider bg-canvas p-5 lg:flex">
            <ResponsiveDialogTitle className="mt-1 t-subtitle">
              {t('goals.form.title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="sr-only">
              {t('goals.form.help')}
            </ResponsiveDialogDescription>

            <div className="mt-6 space-y-1">
              {BUILDER_STEPS.map((item) => {
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
                      <span className="t-caption text-ink3">{t(item.labelKey)}</span>
                      <RailStatus step={item.step} current={step} done={item.step < furthestStep} />
                    </div>
                    <p className="mt-1 truncate t-body-sm">{railSummary(item.step)}</p>
                  </button>
                )
              })}
            </div>
          </aside>
        ) : null}

        {/* `max-h-[inherit]` is what makes the inner `1fr` row scroll. The grid
            parent caps itself at 92dvh, but a grid ROW is `auto` by default, so
            without this the form grew to its content, overflowed the cap and was
            simply clipped by `overflow-hidden` — the scroll region never got
            squeezed, so on a narrow screen (a Sheet, no fixed height) a long list
            of wallets could not be reached. */}
        <form
          className="grid max-h-[inherit] min-h-0 grid-rows-[auto_1fr_auto]"
          onSubmit={handleFormSubmit}
          noValidate
        >
          <header className="px-5 pb-2 pr-16 pt-5 text-left sm:px-8 sm:pr-16 sm:pt-7">
            {!isEditing ? (
              <p className="t-body-sm text-ink3">{t('goals.builder.stepStatus', { step })}</p>
            ) : null}
            {/* The rail carries the title on wide screens; the narrow layout and
                editing both drop the rail, so the title is restated here. */}
            <ResponsiveDialogTitle
              className={cn('mt-1 t-subhead font-medium tracking-[-0.015em]', !isEditing && 'lg:hidden')}
            >
              {isEditing ? t('goals.form.editTitle') : t('goals.form.title')}
            </ResponsiveDialogTitle>
            {isEditing ? (
              <ResponsiveDialogDescription className="sr-only">
                {t('goals.form.help')}
              </ResponsiveDialogDescription>
            ) : null}
          </header>

          <div className="min-h-0 overflow-hidden">
            <div className="grid h-full">
              <main className="min-h-0 overflow-y-auto">
                <div className="w-full px-5 pb-5 pt-4 sm:px-8">
                  {isEditing ? (
                    <EditPlanFields
                      form={form}
                      note={note}
                      targetDate={targetDate}
                      priority={priority}
                    />
                  ) : step === 1 ? (
                    <section>
                      <SectionIntro title={t('goals.builder.planQuestion')} />
                      <div className="space-y-5">
                        <Field
                          label={t('goals.form.name')}
                          htmlFor="goal-name"
                          error={errors.name?.message}
                        >
                          <div className={cn(fieldShell, 'h-12', errors.name && 'border-alert-ink')}>
                            <input
                              id="goal-name"
                              maxLength={80}
                              className={fieldInput}
                              placeholder={t('goals.form.namePlaceholder')}
                              {...register('name')}
                            />
                          </div>
                        </Field>

                        <Controller
                          control={control}
                          name="target"
                          render={({ field }) => (
                            <MoneyField
                              id="goal-target"
                              label={t('goals.builder.targetLabel')}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              error={errors.target?.message}
                              className="[&>div]:h-12"
                            />
                          )}
                        />
                        {/* A read-back of the field directly above it: its
                            one job is to confirm the digits went in, which the
                            compact scale cannot do. */}
                        {target > 0 ? (
                          <p className="num -mt-3 t-caption text-ink3">
                            {formatVndExact(target)}
                          </p>
                        ) : null}

                        <PlanDatePriorityFields
                          control={control}
                          targetDate={targetDate}
                          priority={priority}
                          priorityError={errors.priority?.message}
                        />
                        <p className="-mt-2 t-caption leading-5 text-ink3">
                          {t('goals.builder.priorityHelp')}
                        </p>

                        <div>
                          <button
                            type="button"
                            aria-expanded={noteOpen}
                            onClick={() => setNoteOpen((value) => !value)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-[9px] px-2 t-body-sm font-medium text-action hover:bg-card"
                          >
                            <Plus
                              className={cn('size-4 transition-transform', noteOpen && 'rotate-45')}
                              strokeWidth={1.75}
                            />
                            {noteOpen
                              ? t('goals.builder.hideNote')
                              : t('goals.builder.addNote')}
                          </button>
                          {noteOpen ? (
                            <div className="mt-2">
                              <TextareaField
                                id="goal-note"
                                label={t('goals.form.note')}
                                placeholder={t('goals.form.notePlaceholder')}
                                error={errors.note?.message}
                                maxLength={120}
                                {...register('note')}
                              />
                              <p className="mt-1.5 text-right font-mono t-caption-sm text-ink3">
                                {note.length}/120
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </section>
                  ) : step === 2 ? (
                    <section>
                      <SectionIntro title={t('goals.builder.sourceQuestion')} />
                      <Controller
                        control={control}
                        name="allocations"
                        render={({ field }) => (
                          <GoalAllocationsField
                            value={field.value}
                            onChange={field.onChange}
                            assetOptions={assetOptions}
                            contestedWalletIds={contestedWalletIds}
                            walletGoalNames={walletGoalNames}
                            error={firstAllocationError(errors)}
                          />
                        )}
                      />
                    </section>
                  ) : (
                    <GoalReview
                      name={name}
                      target={target}
                      targetDate={targetDate}
                      priorityLabel={priorityLabel}
                      note={note}
                      allocations={allocations}
                      assetOptions={assetOptions}
                      noDeadline={noDeadline}
                      onEdit={goToStep}
                    />
                  )}

                  {/* The live figures the 320px aside used to carry. Only from
                      the review step (and while editing, which has no steps):
                      "Đang tính vào" counts the money the chosen sources already
                      hold, and before step 3 nothing has been chosen — it read
                      0 đ next to a target the household had just typed, which
                      says nothing and looks like a miscalculation. */}
                  {isEditing || step === LAST_BUILDER_STEP ? (
                    <div className="mt-6" aria-live="polite">
                      <GoalSummary
                        target={target}
                        current={current}
                        remaining={remaining}
                        plannedMonthly={plannedMonthly}
                        monthsToGoal={monthsToGoal}
                        progress={progress}
                        allocations={allocations}
                        assetOptions={assetOptions}
                        isEditing={isEditing}
                        compact
                      />
                    </div>
                  ) : null}
                </div>
              </main>
            </div>
          </div>

          <footer className="flex shrink-0 items-center gap-2.5 border-t border-divider px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-7">
            {!isEditing && step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 px-4"
                onClick={() => goToStep((step - 1) as BuilderStep)}
              >
                {t('goals.builder.back')}
              </Button>
            ) : null}
            <p className="hidden min-w-0 flex-1 truncate t-caption-sm text-ink3 md:block">
              {isEditing
                ? t('goals.builder.editFooter')
                : t('goals.builder.footerStep', { step })}
            </p>
            {!isEditing && step < 3 ? (
              <Button
                key="advance"
                type="button"
                className="ml-auto min-h-11 px-5"
                onClick={() => void continueCreate()}
              >
                {t('goals.builder.continue')}
              </Button>
            ) : (
              <Button
                key="save"
                type="submit"
                disabled={isSubmitting}
                className="ml-auto min-h-11 px-5"
                onClick={() => {
                  saveArmed.current = true
                }}
              >
                {isSubmitting
                  ? t('goals.form.saving')
                  : isEditing
                    ? t('goals.form.save')
                    : t('goals.form.submit')}
              </Button>
            )}
          </footer>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/**
 * Each step asks one question, and the heading is the whole of it — a sub-line
 * restating the question in other words is copy the reader has to read twice to
 * learn nothing. Matches the debt wizard's StepHeading.
 */
function SectionIntro({ title }: { title: string }) {
  return <h2 className="mb-5 t-title">{title}</h2>
}

/**
 * A short, fixed set of options picked in place.
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

/**
 * The rail's per-step marker: a tick once the step is behind the user, a filled
 * dot for where they are, and a committed-grey dot for what is still ahead.
 */
function RailStatus({
  step,
  current,
  done,
}: {
  step: BuilderStep
  current: BuilderStep
  done: boolean
}) {
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

function PlanDatePriorityFields({
  control,
  targetDate,
  priority,
  priorityError,
}: {
  control: UseFormReturn<GoalForm>['control']
  targetDate: string
  priority: GoalForm['priority']
  priorityError?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4">
      {/* No `htmlFor`: the picker's control is a button, not an input. */}
      <Field label={t('goals.builder.targetMonth')}>
        <div className={cn(fieldShell, 'h-12')}>
          <Controller
            control={control}
            name="targetDate"
            render={({ field }) => (
              <MonthPicker
                value={targetDate}
                onChange={field.onChange}
                className={fieldControlReset}
              />
            )}
          />
        </div>
      </Field>
      {/* Three short options picked in place, as in the debt wizard: a Select
          would hide them behind a tap and give no sense of the alternatives. */}
      <Field label={t('goals.form.priority')} error={priorityError}>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <ChoiceChips
              label={t('goals.form.priority')}
              value={priority}
              onChange={field.onChange}
              options={PRIORITIES.map((value) => ({
                value,
                label: t(`options.priority.${value}`),
              }))}
            />
          )}
        />
      </Field>
    </div>
  )
}

function EditPlanFields({
  form,
  note,
  targetDate,
  priority,
}: {
  form: UseFormReturn<GoalForm>
  note: string
  targetDate: string
  priority: GoalForm['priority']
}) {
  const { t } = useTranslation()
  const { control, register, formState: { errors } } = form
  return (
    <section>
      <SectionIntro title={t('goals.builder.updatePlan')} />
      <div className="space-y-5">
        <Field label={t('goals.form.name')} htmlFor="goal-name" error={errors.name?.message}>
          <div className={cn(fieldShell, 'h-12', errors.name && 'border-alert-ink')}>
            <input id="goal-name" maxLength={80} className={fieldInput} {...register('name')} />
          </div>
        </Field>
        <Controller
          control={control}
          name="target"
          render={({ field }) => (
            <MoneyField
              id="goal-target"
              label={t('goals.builder.targetLabel')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.target?.message}
              className="[&>div]:h-12"
            />
          )}
        />
        <PlanDatePriorityFields
          control={control}
          targetDate={targetDate}
          priority={priority}
          priorityError={errors.priority?.message}
        />
        <TextareaField
          id="goal-note"
          label={t('goals.form.note')}
          placeholder={t('goals.form.notePlaceholder')}
          error={errors.note?.message}
          maxLength={120}
          {...register('note')}
        />
        <p className="text-right font-mono t-caption-sm text-ink3">{note.length}/120</p>
        <div className="rounded-[14px] bg-card p-4">
          <p className="t-body-sm font-medium">{t('goals.builder.sources')}</p>
          <p className="mt-1 t-caption leading-5 text-ink3">{t('goals.builder.sourcesManagedSeparately')}</p>
        </div>
      </div>
    </section>
  )
}

function GoalSummary({
  target,
  current,
  remaining,
  plannedMonthly,
  monthsToGoal,
  progress,
  allocations,
  assetOptions,
  isEditing,
  compact = false,
}: {
  target: number
  current: number
  remaining: number
  plannedMonthly: number
  monthsToGoal: number | null
  progress: number
  allocations: GoalAllocationDraft[]
  assetOptions: AllocationAssetOption[]
  isEditing: boolean
  compact?: boolean
}) {
  const { t } = useTranslation()
  const forecast = !target
    ? t('goals.builder.enterTargetForecast')
    : remaining <= 0
      ? t('goals.builder.goalCovered')
      : plannedMonthly > 0 && monthsToGoal !== null
        ? t('goals.builder.forecastMonths', {
            amount: formatVndScale(plannedMonthly),
            count: monthsToGoal,
          })
        : t('goals.builder.noMonthlyForecast')

  if (compact) {
    return (
      <section aria-live="polite">
        <div className="flex items-baseline justify-between gap-4">
          <SummaryMetric label={t('goals.builder.countingNow')} value={formatVndScale(current)} />
          <SummaryMetric
            label={t('goals.form.target')}
            value={target ? formatVndScale(target) : '—'}
            right
          />
        </div>
        {/* The bar draws a share but never states one. Without the figure the
            block reads as "not moving" at exactly the low percentages a goal
            starts at. */}
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={progress} className="mt-0 flex-1" />
          <span className="num shrink-0 t-body-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <p className="mt-3 rounded-[10px] bg-accent-soft px-3.5 py-3 t-caption leading-5 text-ink2">
          {forecast}
        </p>
      </section>
    )
  }

  return (
    <div>
      <p className="t-caption-sm font-medium text-ink3">{t('goals.builder.goalPicture')}</p>
      <div className="mt-6">
        <p className="t-caption text-ink3">{t('goals.form.target')}</p>
        {/* Target, "counting now" and "remaining" below form one
            subtraction the reader checks against the progress bar, so all
            three are exact đồng. */}
        <p className="num mt-1 t-metric">
          {target ? formatVndExact(target) : '—'}
        </p>
      </div>
      {/* No wash: a read-only summary is content (§2.4), and the accent-soft
          forecast directly below made two tinted blocks stack. The progress bar
          is the visual anchor this block needs. */}
      <div className="mt-6 border-t border-divider pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="t-caption text-ink2">{t('goals.builder.countingNow')}</span>
          <span className="num t-body-sm font-medium">{formatVndExact(current)}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={progress} className="mt-0 flex-1" />
          <span className="num shrink-0 t-body-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <p className="num mt-3 t-caption text-ink3">
          {target ? t('goals.builder.remainingAmount', { amount: formatVndExact(remaining) }) : t('goals.builder.noTarget')}
        </p>
      </div>
      <p className="mt-5 rounded-[14px] bg-accent-soft p-4 t-body-sm leading-6 text-ink2">
        {forecast}
      </p>
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="t-caption text-ink3">{t('goals.builder.sources')}</span>
          <span className="font-mono t-caption-sm text-ink3">
            {isEditing ? t('goals.builder.saved') : allocations.length}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {isEditing ? (
            <div className="flex items-center justify-between gap-3 t-caption">
              <span className="text-ink2">{t('goals.builder.savedAllocations')}</span>
              {/* The total, above the per-source parts that sum to it. */}
              <span className="num font-medium">{formatVndExact(plannedMonthly)}/{t('goals.builder.perMonth')}</span>
            </div>
          ) : allocations.length > 0 ? (
            allocations.map((row) => {
              const asset = assetOptions.find((option) => option.value === row.assetId)
              const detail = row.role === 'contribution'
                ? `${formatVndExact(toNumber(row.monthlyContribution))}/${t('goals.builder.perMonth')}`
                : row.kind === 'percent'
                  ? `${row.percent || 0}%`
                  : formatVndExact(toNumber(row.amount))
              return (
                <div key={row.assetId} className="flex items-center justify-between gap-3 t-caption">
                  <span className="min-w-0 truncate text-ink2">{asset?.name ?? row.assetId}</span>
                  <span className="num shrink-0">{detail}</span>
                </div>
              )
            })
          ) : (
            <p className="t-caption text-ink3">{t('goals.builder.noSourcesSelected')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryMetric({ label, value, right = false }: { label: string; value: string; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : undefined}>
      <p className="t-caption-sm text-ink3">{label}</p>
      <p className="num mt-1 t-body font-medium">{value}</p>
    </div>
  )
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return <Progress value={value} className={cn('mt-3 h-6 text-action', className)} />
}

function GoalReview({
  name,
  target,
  targetDate,
  priorityLabel,
  note,
  allocations,
  assetOptions,
  noDeadline,
  onEdit,
}: {
  name: string
  target: number
  targetDate: string
  priorityLabel: string
  note: string
  allocations: GoalAllocationDraft[]
  assetOptions: AllocationAssetOption[]
  noDeadline: string
  onEdit: (step: BuilderStep) => void
}) {
  const { t } = useTranslation()
  return (
    <section>
      <SectionIntro title={t('goals.builder.reviewTitle')} />
      {/* Divider-separated sections, not stacked cards. The review already sits
          on a card, and a rounded box inside one is the nested-surface pattern
          v5 removes — hierarchy comes from type, spacing and a hairline rule
          (Components.dc, "MetricCell → inline metric"). */}
      <div className="divide-y divide-divider">
        <div className="pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="t-caption-sm text-ink3">{name}</p>
              <p className="num mt-1 t-metric">{formatVndScale(target)}</p>
            </div>
            <ReviewEditButton onClick={() => onEdit(1)} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 t-caption">
            <div>
              <p className="text-ink3">{t('goals.builder.targetMonth')}</p>
              <p className="num mt-1 font-medium">{monthLabel(targetDate, noDeadline)}</p>
            </div>
            <div>
              <p className="text-ink3">{t('goals.form.priority')}</p>
              <p className="mt-1 font-medium">{priorityLabel}</p>
            </div>
          </div>
          {note ? <p className="mt-4 t-caption leading-5 text-ink2">{note}</p> : null}
        </div>

        <div className="py-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="t-subtitle">
              {t('goals.builder.sourceCount', { count: allocations.length })}
            </h3>
            <ReviewEditButton onClick={() => onEdit(2)} />
          </div>
          <div className="mt-2">
            {allocations.map((row) => {
              const asset = assetOptions.find((option) => option.value === row.assetId)
              const detail = row.role === 'contribution'
                ? row.amount
                  ? t('goals.builder.reviewContributionSaved', {
                      amount: formatVndExact(toNumber(row.monthlyContribution)),
                      saved: formatVndExact(toNumber(row.amount)),
                    })
                  : t('goals.builder.reviewContribution', {
                      amount: formatVndExact(toNumber(row.monthlyContribution)),
                    })
                : row.kind === 'percent'
                  ? t('goals.builder.reviewPercent', { percent: row.percent })
                  : t('goals.builder.reviewFixed', { amount: formatVndExact(toNumber(row.amount)) })
              return (
                <div key={row.assetId} className="py-2.5">
                  <p className="t-caption font-medium">{asset?.name ?? row.assetId}</p>
                  <p className="mt-1 t-caption-sm text-ink3">{detail}</p>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <p className="mt-6 rounded-control bg-accent-soft p-4 t-caption leading-5 text-ink2">
        {t('goals.builder.backendRecalculate')}
      </p>
    </section>
  )
}

function ReviewEditButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-10 rounded-[9px] px-3 t-caption font-medium text-action hover:bg-canvas"
    >
      {t('common.edit')}
    </button>
  )
}
