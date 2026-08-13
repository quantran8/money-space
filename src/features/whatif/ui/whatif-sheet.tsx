import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EventField, EventFieldInput, EventMoneyInput } from '@/components/ui/event-field'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { useWhatIf } from '@/features/whatif/hooks/use-whatif'
import { WhatIfResultBlocks } from '@/features/whatif/ui/components/whatif-result-blocks'
import { buildShareSummary } from '@/features/whatif/model/whatif-share'
import { getErrorMessage } from '@/shared/lib/get-error-message'
import { parseRawMoney } from '@/shared/lib/number-format'
import { useWhatIfStore, type WhatIfPrefill } from '@/shared/stores/whatif-store'

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
          <EventField label={t('whatif.form.amount')} htmlFor="whatif-amount">
            <EventMoneyInput
              id="whatif-amount"
              value={amount}
              onChange={setAmount}
              placeholder="0"
            />
          </EventField>

          <EventField label={t('whatif.form.plannedDate')} htmlFor="whatif-date">
            <EventFieldInput
              id="whatif-date"
              type="date"
              value={plannedDate}
              onChange={(event) => setPlannedDate(event.target.value)}
            />
          </EventField>

          <EventField label={t('whatif.form.label')} htmlFor="whatif-label">
            <EventFieldInput
              id="whatif-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={t('whatif.form.labelPlaceholder')}
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
          <Button onClick={handleRun} disabled={!canRun || isRunning}>
            {isRunning ? t('whatif.actions.running') : t('whatif.actions.run')}
          </Button>
        </ResponsiveDialogFooter>
    </ResponsiveDialogContent>
  )
}
