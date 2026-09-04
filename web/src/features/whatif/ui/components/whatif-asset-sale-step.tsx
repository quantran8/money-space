import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import type { SellableAssetOption } from '@money-space/core/features/whatif/model/whatif-asset-sale'
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

/** Group headings, in the order core already sorted the options into. */
function groupOptions(options: SellableAssetOption[]) {
  const groups: { label: string; items: SellableAssetOption[] }[] = []
  for (const option of options) {
    const last = groups[groups.length - 1]
    if (last && last.label === option.group) last.items.push(option)
    else groups.push({ label: option.group, items: [option] })
  }
  return groups
}

/** One holding being sold: which asset, and how much of it. */
function SaleLine({
  line,
  index,
  groups,
  onRemove,
  onAssetChange,
  onQuantityChange,
  onAmountChange,
}: {
  line: ReturnType<typeof useWhatIfAssetSale>['lines'][number]
  index: number
  groups: ReturnType<typeof groupOptions>
  onRemove?: () => void
  onAssetChange: (assetId: string) => void
  onQuantityChange: (quantity: string) => void
  onAmountChange: (amount: string) => void
}) {
  const { t } = useTranslation()
  const { draft, option, errors, remainingAfterSale } = line
  const assetFieldId = `whatif-sale-asset-${draft.key}`
  const valueFieldId = `whatif-sale-value-${draft.key}`

  return (
    <div className="space-y-4 rounded-control border border-divider bg-card p-4">
      {/* The line's own header: what it is, and the one action that applies to
          it. Removal belongs here rather than beside the asset picker, where it
          read as an action on the dropdown. */}
      {onRemove ? (
        <div className="flex items-center justify-between gap-3">
          <span className="t-caption font-medium text-ink3">
            {t('whatif.assetSale.lineLabel', { index: index + 1 })}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('whatif.assetSale.removeLine', { index: index + 1 })}
            /* `alert` is the FILL token; `alert-ink` is the readable one, so the
               glyph on top of the fill takes it. */
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-alert text-white transition hover:opacity-80"
          >
            <Minus className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <AssetSaleField
            label={t('whatif.assetSale.asset')}
            htmlFor={assetFieldId}
            error={errors.assetId}
          >
            <Select value={draft.assetId} onValueChange={onAssetChange}>
              <SelectTrigger
                id={assetFieldId}
                aria-invalid={Boolean(errors.assetId)}
                className="t-body"
              >
                <SelectValue placeholder={t('whatif.assetSale.assetPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.items.map((candidate) => (
                      <SelectItem key={candidate.value} value={candidate.value}>
                        {t('whatif.assetSale.optionValue', {
                          name: candidate.label,
                          value: formatVndShort(candidate.currentValue),
                        })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </AssetSaleField>
        </div>
      </div>

      {/* A market asset is sold in ITS OWN UNIT — you cannot sell 86,4tr of
          gold, you sell 6 chỉ. The quantity is pre-filled with enough to cover
          the shortfall; the money figure follows from it. */}
      {option?.isMarket ? (
        <AssetSaleField
          label={t('whatif.assetSale.quantity')}
          htmlFor={valueFieldId}
          error={errors.quantity}
          meta={
            <span className="num t-caption text-right text-ink3">
              {t('whatif.assetSale.holdingQuantity', {
                quantity: option.heldQuantity,
                unit: option.unit,
              })}
              {option.unitPrice > 0
                ? ` · ${t('whatif.assetSale.unitPrice', {
                    price: formatVndShort(option.unitPrice),
                    unit: option.unit,
                  })}`
                : ''}
            </span>
          }
        >
          <AssetSaleInputShell error={errors.quantity}>
            <EventDecimalInput
              id={valueFieldId}
              value={draft.quantity}
              onChange={onQuantityChange}
              placeholder="0"
              className="min-w-0 flex-1 font-light"
            />
            <span className="shrink-0 t-body-sm text-ink2">{option.unit}</span>
          </AssetSaleInputShell>
        </AssetSaleField>
      ) : (
        <AssetSaleField
          label={t('whatif.assetSale.amount')}
          htmlFor={valueFieldId}
          error={errors.amount}
          meta={
            option ? (
              <span className="money-number t-caption text-right text-ink3">
                {t('whatif.assetSale.holdingValue', {
                  value: formatVndShort(option.currentValue),
                })}
              </span>
            ) : null
          }
        >
          <AssetSaleInputShell error={errors.amount}>
            <EventMoneyInput
              id={valueFieldId}
              value={draft.amount}
              onChange={onAmountChange}
              placeholder="0"
              className="font-light"
            />
            <span className="shrink-0 t-body-sm text-ink2">đ</span>
          </AssetSaleInputShell>
        </AssetSaleField>
      )}

      {option && remainingAfterSale !== null && !errors.amount && !errors.quantity ? (
        <p className="t-caption text-ink3">
          {t('whatif.assetSale.lineRemaining', {
            name: option.label,
            remaining: formatVndShort(remainingAfterSale),
            raised: formatVndShort(line.proceeds),
          })}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The optional funding step: which assets to sell, and how much of each.
 *
 * **Not the wallet picker what-if bans.** That ban is about which account the
 * SPEND comes out of — routing the engine does better, from the household's own
 * goal ranking, and which is unchanged here. This asks what to convert INTO
 * usable money, which the engine cannot answer: gold vs stocks is a preference.
 * It is optional, it comes second, and it only appears once an answer has shown
 * a shortfall. See [[what-if]].
 *
 * Several lines, one shared destination: no single holding need cover the gap,
 * and a household selling two things for one purchase banks the cash together.
 * A market asset is sold in its own unit (6 chỉ, not "86,4tr of gold"). That
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
  const { options, walletOptions, lines, errors } = sale

  if (options.length === 0) {
    return <p className="t-body-sm text-ink2">{t('whatif.assetSale.empty')}</p>
  }

  const groups = groupOptions(options)
  const covered = sale.proceeds >= shortfall

  return (
    <div className="space-y-5">
      {/*
        The step opens straight off `Xem thử`, so it has to say WHY it is on
        screen. Without this line the household lands on an asset picker holding
        a pre-filled quantity and no statement of the gap it was filled to cover.
      */}
      {shortfall > 0 ? (
        <p className="t-body-sm text-alert-ink">
          {t('whatif.shortfall.lead', { amount: formatVndShort(shortfall) })}
        </p>
      ) : null}

      <div className="space-y-3">
        {lines.map((line, index) => (
          <SaleLine
            key={line.draft.key}
            line={line}
            index={index}
            groups={groups}
            onRemove={lines.length > 1 ? () => sale.removeLine(line.draft.key) : undefined}
            onAssetChange={(assetId) => sale.setLineAssetId(line.draft.key, assetId)}
            onQuantityChange={(quantity) =>
              sale.setLineQuantity(line.draft.key, quantity)
            }
            onAmountChange={(amount) => sale.setLineAmount(line.draft.key, amount)}
          />
        ))}
      </div>

      {/* One holding is often not enough — 300tr of gold and 250tr of stocks
          against a 500tr gap. Offered, never pre-added. */}
      {sale.canAddLine ? (
        <Button variant="outline" size="sm" onClick={sale.addLine}>
          <Plus className="size-4" />
          {t('whatif.assetSale.addLine')}
        </Button>
      ) : null}

      {/* Which account the money lands in — a real sale names one, and it
          decides which goals the cash is sitting in front of. Shared by every
          line: two sales for one purchase are banked together. */}
      <AssetSaleField
        label={t('whatif.assetSale.wallet')}
        htmlFor="whatif-sale-wallet"
        error={errors.toAssetId}
      >
        <Select value={sale.draft.toAssetId} onValueChange={sale.setToAssetId}>
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
          the draft raises and whether it closes the known gap. */}
      {sale.proceeds > 0 ? (
        <section aria-live="polite" className="pt-1">
          <div className="border-t border-divider pt-5">
            <p className="t-body-sm text-ink2">
              {t('whatif.assetSale.proceedsEstimate')}
            </p>
            <p className="money-number mt-1 t-metric">
              {formatVndShort(sale.proceeds)}
            </p>

            <div className="mt-4 flex items-center gap-2 t-body-sm text-ink2">
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  covered ? 'bg-positive' : 'bg-attention',
                )}
              />
              <span>
                {t(
                  covered
                    ? 'whatif.assetSale.coversShortfall'
                    : 'whatif.assetSale.stillShort',
                  { amount: formatVndShort(Math.max(0, shortfall - sale.proceeds)) },
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
