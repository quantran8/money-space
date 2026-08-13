import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Card } from '@/components/ui/card'
import { EventField, EventFieldInput, EventMoneyInput } from '@/components/ui/event-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { eventSelectTriggerClass } from '@/components/ui/event-field'
import { useCashflowEvents } from '@/features/cashflow/hooks/use-cashflow-events'
import { FinancialStateSection } from '@/features/dashboard/ui/components/financial-state-section'
import { FlexibleMoneySection } from '@/features/dashboard/ui/components/flexible-money-section'
import {
  useFinancialState,
  useFlexibleMoney,
} from '@/features/forecast/hooks/use-forecast'
import { useGoals } from '@/features/goals/hooks/use-goals'
import { useReserves } from '@/features/reserves/hooks/use-reserves'
import { WhatIfTrigger } from '@/features/whatif/ui/components/whatif-trigger'
import { getErrorMessage } from '@/shared/lib/get-error-message'
import { parseRawMoney } from '@/shared/lib/number-format'

/**
 * The wizard's per-step bodies.
 *
 * Every step writes through the SAME slice hooks the rest of the app uses —
 * onboarding is a different sequence over existing features, not a parallel
 * implementation of them.
 */

/** Step 5 — the household's reserve (§19C). */
export function ReserveStep() {
  const { t } = useTranslation()
  const { createReserve } = useReserves()
  const [amount, setAmount] = useState('')

  const value = parseRawMoney(amount)

  return (
    <>
      <EventField label={t('reserve.form.amount')} htmlFor="onboarding-reserve">
        <EventMoneyInput
          id="onboarding-reserve"
          value={amount}
          onChange={setAmount}
          placeholder="0"
        />
      </EventField>
      <p className="text-sm leading-6 text-ink2">
        {t('reserve.description')}
      </p>
      <SaveHint
        canSave={Number.isFinite(value) && value > 0}
        isSaving={createReserve.isPending}
        onSave={async () => {
          await createReserve.mutateAsync({
            name: t('onboarding.steps.reserve.defaultName'),
            amount: value,
          })
        }}
      />
    </>
  )
}

/** Steps 6 and 7 — recurring income, then obligations. Both are cashflow events. */
export function CashflowStep({ direction }: { direction: 'incoming' | 'outgoing' }) {
  const { t } = useTranslation()
  const { createCashflowEvent } = useCashflowEvents()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [recurrence, setRecurrence] = useState<'once' | 'monthly'>('monthly')

  const value = parseRawMoney(amount)

  return (
    <>
      <EventField label={t('onboarding.steps.cashflow.name')} htmlFor="cf-name">
        <EventFieldInput
          id="cf-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={
            direction === 'incoming'
              ? t('onboarding.steps.cashflow.incomePlaceholder')
              : t('onboarding.steps.cashflow.obligationPlaceholder')
          }
        />
      </EventField>

      <EventField label={t('onboarding.steps.cashflow.amount')} htmlFor="cf-amount">
        <EventMoneyInput id="cf-amount" value={amount} onChange={setAmount} placeholder="0" />
      </EventField>

      <EventField label={t('onboarding.steps.cashflow.date')} htmlFor="cf-date">
        <EventFieldInput
          id="cf-date"
          type="date"
          value={expectedDate}
          onChange={(event) => setExpectedDate(event.target.value)}
        />
      </EventField>

      <EventField label={t('onboarding.steps.cashflow.recurrence')}>
        <Select
          value={recurrence}
          onValueChange={(next) => setRecurrence(next as 'once' | 'monthly')}
        >
          <SelectTrigger className={eventSelectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">
              {t('onboarding.steps.cashflow.monthly')}
            </SelectItem>
            <SelectItem value="once">{t('onboarding.steps.cashflow.once')}</SelectItem>
          </SelectContent>
        </Select>
      </EventField>

      <SaveHint
        canSave={name.trim().length > 0 && Number.isFinite(value) && value > 0}
        isSaving={createCashflowEvent.isPending}
        onSave={async () => {
          await createCashflowEvent.mutateAsync({
            name: name.trim(),
            amount: value,
            direction,
            expectedDate,
            recurrence,
            // Incoming is forced to `null` requirement server-side; outgoing
            // defaults to `required`, the conservative choice.
            ...(direction === 'outgoing' ? { requirement: 'required' as const } : {}),
            certainty: 'confirmed',
          })
          setName('')
          setAmount('')
        }}
      />
    </>
  )
}

/** Step 8 — the household's main goal. */
export function MainGoalStep() {
  const { t } = useTranslation()
  const { createGoal } = useGoals()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')

  const value = parseRawMoney(target)

  return (
    <>
      <EventField label={t('onboarding.steps.goal.name')} htmlFor="goal-name">
        <EventFieldInput
          id="goal-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('onboarding.steps.goal.namePlaceholder')}
        />
      </EventField>

      <EventField label={t('onboarding.steps.goal.target')} htmlFor="goal-target">
        <EventMoneyInput
          id="goal-target"
          value={target}
          onChange={setTarget}
          placeholder="0"
        />
      </EventField>

      <SaveHint
        canSave={name.trim().length > 0 && Number.isFinite(value) && value > 0}
        isSaving={createGoal.isPending}
        onSave={async () => {
          await createGoal.mutateAsync({
            name: name.trim(),
            targetAmount: value,
            priority: 'high',
          })
        }}
      />
    </>
  )
}

/**
 * Step 9 — the **Clarity Moment**: the household's first financial picture,
 * assembled from what they just entered. This is the payoff for the setup.
 */
export function FirstPictureStep() {
  const { t } = useTranslation()
  const { financialState, isLoading: stateLoading } = useFinancialState()
  const { flexibleMoney, isLoading: flexibleLoading } = useFlexibleMoney()

  return (
    <>
      <p className="text-sm leading-6 text-ink2">
        {t('onboarding.steps.firstPicture.intro')}
      </p>
      <FinancialStateSection financialState={financialState} isLoading={stateLoading} />
      <FlexibleMoneySection flexibleMoney={flexibleMoney} isLoading={flexibleLoading} />
    </>
  )
}

/**
 * Step 10 — the **Consequence Moment**: the first what-if. Opens the same
 * global sheet the rest of the app uses.
 */
export function FirstWhatIfStep() {
  const { t } = useTranslation()

  return (
    <Card>
      <p className="font-semibold">{t('onboarding.steps.firstWhatIf.title')}</p>
      <p className="mt-1 text-sm leading-6 text-ink2">
        {t('onboarding.steps.firstWhatIf.description')}
      </p>
      <div className="mt-4">
        <WhatIfTrigger prefill={{ source: 'onboarding' }} variant="default" />
      </div>
    </Card>
  )
}

/**
 * Steps write immediately rather than batching to the end, so a user who
 * abandons halfway still keeps what they entered.
 */
function SaveHint({
  canSave,
  isSaving,
  onSave,
}: {
  canSave: boolean
  isSaving: boolean
  onSave: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    try {
      await onSave()
      setSaved(true)
      toast.success(t('onboarding.wizard.saved'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('onboarding.wizard.saveFailed')))
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || isSaving}
        className="rounded-full bg-sunk px-4 py-2 text-sm font-semibold transition-colors hover:bg-[hsl(var(--secondary))] disabled:opacity-50"
      >
        {isSaving ? t('onboarding.wizard.saving') : t('onboarding.wizard.add')}
      </button>
      {saved ? (
        <span className="text-sm text-accent">
          {t('onboarding.wizard.saved')}
        </span>
      ) : null}
    </div>
  )
}
