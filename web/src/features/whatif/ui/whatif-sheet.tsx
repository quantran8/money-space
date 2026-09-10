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
import { useFlexibleMoney } from '@money-space/core/features/forecast/hooks/use-forecast'
import { useWhatIf } from '@money-space/core/features/whatif/hooks/use-whatif'
import { useQuota } from '@money-space/core/features/billing/hooks/use-quota'
import { useWhatIfAssetSale } from '@money-space/core/features/whatif/hooks/use-whatif-asset-sale'
import {
  exceedsEverything,
  fundingVerdict,
} from '@money-space/core/features/whatif/model/whatif-asset-sale'
import type { WhatIfAssetSale } from '@money-space/core/features/whatif/model/whatif.types'
import { WhatIfResultBlocks } from '@/features/whatif/ui/components/whatif-result-blocks'
import { WhatIfAssetSaleStep } from '@/features/whatif/ui/components/whatif-asset-sale-step'
import { buildShareSummary } from '@money-space/core/features/whatif/model/whatif-share'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { cn } from '@money-space/core/shared/lib/utils'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { parseRawMoney } from '@money-space/core/shared/lib/number-format'
import { useWhatIfStore, type WhatIfPrefill } from '@money-space/core/shared/stores/whatif-store'
import { useBillingSheetOpen } from '@money-space/core/shared/stores/paywall-store'

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
  // Stand aside while the paywall is up rather than closing — the quota gate
  // opens it from inside this sheet, and closing would drop the question.
  const billingOpen = useBillingSheetOpen()

  return (
    <ResponsiveDialog
      open={open && !billingOpen}
      onOpenChange={(next) => (next || billingOpen ? undefined : close())}
    >
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
  const { flexibleMoney } = useFlexibleMoney()
  // Display only — `useWhatIf` is what actually refuses a run over the ceiling.
  const quota = useQuota('whatIfPerMonth')

  const [amount, setAmount] = useState(prefill.amount ? String(prefill.amount) : '')
  const [plannedDate, setPlannedDate] = useState(
    prefill.plannedDate ?? new Date().toISOString().slice(0, 10),
  )
  const [saleStepOpen, setSaleStepOpen] = useState(false)
  /** True when the step opened on its own, rather than from the result's CTA. */
  const [saleWasOffered, setSaleWasOffered] = useState(false)
  const sale = useWhatIfAssetSale(result?.fundingOptions)

  const amountValue = parseRawMoney(amount)
  /**
   * Beyond usable money AND every holding — said HERE, on the field, rather
   * than after a round-trip and a screen. No forecast is needed to know a spend
   * is larger than everything that exists.
   */
  const beyondEverything = exceedsEverything(
    amountValue,
    flexibleMoney?.currentSharedLiquidMoney,
    sale.sellableTotal,
    sale.isSellableTotalKnown,
  )
  const amountError = beyondEverything
    ? t('whatif.form.beyondEverything', {
        total: formatVndShort(beyondEverything.total),
        amount: formatVndShort(beyondEverything.short),
      })
    : undefined
  const canRun =
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    !!plannedDate &&
    !beyondEverything
  const shortfall = result?.liquidity?.shortfall ?? 0
  const verdict = fundingVerdict(
    shortfall,
    sale.sellableTotal,
    sale.options.length,
    sale.isSellableTotalKnown,
  )
  /** Selling could close the gap — the only case where the step is worth opening. */
  const saleCouldCover = verdict.kind === 'canCover'
  /**
   * The gap is beyond the holdings, so `còn thiếu` needs the reason attached —
   * otherwise the household is left looking for a funding step that will never
   * appear. Stated, never advised: it says the spend is out of reach today, not
   * what to do about it.
   */
  const shortfallNote =
    result?.assetSale || verdict.kind === 'canCover' || verdict.kind === 'none'
      ? undefined
      : verdict.kind === 'noAssets'
        ? t('whatif.shortfall.noAssets', { amount: formatVndShort(shortfall) })
        : t('whatif.shortfall.beyondAssets', {
            amount: formatVndShort(shortfall),
            sellable: formatVndShort(verdict.sellable),
          })

  /**
   * `rerun` marks the calls that explore the answer already on screen rather
   * than asking a new question: adding an asset sale to it, or taking one
   * away. Those cost no quota slot — the household asked once.
   */
  async function runWith(assetSale?: WhatIfAssetSale, rerun = false) {
    return await run({
      amount: amountValue,
      plannedDate,
      goalId: prefill.goalId,
      assetSale,
      rerun,
    })
  }

  /**
   * Not enough usable money means the household has one thing left to decide —
   * whether to sell something — so `Xem thử` lands them on THAT question
   * rather than on five blocks of consequence they have to scroll to find the
   * CTA in. The original answer is one button away (`assetSale.skip`).
   *
   * Not opened when selling could not close the gap anyway: the funding step
   * would be a form with no completable answer. That case is stated on the
   * result instead, from figures this client already has.
   */
  async function handleRun() {
    if (!canRun) return
    try {
      const next = await runWith()
      const gap = next?.liquidity?.shortfall ?? 0
      const gapVerdict = fundingVerdict(
        gap,
        sale.sellableTotal,
        sale.options.length,
        sale.isSellableTotalKnown,
      )
      /**
       * Only when selling could actually close the gap. Out of reach even
       * after selling everything, the household is not sent to a form with no
       * completable answer — the result leads with the reason instead
       * (`shortfallNote`, rendered above the blocks rather than inside them).
       */
      if (gapVerdict.kind === 'canCover') {
        setSaleWasOffered(true)
        openSaleStep(gap)
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('whatif.error')))
    }
  }

  function openSaleStep(gap: number) {
    sale.seedFromShortfall(gap)
    setSaleStepOpen(true)
  }

  function handleOpenSaleStep() {
    setSaleWasOffered(false)
    openSaleStep(shortfall)
  }

  /** Re-run with the sale included; stay on the step if it does not validate. */
  async function handleApplySale() {
    const assetSale = sale.validate()
    if (!assetSale) return
    try {
      // `undefined` means the quota gate opened the paywall instead of running.
      // Closing the step then would drop the household back on a stale answer
      // with no sign of why.
      const next = await runWith(assetSale, true)
      if (next) setSaleStepOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, t('whatif.error')))
    }
  }

  /** Undo the sale, keeping the draft so the CTA can restore it. */
  async function handleRemoveSale() {
    try {
      await runWith(undefined, true)
    } catch (error) {
      toast.error(getErrorMessage(error, t('whatif.error')))
    }
  }

  /**
   * Back to the fields — and the sale goes with the answer it belonged to.
   * Carrying "bán 300tr chứng khoán" into a question about a 5tr purchase would
   * silently answer a question the household did not ask.
   */
  function handleTryAnother() {
    sale.clear()
    setSaleStepOpen(false)
    setSaleWasOffered(false)
    reset()
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
  const showResult = Boolean(result) && !saleStepOpen
  /**
   * The funding step is a QUESTION, and this sheet has one place for questions.
   * Expanding it inside the result would put an asset picker and a money input
   * back under the hero — exactly the stacking answer-first removed.
   */
  const showSaleStep = Boolean(result) && saleStepOpen

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
          : showSaleStep
            ? 'max-w-[38.75rem] p-5 sm:p-7 md:rounded-[28px] md:shadow-[0_28px_90px_rgba(15,16,17,0.20)] [&>button]:size-11 [&>button]:p-0 [&>button]:hover:bg-wash [&>button>svg]:size-5'
            : undefined
      }
    >
      <ResponsiveDialogHeader>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <ResponsiveDialogTitle className={showSaleStep ? 't-title' : undefined}>
            {showSaleStep ? t('whatif.assetSale.title') : t('whatif.title')}
          </ResponsiveDialogTitle>

          {/* A tag, not a sentence: the count belongs beside the title where it
              is read once on open, and the full wording stays in `title` for
              anyone who wants it. Amber when the runs are gone — that state
              stops the next question, so it is not neutral metadata. Hidden on
              the result and sale steps: nothing there spends a run. */}
          {quota && !showResult && !showSaleStep ? (
            <span
              title={
                quota.isExhausted
                  ? t('whatif.quota.exhausted', { limit: quota.limit })
                  : quota.isLastOne
                    ? t('whatif.quota.lastOne')
                    : t('whatif.quota.remaining', { count: quota.remaining })
              }
              className={cn(
                'inline-flex shrink-0 items-center rounded-pill px-2.5 py-1 t-caption',
                // Amber ink on the card surface, not on `attention-soft`:
                // that pairing is 4.4:1, under AA for 12px text.
                quota.isExhausted
                  ? 'bg-card font-medium text-attention-ink ring-1 ring-attention'
                  : 'bg-wash text-ink2',
              )}
            >
              {quota.isExhausted
                ? t('whatif.quota.badgeExhausted')
                : t('whatif.quota.badge', { count: quota.remaining })}
            </span>
          ) : null}
        </div>
        {/*
          The form state carries NO visible description: "Không lưu thay đổi"
          was reassurance nobody asked for, and it pushed the first field down
          for a sentence read once and never again.

          It stays mounted `sr-only` rather than being dropped, because Radix
          warns when a dialog has no description and the title alone does not
          say what the sheet does. Once there is an answer the slot earns its
          place back — it holds the question the result belongs to.
        */}
        <ResponsiveDialogDescription
          className={showResult || showSaleStep ? undefined : 'sr-only'}
        >
          {showSaleStep
            ? t('whatif.assetSale.description')
            : showResult
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
            ? '-mx-6 min-h-0 flex-1 overflow-y-auto scrollbar-inset bg-canvas px-6 py-4'
            : showSaleStep
              // `pr-*` + matching `-mr-*`: the scrollbar rides in a gutter of
              // its own instead of sitting flush against the cards, while the
              // content keeps the dialog's own padding grid.
              ? 'mt-1 -mr-2 max-h-[60vh] overflow-y-auto pr-3'
              : 'mt-2 max-h-[60vh] overflow-y-auto'
        }
      >
        {showSaleStep ? (
          <div>
            <WhatIfAssetSaleStep sale={sale} shortfall={shortfall} />
          </div>
        ) : showResult ? (
          <WhatIfResultBlocks
            result={result!}
            onTryAssetSale={
              // Offered only when selling could actually close the gap — a
              // picker whose every option leaves them short is not an offer.
              saleCouldCover && !result!.assetSale ? handleOpenSaleStep : undefined
            }
            shortfallNote={shortfallNote}
          />
        ) : (
          <div className="space-y-5">
            <WhatIfField
              label={t('whatif.form.amount')}
              htmlFor="whatif-amount"
              trailing={<span className="shrink-0 t-body-sm text-ink2">đ</span>}
              error={amountError}
            >
              <EventMoneyInput
                id="whatif-amount"
                value={amount}
                onChange={setAmount}
                placeholder="0"
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

            {/* How many runs are left, at every level — not only near the
                ceiling. Without it the household cannot tell whether to spend
                one on a rough question. Phrased as what remains, never as what
                has been used. `null` for premium and while loading. */}
          </div>
        )}
      </div>

      {/* The shell changes shape per step, and the sticky bar's full-bleed
          margins have to match whatever padding that shell is wearing: the
          result view is `overflow-hidden` with none of its own, and the sale
          step overrides to `p-5 sm:p-7`. */}
      <ResponsiveDialogFooter
        fullBleed={showResult || showSaleStep}
        className={
          showResult
            ? 'px-6 py-3'
            : showSaleStep
              ? 'px-5 py-3 sm:px-7'
              : undefined
        }
      >
        {showSaleStep ? (
          <>
            {/*
              The step is reached two ways now, and each needs its own way out.
              Arrived automatically (nobody asked to sell), the exit is a
              decision — "show me the answer without selling" — so it says so.
              Arrived from the result's CTA, it is a plain Back. Either way the
              previous answer is still in the mutation cache, so leaving
              re-runs nothing.
            */}
            <Button variant="ghost" onClick={() => setSaleStepOpen(false)}>
              {t(saleWasOffered ? 'whatif.assetSale.skip' : 'whatif.assetSale.back')}
            </Button>
            <Button onClick={handleApplySale} disabled={isRunning}>
              {isRunning ? t('whatif.actions.running') : t('whatif.assetSale.apply')}
            </Button>
          </>
        ) : showResult ? (
          <>
            {/* Editing the figures means going back to them — there are no
                fields on screen to re-run against. */}
            <Button variant="ghost" onClick={handleTryAnother}>
              {t('whatif.actions.tryAnother')}
            </Button>
            {result!.assetSale ? (
              <Button variant="ghost" onClick={handleRemoveSale} disabled={isRunning}>
                {t('whatif.assetSale.remove')}
              </Button>
            ) : null}
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
