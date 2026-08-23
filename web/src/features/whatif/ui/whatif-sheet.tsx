import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventField,
  EventFieldInput,
  EventMoneyInput,
  eventDateTriggerClass,
} from '@/components/ui/event-field'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { useWhatIf } from '@money-space/core/features/whatif/hooks/use-whatif'
import { WhatIfResultBlocks } from '@/features/whatif/ui/components/whatif-result-blocks'
import { buildShareSummary } from '@money-space/core/features/whatif/model/whatif-share'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { parseRawMoney } from '@money-space/core/shared/lib/number-format'
import { useWhatIfStore, type WhatIfPrefill } from '@money-space/core/shared/stores/whatif-store'

/**
 * The single global what-if surface (spec §26D). Mounted ONCE in AppShell and
 * driven by `whatif-store` — there is deliberately **no `/what-if` route**:
 * it is a contextual action, not a destination.
 *
 * There is also deliberately **no "Save scenario"** action. Nothing is
 * persisted, and there is no table for it to go into (§2.12).
 */
export function WhatIfSheet() {
  const { open, prefill, close } = useWhatIfStore()

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      {/*
        Keying on the prefill remounts the form for each new question, which
        resets the fields and drops the previous result without a
        state-syncing effect.
      */}
      <WhatIfSheetForm
        key={`${prefill.source ?? 'other'}:${prefill.goalId ?? ''}:${prefill.amount ?? ''}:${prefill.plannedDate ?? ''}`}
        prefill={prefill}
      />
    </ResponsiveDialog>
  )
}

function WhatIfSheetForm({ prefill }: { prefill: WhatIfPrefill }) {
  const { t } = useTranslation()
  const { result, run, reset, isRunning } = useWhatIf()

  const [amount, setAmount] = useState(prefill.amount ? String(prefill.amount) : '')
  const [plannedDate, setPlannedDate] = useState(
    prefill.plannedDate ?? new Date().toISOString().slice(0, 10),
  )
  const [label, setLabel] = useState('')

  const amountValue = parseRawMoney(amount)
  const canRun = Number.isFinite(amountValue) && amountValue > 0 && !!plannedDate

  async function handleRun() {
    if (!canRun) return
    try {
      await run({
        amount: amountValue,
        plannedDate,
        goalId: prefill.goalId,
        label: label.trim() || undefined,
      })
    } catch (error) {
      toast.error(getErrorMessage(error, t('whatif.error')))
    }
  }

  async function handleShare() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(buildShareSummary(result, t))
      toast.success(t('whatif.actions.shareCopied'))
    } catch {
      toast.error(t('whatif.actions.shareFailed'))
    }
  }

  return (
    <ResponsiveDialogContent>
      <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('whatif.title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t('whatif.description')}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          {/* The note leads: naming the purchase first is what turns an abstract
              number into the question the household is actually asking. */}
          <EventField label={t('whatif.form.label')} htmlFor="whatif-label">
            <EventFieldInput
              id="whatif-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={t('whatif.form.labelPlaceholder')}
            />
          </EventField>

          <EventField
            label={t('whatif.form.amount')}
            htmlFor="whatif-amount"
            trailing={<span className="text-[13px] text-ink2">đ</span>}
          >
            <EventMoneyInput
              id="whatif-amount"
              value={amount}
              onChange={setAmount}
              placeholder="0"
            />
          </EventField>

          {/* No `htmlFor`: the picker's control is a button, not an input, so
              a label pointing at an id would reference nothing. */}
          <EventField label={t('whatif.form.plannedDate')}>
            <DatePicker
              value={plannedDate}
              onChange={setPlannedDate}
              className={eventDateTriggerClass}
            />
          </EventField>

          {result ? <WhatIfResultBlocks result={result} /> : null}
        </div>

        <ResponsiveDialogFooter>
          {result ? (
            <>
              <Button variant="ghost" onClick={reset}>
                {t('whatif.actions.tryAnother')}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                {t('whatif.actions.share')}
              </Button>
            </>
          ) : null}
          {/* Once a result is on screen the button re-runs it against the
              edited figures, so it stops reading as "show me" and becomes
              "bring this up to date". */}
          <Button onClick={handleRun} disabled={!canRun || isRunning}>
            {isRunning
              ? t('whatif.actions.running')
              : result
                ? t('whatif.actions.update')
                : t('whatif.actions.run')}
          </Button>
        </ResponsiveDialogFooter>
    </ResponsiveDialogContent>
  )
}
