import { useTranslation } from 'react-i18next'

import {
  EventDecimalInput,
  EventField,
  EventMoneyInput,
  eventSelectTriggerClass,
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
}: {
  sale: ReturnType<typeof useWhatIfAssetSale>
}) {
  const { t } = useTranslation()
  const { options, walletOptions, selected, draft, errors, remainingAfterSale } = sale

  if (options.length === 0) {
    return <p className="t-body-sm text-ink2">{t('whatif.assetSale.empty')}</p>
  }

  // Group headings, in the order core already sorted them into.
  const groups: { label: string; items: typeof options }[] = []
  for (const option of options) {
    const last = groups[groups.length - 1]
    if (last && last.label === option.group) last.items.push(option)
    else groups.push({ label: option.group, items: [option] })
  }

  return (
    <div className="space-y-4">
      <EventField label={t('whatif.assetSale.asset')} error={errors.assetId}>
        <Select value={draft.assetId} onValueChange={sale.setAssetId}>
          <SelectTrigger className={eventSelectTriggerClass}>
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
      </EventField>

      {/* A market asset is sold in ITS OWN UNIT — you cannot sell 86,4tr of
          gold, you sell 6 chỉ. The quantity is pre-filled with enough to cover
          the shortfall; the money figure follows from it. */}
      {selected?.isMarket ? (
        <EventField
          label={t('whatif.assetSale.quantity')}
          htmlFor="whatif-sale-quantity"
          error={errors.quantity}
          trailing={<span className="t-body-sm text-ink2">{selected.unit}</span>}
        >
          <EventDecimalInput
            id="whatif-sale-quantity"
            value={draft.quantity}
            onChange={sale.setQuantity}
            placeholder="0"
          />
        </EventField>
      ) : (
        <EventField
          label={t('whatif.assetSale.amount')}
          htmlFor="whatif-sale-amount"
          error={errors.amount}
          trailing={<span className="t-body-sm text-ink2">đ</span>}
        >
          <EventMoneyInput
            id="whatif-sale-amount"
            value={draft.amount}
            onChange={sale.setAmount}
            placeholder="0"
          />
        </EventField>
      )}

      {/* Which account the money lands in — a real sale names one, and it
          decides which goals the cash is sitting in front of. */}
      <EventField label={t('whatif.assetSale.wallet')} error={errors.toAssetId}>
        <Select value={draft.toAssetId} onValueChange={sale.setToAssetId}>
          <SelectTrigger className={eventSelectTriggerClass}>
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
      </EventField>

      {selected ? (
        <div className="space-y-1">
          {selected.isMarket ? (
            <>
              <p className="t-caption text-ink3">
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
              </p>
              {/* The money the units come to — the arithmetic the household
                  would otherwise have to do in their head. */}
              {sale.proceeds > 0 && !errors.quantity ? (
                <p className="t-caption text-ink2">
                  {t('whatif.assetSale.proceeds', {
                    amount: formatVndShort(sale.proceeds),
                  })}
                </p>
              ) : null}
            </>
          ) : (
            <p className="t-caption text-ink3">
              {t('whatif.assetSale.holdingValue', {
                value: formatVndShort(selected.currentValue),
              })}
            </p>
          )}
          {/* What the goals hold of this asset, BEFORE committing to the sale —
              so the goal cost is a choice made knowingly, not a surprise. */}
          {selected.goalClaimedAmount > 0 ? (
            <p className="t-caption text-ink2">
              {t('whatif.assetSale.goalClaimed', {
                amount: formatVndShort(selected.goalClaimedAmount),
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Says the number was filled in for them and is theirs to change. */}
      {selected && sale.proceeds > 0 && !errors.quantity && !errors.amount ? (
        <p className="t-caption-sm text-ink3">{t('whatif.assetSale.estimated')}</p>
      ) : null}

      {selected && remainingAfterSale !== null && !errors.amount && !errors.quantity ? (
        <div className="rounded-[18px] bg-accent-tint px-5 py-4 t-body-sm">
          {t('whatif.assetSale.preview', {
            name: selected.label,
            before: formatVndShort(selected.currentValue),
            after: formatVndShort(remainingAfterSale),
            amount: formatVndShort(selected.currentValue - remainingAfterSale),
          })}
        </div>
      ) : null}

      <p className="t-caption text-ink3">{t('whatif.assetSale.noFee')}</p>
    </div>
  )
}
