import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GoalAllocationsField } from '@/features/goals/ui/components/goal-allocations-field'
import type { AllocationAssetOption } from '@/features/goals/ui/components/goal-allocations-section'
import type { GoalAllocationDraft, GoalForm } from '@/features/goals/model/goals-form'
import { formatVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type GoalFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<GoalForm>
  assetOptions: AllocationAssetOption[]
  contestedWalletIds?: ReadonlySet<string>
  walletGoalNames?: ReadonlyMap<string, string[]>
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

type BuilderStep = 1 | 2 | 3

function toNumber(raw: string | undefined): number {
  if (!raw) return 0
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

function toMonthValue(value: string): string {
  const match = value.match(/^(\d{4}-\d{2})/)
  return match?.[1] ?? ''
}

function fromMonthValue(value: string): string {
  return value ? `${value}-01` : ''
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
    onOpenChange(next)
  }

  async function continueCreate() {
    if (step === 1) {
      const valid = await trigger(['name', 'target'])
      if (valid) setStep(2)
      return
    }
    if (step === 2) {
      const valid = await trigger('allocations')
      if (valid) setStep(3)
    }
  }

  const priorityLabel = t(`options.priority.${priority}`)
  const noDeadline = t('goals.builder.noDeadline')

  return (
    <ResponsiveDialog open={open} onOpenChange={requestOpenChange}>
      <ResponsiveDialogContent className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 pb-0 md:h-[min(900px,92dvh)] md:max-h-[92dvh] md:max-w-[1080px] md:rounded-[18px] [&>button:last-child]:left-5 [&>button:last-child]:right-auto [&>button:last-child]:top-[18px] [&>button:last-child]:grid [&>button:last-child]:size-11 [&>button:last-child]:place-items-center [&>button:last-child]:rounded-[10px] md:[&>button:last-child]:left-6 md:[&>button:last-child]:top-[18px]">
        <header className="flex flex-none items-center gap-3 bg-panel py-4 pl-[76px] pr-6 md:py-5 md:pl-[88px] md:pr-8">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-ink3">
              {isEditing ? t('goals.builder.editEyebrow') : t('goals.builder.createEyebrow')}
            </p>
            <ResponsiveDialogTitle className="mt-0.5 truncate text-[18px] font-medium md:text-[20px]">
              {isEditing ? t('goals.form.editTitle') : t('goals.form.title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="sr-only">
              {t('goals.form.help')}
            </ResponsiveDialogDescription>
          </div>
          {!isEditing ? (
            <p className="hidden font-mono text-[11px] text-ink3 md:block">
              {t('goals.builder.stepStatus', { step })}
            </p>
          ) : null}
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 flex-1 overflow-hidden bg-[var(--app)]">
            <div className="grid h-full md:grid-cols-[minmax(0,1fr)_320px]">
              <main className="min-h-0 overflow-y-auto">
                <div className="mx-auto w-full max-w-[650px] px-[18px] py-6 md:px-10 md:py-8">
                  {!isEditing ? <GoalStepper step={step} /> : null}

                  {isEditing ? (
                    <EditPlanFields
                      form={form}
                      note={note}
                      targetDate={targetDate}
                      priority={priority}
                    />
                  ) : step === 1 ? (
                    <section>
                      <SectionIntro
                        title={t('goals.builder.planQuestion')}
                        description={t('goals.builder.planDescription')}
                      />
                      <div className="space-y-5">
                        <Field
                          label={t('goals.form.name')}
                          htmlFor="goal-name"
                          error={errors.name?.message}
                        >
                          <div className={cn(fieldShell, 'h-12', errors.name && 'border-alert')}>
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
                        {target > 0 ? (
                          <p className="num -mt-3 text-[12px] text-ink3">
                            {formatVndScale(target)}
                          </p>
                        ) : null}

                        <PlanDatePriorityFields
                          control={control}
                          targetDate={targetDate}
                          priority={priority}
                          priorityError={errors.priority?.message}
                        />
                        <p className="-mt-2 text-[12px] leading-5 text-ink3">
                          {t('goals.builder.priorityHelp')}
                        </p>

                        <div>
                          <button
                            type="button"
                            aria-expanded={noteOpen}
                            onClick={() => setNoteOpen((value) => !value)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-[9px] px-2 text-[13px] font-medium text-accent hover:bg-panel"
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
                              <p className="mt-1.5 text-right font-mono text-[11px] text-ink3">
                                {note.length}/120
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </section>
                  ) : step === 2 ? (
                    <section>
                      <SectionIntro
                        title={t('goals.builder.sourceQuestion')}
                        description={t('goals.builder.sourceDescription')}
                      />
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
                      onEdit={setStep}
                    />
                  )}

                  <div className="mt-6 md:hidden">
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
                </div>
              </main>

              <aside className="hidden min-h-0 overflow-y-auto bg-panel p-7 md:block" aria-live="polite">
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
                />
              </aside>
            </div>
          </div>

          <footer className="flex flex-none items-center gap-2.5 bg-panel px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-5">
            {!isEditing && step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 px-4 text-[13px]"
                onClick={() => setStep((step - 1) as BuilderStep)}
              >
                {t('goals.builder.back')}
              </Button>
            ) : null}
            <p className="hidden min-w-0 flex-1 truncate text-[11px] text-ink3 md:block">
              {isEditing
                ? t('goals.builder.editFooter')
                : t('goals.builder.footerStep', { step })}
            </p>
            {!isEditing && step < 3 ? (
              <Button
                type="button"
                className="ml-auto min-h-11 px-5 text-[13px]"
                onClick={() => void continueCreate()}
              >
                {t('goals.builder.continue')}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto min-h-11 px-5 text-[13px]"
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

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h2 className="text-[22px] font-medium tracking-[-0.01em]">{title}</h2>
      <p className="mt-2 max-w-[540px] text-[13px] leading-5 text-ink2">{description}</p>
    </div>
  )
}

function GoalStepper({ step }: { step: BuilderStep }) {
  const { t } = useTranslation()
  const steps = [
    t('goals.builder.stepPlan'),
    t('goals.builder.stepSources'),
    t('goals.builder.stepReview'),
  ]
  return (
    <div className="mb-7 flex items-center gap-2 md:mb-8">
      {steps.map((label, index) => {
        const number = (index + 1) as BuilderStep
        const done = number < step
        const active = number === step
        return (
          <div key={label} className="contents">
            {index > 0 ? <div className="h-px flex-1 bg-hair" /> : null}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full bg-sunk font-mono text-[11px] font-medium text-ink3',
                  active && 'bg-ink text-panel',
                  done && 'bg-accent-soft text-accent',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={2} /> : number}
              </span>
              <span className={cn('hidden text-[12px] text-ink3 sm:inline', active && 'font-medium text-ink')}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
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
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t('goals.builder.targetMonth')} htmlFor="goal-target-month">
        <div className={cn(fieldShell, 'h-12')}>
          <Controller
            control={control}
            name="targetDate"
            render={({ field }) => (
              <input
                id="goal-target-month"
                type="month"
                value={toMonthValue(targetDate)}
                onChange={(event) => field.onChange(fromMonthValue(event.target.value))}
                className={cn(fieldInput, 'num')}
              />
            )}
          />
        </div>
      </Field>
      <Field label={t('goals.form.priority')} error={priorityError}>
        <div className={cn(fieldShell, 'h-12', priorityError && 'border-alert')}>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={priority} onValueChange={field.onChange}>
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
      <SectionIntro title={t('goals.builder.updatePlan')} description={t('goals.builder.updateDescription')} />
      <div className="space-y-5">
        <Field label={t('goals.form.name')} htmlFor="goal-name" error={errors.name?.message}>
          <div className={cn(fieldShell, 'h-12', errors.name && 'border-alert')}>
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
        <p className="text-right font-mono text-[11px] text-ink3">{note.length}/120</p>
        <div className="rounded-[14px] bg-panel p-4">
          <p className="text-[13px] font-medium">{t('goals.builder.sources')}</p>
          <p className="mt-1 text-[12px] leading-5 text-ink3">{t('goals.builder.sourcesManagedSeparately')}</p>
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
      <section className="rounded-[14px] bg-panel p-4" aria-live="polite">
        <div className="flex items-baseline justify-between gap-4">
          <SummaryMetric label={t('goals.builder.countingNow')} value={formatVndScale(current)} />
          <SummaryMetric
            label={t('goals.form.target')}
            value={target ? formatVndScale(target) : '—'}
            right
          />
        </div>
        <ProgressBar value={progress} />
        <p className="mt-3 rounded-[10px] bg-accent-soft px-3.5 py-3 text-[12px] leading-5 text-ink2">
          {forecast}
        </p>
      </section>
    )
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-ink3">{t('goals.builder.goalPicture')}</p>
      <div className="mt-6">
        <p className="text-[12px] text-ink3">{t('goals.form.target')}</p>
        <p className="num mt-1 text-[28px] font-medium tracking-[-0.03em]">
          {target ? formatVndScale(target) : '—'}
        </p>
      </div>
      <div className="mt-6 rounded-[14px] bg-sunk p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12px] text-ink2">{t('goals.builder.countingNow')}</span>
          <span className="num text-[15px] font-medium">{formatVndScale(current)}</span>
        </div>
        <ProgressBar value={progress} />
        <p className="num mt-3 text-[12px] text-ink3">
          {target ? t('goals.builder.remainingAmount', { amount: formatVndScale(remaining) }) : t('goals.builder.noTarget')}
        </p>
      </div>
      <p className="mt-5 rounded-[14px] bg-accent-soft p-4 text-[13px] leading-6 text-ink2">
        {forecast}
      </p>
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-ink3">{t('goals.builder.sources')}</span>
          <span className="font-mono text-[11px] text-ink3">
            {isEditing ? t('goals.builder.saved') : allocations.length}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {isEditing ? (
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-ink2">{t('goals.builder.savedAllocations')}</span>
              <span className="num font-medium">{formatVndScale(plannedMonthly)}/{t('goals.builder.perMonth')}</span>
            </div>
          ) : allocations.length > 0 ? (
            allocations.map((row) => {
              const asset = assetOptions.find((option) => option.value === row.assetId)
              const detail = row.role === 'contribution'
                ? `${formatVndScale(toNumber(row.monthlyContribution))}/${t('goals.builder.perMonth')}`
                : row.kind === 'percent'
                  ? `${row.percent || 0}%`
                  : formatVndScale(toNumber(row.amount))
              return (
                <div key={row.assetId} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="min-w-0 truncate text-ink2">{asset?.name ?? row.assetId}</span>
                  <span className="num shrink-0">{detail}</span>
                </div>
              )
            })
          ) : (
            <p className="text-[12px] text-ink3">{t('goals.builder.noSourcesSelected')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryMetric({ label, value, right = false }: { label: string; value: string; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : undefined}>
      <p className="text-[11px] text-ink3">{label}</p>
      <p className="num mt-1 text-[17px] font-medium">{value}</p>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-hair">
      <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
    </div>
  )
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
      <SectionIntro title={t('goals.builder.reviewTitle')} description={t('goals.builder.reviewDescription')} />
      <div className="space-y-4">
        <div className="rounded-[14px] bg-panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] text-ink3">{name}</p>
              <p className="num mt-1 text-[24px] font-medium">{formatVndScale(target)}</p>
            </div>
            <ReviewEditButton onClick={() => onEdit(1)} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 text-[12px]">
            <div>
              <p className="text-ink3">{t('goals.builder.targetMonth')}</p>
              <p className="num mt-1 font-medium">{monthLabel(targetDate, noDeadline)}</p>
            </div>
            <div>
              <p className="text-ink3">{t('goals.form.priority')}</p>
              <p className="mt-1 font-medium">{priorityLabel}</p>
            </div>
          </div>
          {note ? <p className="mt-4 text-[12px] leading-5 text-ink2">{note}</p> : null}
        </div>

        <div className="rounded-[14px] bg-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[13px] font-medium">
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
                      amount: formatVndScale(toNumber(row.monthlyContribution)),
                      saved: formatVndScale(toNumber(row.amount)),
                    })
                  : t('goals.builder.reviewContribution', {
                      amount: formatVndScale(toNumber(row.monthlyContribution)),
                    })
                : row.kind === 'percent'
                  ? t('goals.builder.reviewPercent', { percent: row.percent })
                  : t('goals.builder.reviewFixed', { amount: formatVndScale(toNumber(row.amount)) })
              return (
                <div key={row.assetId} className="py-2.5">
                  <p className="text-[12px] font-medium">{asset?.name ?? row.assetId}</p>
                  <p className="mt-1 text-[11px] text-ink3">{detail}</p>
                </div>
              )
            })}
          </div>
        </div>

        <p className="rounded-[14px] bg-accent-soft p-4 text-[12px] leading-5 text-ink2">
          {t('goals.builder.backendRecalculate')}
        </p>
      </div>
    </section>
  )
}

function ReviewEditButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-10 rounded-[9px] px-3 text-[12px] font-medium text-accent hover:bg-sunk"
    >
      {t('common.edit')}
    </button>
  )
}
