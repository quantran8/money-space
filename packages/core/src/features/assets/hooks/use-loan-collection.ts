import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAssets } from '#/features/assets/hooks/use-assets'
import { todayIso } from '#/features/assets/model/assets-form'
import { computeCurrentValue, isWalletAssetType, type Asset } from '#/features/assets/model/assets'
import { useEventCategories } from '#/features/events/hooks/use-event-categories'
import { useEvents } from '#/features/events/hooks/use-events'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { parseRawMoney } from '#/shared/lib/number-format'
import { notify } from '#/shared/notify'

export type LoanCollectionWalletOption = { value: string; label: string; balance?: number }

/** Mark a loan_receivable as repaid in full. See memory/loan-receivable.md. */
export function useLoanCollection() {
  const { t } = useTranslation()
  const { assets } = useAssets()
  const { createEvent } = useEvents()
  const { categories } = useEventCategories()

  const debtCategoryId = useMemo(() => {
    const matches = categories.filter((category) => category.code === 'debt')
    const own = matches.find((category) => category.householdId !== null)
    return (own ?? matches[0])?.id ?? ''
  }, [categories])

  // Cash wallets first: repaid loans usually come back in cash.
  const walletOptions = useMemo<LoanCollectionWalletOption[]>(
    () =>
      assets
        .filter((asset) => isWalletAssetType(asset.type) && asset.status !== 'sold')
        .sort((a, b) => Number(b.type === 'cash') - Number(a.type === 'cash'))
        .map((asset) => ({ value: asset.id, label: asset.name, balance: asset.currentValue })),
    [assets],
  )

  const [loan, setLoan] = useState<Asset | null>(null)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [walletId, setWalletId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [note, setNote] = useState('')

  function openCollection(asset: Asset) {
    const value = computeCurrentValue(asset, todayIso()) ?? 0
    setLoan(asset)
    setAmount(String(Math.max(0, Math.round(value))))
    setWalletId(walletOptions[0]?.value ?? '')
    setDate(todayIso())
    setNote('')
    setOpen(true)
  }

  const parsedAmount = parseRawMoney(amount)
  const canSubmit =
    !!loan && !!walletId && !!date && Number.isFinite(parsedAmount) && parsedAmount > 0

  async function submit() {
    if (!loan || !canSubmit) return
    try {
      await createEvent.mutateAsync({
        type: 'loan_collection',
        amount: parsedAmount,
        categoryId: debtCategoryId,
        isoDate: date,
        fromAssetId: loan.id,
        toAssetId: walletId,
        note: note.trim() || t('assets.loanCollection.defaultNote', { name: loan.name }),
      })
      notify.success(t('assets.loanCollection.done'))
      setOpen(false)
    } catch (error) {
      notify.error(getErrorMessage(error, t('assets.loanCollection.failed')))
    }
  }

  return {
    loan,
    open,
    setOpen,
    openCollection,
    amount,
    setAmount,
    walletId,
    setWalletId,
    date,
    setDate,
    note,
    setNote,
    walletOptions,
    canSubmit,
    isSubmitting: createEvent.isPending,
    submit,
  }
}
