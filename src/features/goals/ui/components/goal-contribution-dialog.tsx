import { useMemo, useState } from 'react'
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
import { MoneyInput } from '@/components/ui/number-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GoalItem } from '@/features/goals/model/goals'
import { parseAmount } from '@/features/goals/model/goals'
import { formatAmount, goalAmount } from '@/features/goals/model/goals-form'

export type ContributionWalletOption = {
  value: string
  label: string
  name: string
  balance: number
}

type GoalContributionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: GoalItem
  amount: string
  onAmountChange: (value: string) => void
  sourceId: string
  onSourceChange: (value: string) => void
  walletOptions: ContributionWalletOption[]
  isSubmitting: boolean
  onSubmit: () => Promise<boolean>
}

export function GoalContributionDialog({ open, onOpenChange, goal, amount, onAmountChange, sourceId, onSourceChange, walletOptions, isSubmitting, onSubmit }: GoalContributionDialogProps) {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const numericAmount = parseAmount(amount)
  const source = useMemo(() => walletOptions.find((option) => option.value === sourceId), [sourceId, walletOptions])
  const exceedsBalance = Boolean(source && numericAmount > source.balance)
  const amountError = submitted && numericAmount <= 0
    ? t('goals.contribution.amountPositive')
    : exceedsBalance && source
      ? t('goals.contribution.balanceError', { name: source.name, balance: formatAmount(source.balance) })
      : null

  function handleOpenChange(next: boolean) {
    if (!next) setSubmitted(false)
    onOpenChange(next)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!goal || !source || numericAmount <= 0 || exceedsBalance) return
    const saved = await onSubmit()
    if (saved) handleOpenChange(false)
  }

  const current = goalAmount(goal?.currentAmount)
  const target = goalAmount(goal?.targetAmount)
  const next = Math.min(target, current + numericAmount)
  const progress = target > 0 ? Math.round((next / target) * 100) : 0
  const remainingBalance = source ? Math.max(0, source.balance - numericAmount) : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="grid max-h-[90dvh] max-w-[440px] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0">
        <DialogHeader className="px-5 pb-4 pt-5 pr-16 text-left">
          <DialogTitle className="text-[16px] font-medium tracking-[-0.01em]">{t('goals.contribution.title')}</DialogTitle>
          <DialogDescription className="mt-1 text-[11px] text-ink3">{goal?.name ?? '—'}</DialogDescription>
        </DialogHeader>

        <form className="grid min-h-0 grid-rows-[1fr_auto]" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 space-y-4 overflow-y-auto px-5 pb-5">
            <div>
              <label htmlFor="goal-contribution-source" className="mb-2 block text-[13px] text-ink2">{t('goals.contribution.sourceLabel')}</label>
              <Select value={sourceId} onValueChange={onSourceChange} disabled={walletOptions.length === 0}>
                <SelectTrigger id="goal-contribution-source" aria-invalid={submitted && !source}>
                  <SelectValue placeholder={walletOptions.length === 0 ? t('goals.actions.sourceEmpty') : t('goals.actions.sourcePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {walletOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {submitted && !source ? <p className="mt-1.5 text-[12px] text-alert">{t('goals.actions.sourceRequired')}</p> : null}
            </div>

            <div>
              <label htmlFor="goal-contribution-amount" className="mb-2 block text-[13px] text-ink2">{t('goals.contribution.amountLabel')}</label>
              <div className="relative">
                <MoneyInput id="goal-contribution-amount" value={amount} onChange={onAmountChange} placeholder={t('goals.contribution.amountPlaceholder')} className="num pr-14 font-medium" aria-invalid={Boolean(amountError)} autoFocus />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-ink3">₫</span>
              </div>
              {amountError ? <p className="mt-1.5 text-[12px] text-alert">{amountError}</p> : null}
            </div>

            <div className="rounded-xl bg-accent-soft px-4 py-4 text-[13px] leading-6 text-ink2">
              {!source ? t('goals.contribution.previewEmpty') : numericAmount <= 0 ? t('goals.contribution.sourceBalance', { balance: formatAmount(source.balance) }) : exceedsBalance ? t('goals.contribution.previewInsufficient') : (
                <>
                  <p>{t('goals.contribution.previewGoal', { name: goal?.name ?? '', current: formatAmount(next), target: formatAmount(target), progress })}</p>
                  <p>{t('goals.contribution.previewSource', { name: source.name, balance: formatAmount(remainingBalance) })}</p>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="items-center border-t border-black/[0.06] px-5 py-4 sm:justify-between">
            <p className="hidden text-left text-[11px] text-ink3 sm:block">{t('goals.contribution.journalNote')}</p>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="ghost" className="h-10 px-4 text-[13px] text-ink2" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
              <Button type="submit" className="h-10 px-4 text-[13px]" disabled={isSubmitting || walletOptions.length === 0}>{isSubmitting ? t('goals.actions.contributing') : t('goals.contribution.submit')}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
