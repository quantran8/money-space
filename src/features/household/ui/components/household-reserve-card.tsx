import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EventField, EventFieldInput, EventMoneyInput } from '@/components/ui/event-field'
import { useReserves } from '@/features/reserves/hooks/use-reserves'
import { getErrorMessage } from '@/shared/lib/get-error-message'
import { formatVndShort } from '@/shared/lib/format-money'
import { parseRawMoney } from '@/shared/lib/number-format'

/**
 * The reserve card (§19C).
 *
 * A reserve is a constraint on the forecast, not an account — nothing is moved
 * anywhere. Only `active` reserves are subtracted from flexible money, which is
 * why the total shown here is `activeReserveTotal`.
 */
export function HouseholdReserveCard() {
  const { t } = useTranslation()
  const { reserves, activeReserveTotal, isLoading, createReserve, deleteReserve } =
    useReserves()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  const amountValue = parseRawMoney(amount)
  const canAdd = name.trim().length > 0 && Number.isFinite(amountValue) && amountValue > 0

  async function handleAdd() {
    if (!canAdd) return
    try {
      await createReserve.mutateAsync({ name: name.trim(), amount: amountValue })
      setName('')
      setAmount('')
    } catch (error) {
      toast.error(getErrorMessage(error, t('reserve.addFailed')))
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="section-title text-xl font-semibold">{t('reserve.title')}</h2>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('reserve.description')}
          </p>
        </div>
        <p className="money-number shrink-0 text-2xl font-semibold">
          {formatVndShort(activeReserveTotal)}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 h-16 animate-pulse rounded-2xl bg-muted" />
      ) : reserves.length === 0 ? (
        <p className="mt-5 text-sm text-[hsl(var(--muted-foreground))]">
          {t('reserve.empty')}
        </p>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {reserves.map((reserve) => (
            <div
              key={reserve.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{reserve.name}</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {t(`reserve.status.${reserve.status}`)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="money-number text-sm font-semibold">
                  {formatVndShort(reserve.amount)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('common.remove')}
                  disabled={deleteReserve.isPending}
                  onClick={() => deleteReserve.mutate(reserve.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <EventField label={t('reserve.form.name')} htmlFor="reserve-name">
          <EventFieldInput
            id="reserve-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('reserve.form.namePlaceholder')}
          />
        </EventField>
        <EventField label={t('reserve.form.amount')} htmlFor="reserve-amount">
          <EventMoneyInput
            id="reserve-amount"
            value={amount}
            onChange={setAmount}
            placeholder="0"
            className="text-[20px] sm:text-[20px]"
          />
        </EventField>
        <Button onClick={handleAdd} disabled={!canAdd || createReserve.isPending}>
          <Plus className="mr-2 size-4" />
          {t('reserve.form.add')}
        </Button>
      </div>
    </Card>
  )
}
