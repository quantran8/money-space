import { useState } from 'react'
import { Share, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useWhatIf } from '@money-space/core/features/whatif/hooks/use-whatif'
import { buildShareSummary } from '@money-space/core/features/whatif/model/whatif-share'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { parseRawMoney } from '@money-space/core/shared/lib/number-format'
import { notify } from '@money-space/core/shared/notify'
import {
  useWhatIfStore,
  type WhatIfPrefill,
} from '@money-space/core/shared/stores/whatif-store'

import { BottomSheet, Button, DateField, Field, MoneyInput } from '@/components/ui'
import { todayIso } from '@/features/forecast'
import { WhatIfResultBlocks } from '@/features/whatif/ui/whatif-result-blocks'

/**
 * The single global what-if surface (memory/what-if.md).
 *
 * Mounted ONCE, in `app/(tabs)/_layout.tsx` — the mobile equivalent of the
 * web's `AppShell` — and driven by core's `whatif-store`. There is deliberately
 * **no `/what-if` route**: it is a contextual action, not a destination, and a
 * sixth tab is not available to it either (§8 caps the bar at five).
 *
 * A bottom sheet rather than a modal, because that is what a modal becomes on a
 * phone (§22.9).
 *
 * Three things this file must never grow:
 *
 * 1. **No "Save scenario".** Nothing is persisted, and there is no table for it
 *    to go into. The share action hands a string to the OS; that is all.
 * 2. **No capability gate.** Running one is a READ — a `view_summary` partner
 *    must be able to ask the question. It is a POST only because it needs a
 *    body.
 * 3. **No verdict.** The result says what changes and never whether to buy.
 */
export function WhatIfSheet() {
  const { open, prefill, close } = useWhatIfStore()
  const { t } = useTranslation()

  return (
    // The title belongs to the sheet chrome, which is what carries the ✕ and
    // the scrim's accessibility label. Only the description is in the body.
    <BottomSheet open={open} onClose={close} title={t('whatif.title')}>
      {/*
        Keying on the prefill remounts the form for each new question, which
        resets the fields and drops the previous result without a
        state-syncing effect.
      */}
      <WhatIfSheetForm
        key={`${prefill.source ?? 'other'}:${prefill.goalId ?? ''}:${prefill.amount ?? ''}:${prefill.plannedDate ?? ''}`}
        prefill={prefill}
        onClose={close}
      />
    </BottomSheet>
  )
}

function WhatIfSheetForm({
  prefill,
  onClose,
}: {
  prefill: WhatIfPrefill
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { result, run, reset, isRunning } = useWhatIf()

  const [amount, setAmount] = useState(prefill.amount ? String(prefill.amount) : '')
  const [plannedDate, setPlannedDate] = useState(prefill.plannedDate ?? todayIso())
  const [label, setLabel] = useState('')
  const [amountError, setAmountError] = useState<string | undefined>()

  const amountValue = parseRawMoney(amount)

  /**
   * §22.10 — the primary button is NEVER disabled. Pressing it with nothing
   * typed says what is missing; a dimmed button would only hide the reason.
   */
  async function handleRun() {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setAmountError(t('whatif.form.amountRequired'))
      return
    }
    setAmountError(undefined)
    try {
      await run({
        amount: amountValue,
        plannedDate,
        goalId: prefill.goalId,
        label: label.trim() || undefined,
      })
    } catch (caught) {
      notify.error(getErrorMessage(caught, t('whatif.error')))
    }
  }

  /**
   * The share sheet, not the clipboard.
   *
   * The web copies because a browser has nowhere to hand a string to. A phone
   * does: the household is one of two people, and the thing they want to do
   * with this summary is send it to the other one. `Share` puts Zalo and
   * Messages one tap away and still offers "Copy" inside it, so the clipboard
   * route is not lost — it is one item deeper in a menu that also does the
   * thing they actually wanted. The summary is built by core's
   * `buildShareSummary`; nothing is persisted by handing it out.
   */
  async function handleShare() {
    if (!result) return
    try {
      await Share.share({ message: buildShareSummary(result, t) })
    } catch (caught) {
      notify.error(getErrorMessage(caught, t('whatif.actions.shareFailed')))
    }
  }

  return (
    <View>
      {/* Load-bearing, not filler: this is the line that says nothing is saved
          and that no answer here is advice about whether to buy. */}
      <Text className="text-[13px] leading-5 text-ink2">{t('whatif.description')}</Text>

      <View className="mt-5 gap-4">
        {/* The note leads: naming the purchase first is what turns an abstract
            number into the question the household is actually asking. */}
        <Field
          label={t('whatif.form.label')}
          placeholder={t('whatif.form.labelPlaceholder')}
          value={label}
          onChangeText={setLabel}
        />

        <MoneyInput
          label={t('whatif.form.amount')}
          value={amount}
          onChange={(next) => {
            setAmount(next)
            if (amountError) setAmountError(undefined)
          }}
          error={amountError}
        />

        <DateField
          label={t('whatif.form.plannedDate')}
          value={plannedDate}
          onChange={setPlannedDate}
        />

        {/* Consequence renders only after the household asks for it (§2.9). */}
        {result ? <WhatIfResultBlocks result={result} /> : null}
      </View>

      {/* The actions scroll with the content rather than pinning to the sheet's
          footer. Once a result is on screen the block below it runs to several
          hundred points, and a pinned bar would sit over the answer the
          household just asked for while they read it. */}
      <View className="mt-5 gap-2">
        {/* Once a result is on screen the button re-runs it against the edited
            figures, so it stops reading as "show me" and becomes "bring this
            up to date". Never disabled. */}
        <Button onPress={handleRun} loading={isRunning}>
          {isRunning
            ? t('whatif.actions.running')
            : result
              ? t('whatif.actions.update')
              : t('whatif.actions.run')}
        </Button>

        {result ? (
          <>
            <Button variant="secondary" onPress={handleShare}>
              {t('whatif.actions.share')}
            </Button>
            {/* Clears the answer, not the sheet — the next question usually
                starts from the same date. */}
            <Button variant="ghost" onPress={reset}>
              {t('whatif.actions.tryAnother')}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onPress={onClose}>
            {t('common.cancel')}
          </Button>
        )}
      </View>
    </View>
  )
}
