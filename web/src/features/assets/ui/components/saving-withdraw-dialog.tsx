import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  computeSavingEarly,
  computeSavingOnTime,
  type CalculationTerm,
} from '@money-space/core/features/assets/model/assets'
import { formatVndExact } from '@money-space/core/shared/lib/format-money'

type SavingWithdrawDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetName: string
  term: CalculationTerm
  /** Today, so the dialog and the server agree on early vs on-time. */
  asOf: string
  isSubmitting: boolean
  onConfirm: () => void | Promise<void>
}

/**
 * Tất toán a saving deposit.
 *
 * Not a `ConfirmDialog`: the figure is the whole point. Breaking a passbook
 * early costs real money — the contracted rate is void and the bank pays the
 * non-term rate instead — and a household cannot weigh that from a yes/no
 * prompt. The same three lines the form promised on creation are shown again
 * here, computed from the same functions, so the number that appears now cannot
 * disagree with the one they were quoted.
 */
export function SavingWithdrawDialog({
  open,
  onOpenChange,
  assetName,
  term,
  asOf,
  isSubmitting,
  onConfirm,
}: SavingWithdrawDialogProps) {
  const { t } = useTranslation()
  const [isConfirming, setIsConfirming] = useState(false)

  const matured = !!term.maturityDate && asOf >= term.maturityDate
  // Months elapsed drive the non-term interest; mirrors the server's
  // `computeSavingSettlement` so the preview matches what actually happens.
  const elapsedMonths = Math.max(
    0,
    Math.floor(
      (new Date(asOf).getTime() - new Date(term.startDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    ),
  )
  const breakdown = matured
    ? computeSavingOnTime(term)
    : computeSavingEarly(term, elapsedMonths)
  const payout = Math.max(0, breakdown.total)
  // What holding on would have paid, so the cost of breaking early is stated in
  // money rather than implied.
  const onTime = computeSavingOnTime(term)
  const forgone = matured ? 0 : Math.max(0, onTime.total - payout)

  async function handleConfirm() {
    try {
      setIsConfirming(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsConfirming(false)
    }
  }

  const busy = isConfirming || isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="t-subhead">
            {t(matured ? 'assets.withdraw.titleMatured' : 'assets.withdraw.titleEarly')}
          </DialogTitle>
          <DialogDescription className="t-body-sm text-ink2">
            {t('assets.withdraw.description', { name: assetName })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[14px] bg-accent-soft px-5 py-5">
          <p className="t-caption-sm font-medium text-ink3">
            {t('assets.withdraw.payoutLabel')}
          </p>
          <p className="money-number mt-2 t-figure text-ink">{formatVndExact(payout)}</p>

          <div className="mt-4 space-y-2 border-t border-divider pt-4">
            <Row label={t('assets.withdraw.principal')} value={breakdown.principal} />
            <Row
              label={t(
                breakdown.interest < 0
                  ? 'assets.withdraw.clawback'
                  : 'assets.withdraw.interest',
              )}
              value={breakdown.interest}
            />
          </div>

          {/* §22.11 — the consequence, in money, before the action. */}
          {forgone > 0 ? (
            <p className="mt-4 t-caption leading-[1.5] text-ink2">
              {t('assets.withdraw.forgone', { amount: formatVndExact(forgone) })}
            </p>
          ) : null}
        </div>

        <p className="t-caption leading-[1.5] text-ink3">
          {t('assets.withdraw.becomesAccount')}
        </p>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" disabled={busy} onClick={handleConfirm}>
            {busy ? t('assets.withdraw.submitting') : t('assets.withdraw.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  const sign = value < 0 ? '-' : ''
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 t-body-sm text-ink2">{label}</span>
      <span className="num shrink-0 t-body-sm text-ink">
        {sign}
        {formatVndExact(Math.abs(value))}
      </span>
    </div>
  )
}
