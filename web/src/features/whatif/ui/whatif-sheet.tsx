import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { EventMoneyInput } from '@/components/ui/event-field'
import { WhatIfField, whatIfDateTriggerClass } from '@/features/whatif/ui/components/whatif-field'
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
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
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
  const close = useWhatIfStore((state) => state.close)
  const { result, run, reset, isRunning } = useWhatIf()

  const [amount, setAmount] = useState(prefill.amount ? String(prefill.amount) : '')
  const [plannedDate, setPlannedDate] = useState(
    prefill.plannedDate ?? new Date().toISOString().slice(0, 10),
  )

  const amountValue = parseRawMoney(amount)
  const canRun = Number.isFinite(amountValue) && amountValue > 0 && !!plannedDate

  async function handleRun() {
    if (!canRun) return
    try {
      await run({
        amount: amountValue,
        plannedDate,
        goalId: prefill.goalId,
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

  /**
   * Once there is an answer, the ANSWER is the screen.
   *
   * The form and the result used to be stacked, which meant the figure the
   * household came for opened below three fields they had just filled in — on a
   * phone, below the fold. So the question collapses into the header line it
   * can be stated in ("11,11 tỷ · 26/08/2026") and the result takes the body.
   * `Thử số khác` puts the fields back with the previous answer dropped, which
   * is also what makes the primary button unambiguous: it says `Xem thử` in
   * exactly the state where the fields are on screen.
   */
  const showResult = Boolean(result)

  return (
    /*
      The answer needs a bigger surface than the question does.
      `max-w-lg` (32rem) is right for three fields and far too narrow for five
      consequence sections — the bills and goals rows carry a name, a pair of
      figures and a shortfall on ONE line, and at 32rem they wrap into a stack
      nobody can read across. So the dialog sizes to what it is currently
      holding rather than to a single compromise width.

      No `sm:` prefix needed: `ResponsiveDialog` only mounts the Dialog above
      768px and swaps to a full-width Sheet below it, so these classes never
      reach a phone.
    */
    <ResponsiveDialogContent
      className={
        showResult
          ? // `flex` rather than the primitive's `grid`: auto grid rows will not
            // shrink below their content, so the body could never become the
            // scroll container while the dialog stayed `grid`.
            //
            // `overflow-hidden` then hands scrolling to that body. Without it
            // the dialog scrolls itself, which puts the scrollbar on its outer
            // edge — outside the rounded corner, over the shadow.
            //
            // A FIXED height, not a max: the primitive centres itself with
            // `top-1/2 -translate-y-1/2`, so any height change re-centres the
            // whole dialog. With sections revealed one at a time that meant a
            // jump on every reveal — which is what actually made the sequence
            // feel unsmooth. At a fixed height each section fills space that is
            // already there and nothing moves but the section itself.
            'flex h-[92dvh] max-w-[56rem] flex-col overflow-hidden'
          : undefined
      }
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{t('whatif.title')}</ResponsiveDialogTitle>
        {/*
          The form state carries NO visible description: "Không lưu thay đổi"
          was reassurance nobody asked for, and it pushed the first field down
          for a sentence read once and never again.

          It stays mounted `sr-only` rather than being dropped, because Radix
          warns when a dialog has no description and the title alone does not
          say what the sheet does. Once there is an answer the slot earns its
          place back — it holds the question the result belongs to.
        */}
        <ResponsiveDialogDescription className={showResult ? undefined : 'sr-only'}>
          {showResult
            ? t('whatif.summary', {
                amount: formatVndShort(amountValue),
                date: plannedDate,
              })
            : t('whatif.description')}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      {/*
        The result gets the CANVAS as its ground.

        `DialogContent` is `--card` (white) and so is every `Panel` inside the
        result, so the sections were white-on-white — five cards that read as
        one undifferentiated wall of numbers. On a real page cards sit on
        `--canvas`, and that lightness step is the only thing separating them
        (§2.2: no borders, no shadows). Reproducing it here is what makes the
        sections legible as sections.

        It is also the scroll container, so the scrollbar rides inside the
        dialog rather than on its outer edge. Negative margins + matching
        padding let the ground run to the dialog's edges while the content stays
        on the p-6 grid.
      */}
      <div
        className={
          showResult
            ? '-mx-6 min-h-0 flex-1 overflow-y-auto bg-canvas px-6 py-4'
            : 'mt-2 max-h-[60vh] overflow-y-auto'
        }
      >
        {showResult ? (
          <WhatIfResultBlocks result={result!} />
        ) : (
          <div className="space-y-5">
            <WhatIfField
              label={t('whatif.form.amount')}
              htmlFor="whatif-amount"
              trailing={<span className="shrink-0 t-body-sm text-ink2">đ</span>}
            >
              {/*
                `t-body`, not the hero `t-figure` the money input defaults to:
                inside a 44px control the figure size has no room to breathe,
                and this is a number being tried out, not a headline.

                `!` because `cn`'s tailwind-merge does not know the `.t-*` steps
                are one family — it keeps BOTH classes, leaving the winner to
                CSS source order. The override says so outright instead.
              */}
              <EventMoneyInput
                id="whatif-amount"
                value={amount}
                onChange={setAmount}
                placeholder="0"
                className="!t-body"
              />
            </WhatIfField>

            {/* No `htmlFor`: the picker's control is a button, not an input, so
                a label pointing at an id would reference nothing. */}
            <WhatIfField label={t('whatif.form.plannedDate')}>
              <DatePicker
                value={plannedDate}
                onChange={setPlannedDate}
                className={whatIfDateTriggerClass}
              />
            </WhatIfField>
          </div>
        )}
      </div>

      <ResponsiveDialogFooter>
        {showResult ? (
          <>
            {/* Editing the figures means going back to them — there are no
                fields on screen to re-run against. */}
            <Button variant="ghost" onClick={reset}>
              {t('whatif.actions.tryAnother')}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              {t('whatif.actions.share')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              {t('whatif.actions.cancel')}
            </Button>
            <Button onClick={handleRun} disabled={!canRun || isRunning}>
              {isRunning ? t('whatif.actions.running') : t('whatif.actions.run')}
            </Button>
          </>
        )}
      </ResponsiveDialogFooter>
    </ResponsiveDialogContent>
  )
}
