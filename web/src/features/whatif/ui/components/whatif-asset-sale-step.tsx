import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  EventDecimalInput,
  EventMoneyInput,
} from '@/components/ui/event-field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { useWhatIfAssetSale } from '@money-space/core/features/whatif/hooks/use-whatif-asset-sale'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

function AssetSaleField({
  label,
  htmlFor,
  meta,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  meta?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <label htmlFor={htmlFor} className="block t-caption font-medium text-ink2">
          {label}
        </label>
        {meta}
      </div>
      {children}
      {error ? (
        <p className="mt-2 px-1 t-body-sm font-medium text-alert-ink">{error}</p>
      ) : null}
    </div>
  )
}

function AssetSaleInputShell({
  error,
  children,
}: {
  error?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-3 rounded-control border bg-card px-3.5',
        'transition-[border-color,box-shadow] duration-150',
        error
          ? 'border-alert-ink shadow-[0_0_0_3px_var(--alert-tint)]'
          : 'border-committed focus-within:border-data-primary focus-within:shadow-[0_0_0_3px_rgba(115,164,215,0.16)]',
      )}
    >
      {children}
    </div>
  )
}

/**
 * The optional funding step: which asset to sell, and how much of it.
 *
 * **Not the wallet picker what-if bans.** That ban is about which account the
 * SPEND comes out of — routing the engine does better, from the household's own
 * goal ranking, and which is unchanged here. This asks what to convert INTO
 * usable money, which the engine cannot answer: gold vs stocks is a preference.
 * It is optional, it comes second, and it only appears once an answer has shown
 * a shortfall. See [[what-if]].
 *
 * A market asset is sold in its own unit (6 chỉ, not "86,4tr of gold"), and the
 * proceeds land in a wallet the household names — as a real sale does. That
 * wallet picker is not the banned one either: it decides which goals the cash
 * sits in front of, which the engine cannot guess. Nothing is ever recorded.
 */
export function WhatIfAssetSaleStep({
  sale,
  shortfall,
}: {
  sale: ReturnType<typeof useWhatIfAssetSale>
  shortfall: number
}) {
  const { t } = useTranslation()
  const { options, walletOptions, selected, draft, errors, remainingAfterSale } = sale

  if (options.length === 0) {
    return <p className="t-body-sm text-ink2">{t('whatif.assetSale.empty')}</p>
  }

  /*
    The step now opens straight off `Xem thử`, so it has to say WHY it is on
    screen. Without this line the household lands on an asset picker holding a
    pre-filled quantity and no statement of the gap it was filled to cover.
  */
  const lead =
    shortfall > 0 ? (
      <p className="t-body-sm text-alert-ink">
        {t('whatif.shortfall.lead', { amount: formatVndShort(shortfall) })}
      </p>
    ) : null

  // Group headings, in the order core already sorted them into.
  const groups: { label: string; items: typeof options }[] = []
  for (const option of options) {
    const last = groups[groups.length - 1]
    if (last && last.label === option.group) last.items.push(option)
    else groups.push({ label: option.group, items: [option] })
  }

  return (
    <div className="space-y-5">
      {lead}

      <AssetSaleField
        label={t('whatif.assetSale.asset')}
        htmlFor="whatif-sale-asset"
        error={errors.assetId}
      >
        <Select value={draft.assetId} onValueChange={sale.setAssetId}>
          <SelectTrigger
            id="whatif-sale-asset"
            aria-invalid={Boolean(errors.assetId)}
            className="t-body"
          >
            <SelectValue placeholder={t('whatif.assetSale.assetPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.items.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t('whatif.assetSale.optionValue', {
                      name: option.label,
                      value: formatVndShort(option.currentValue),
                    })}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </AssetSaleField>

      {/* A market asset is sold in ITS OWN UNIT — you cannot sell 86,4tr of
          gold, you sell 6 chỉ. The quantity is pre-filled with enough to cover
          the shortfall; the money figure follows from it. */}
      {selected?.isMarket ? (
        <AssetSaleField
          label={t('whatif.assetSale.quantity')}
          htmlFor="whatif-sale-quantity"
          error={errors.quantity}
          meta={
            <span className="num t-caption text-right text-ink3">
              {t('whatif.assetSale.holdingQuantity', {
                quantity: selected.heldQuantity,
                unit: selected.unit,
              })}
              {selected.unitPrice > 0
                ? ` · ${t('whatif.assetSale.unitPrice', {
                    price: formatVndShort(selected.unitPrice),
                    unit: selected.unit,
                  })}`
                : ''}
            </span>
          }
        >
          <AssetSaleInputShell error={errors.quantity}>
            <EventDecimalInput
              id="whatif-sale-quantity"
              value={draft.quantity}
              onChange={sale.setQuantity}
              placeholder="0"
              className="min-w-0 flex-1 font-light"
            />
            <span className="shrink-0 t-body-sm text-ink2">{selected.unit}</span>
          </AssetSaleInputShell>
        </AssetSaleField>
      ) : (
        <AssetSaleField
          label={t('whatif.assetSale.amount')}
          htmlFor="whatif-sale-amount"
          error={errors.amount}
          meta={
            selected ? (
              <span className="money-number t-caption text-right text-ink3">
                {t('whatif.assetSale.holdingValue', {
                  value: formatVndShort(selected.currentValue),
                })}
              </span>
            ) : null
          }
        >
          <AssetSaleInputShell error={errors.amount}>
            <EventMoneyInput
              id="whatif-sale-amount"
              value={draft.amount}
              onChange={sale.setAmount}
              placeholder="0"
              className="font-light"
            />
            <span className="shrink-0 t-body-sm text-ink2">đ</span>
          </AssetSaleInputShell>
        </AssetSaleField>
      )}

      {/* Which account the money lands in — a real sale names one, and it
          decides which goals the cash is sitting in front of. */}
      <AssetSaleField
        label={t('whatif.assetSale.wallet')}
        htmlFor="whatif-sale-wallet"
        error={errors.toAssetId}
      >
        <Select value={draft.toAssetId} onValueChange={sale.setToAssetId}>
          <SelectTrigger
            id="whatif-sale-wallet"
            aria-invalid={Boolean(errors.toAssetId)}
            className="t-body"
          >
            <SelectValue placeholder={t('whatif.assetSale.walletPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {walletOptions.map((wallet) => (
              <SelectItem key={wallet.value} value={wallet.value}>
                {t('whatif.assetSale.walletOption', {
                  name: wallet.label,
                  balance: formatVndShort(wallet.balance),
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AssetSaleField>

      {/* Put the answer before secondary caveats: the household can scan what
          the draft raises, what remains, and whether it closes the known gap. */}
      {selected && remainingAfterSale !== null && !errors.amount && !errors.quantity ? (
        <section aria-live="polite" className="pt-1">
          <div className="border-t border-divider pt-5">
            <div className="grid gap-5 sm:grid-cols-[1.25fr_1fr] sm:gap-8">
              <div>
                <p className="t-body-sm text-ink2">
                  {t('whatif.assetSale.proceedsEstimate')}
                </p>
                <p className="money-number mt-1 t-metric">
                  {formatVndShort(sale.proceeds)}
                </p>
              </div>
              <div>
                <p className="t-body-sm text-ink2">
                  {t('whatif.assetSale.remaining', { name: selected.label })}
                </p>
                <p className="money-number mt-1 t-subtitle">
                  {formatVndShort(remainingAfterSale)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 t-body-sm text-ink2">
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  sale.proceeds >= shortfall ? 'bg-positive' : 'bg-attention',
                )}
              />
              <span>
                {t(
                  sale.proceeds >= shortfall
                    ? 'whatif.assetSale.coversShortfall'
                    : 'whatif.assetSale.doesNotCoverShortfall',
                )}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <p className="t-caption text-ink3">{t('whatif.assetSale.noFee')}</p>
    </div>
  )
}
