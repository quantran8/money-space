import { useEffect, useRef, useState } from 'react'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DecimalField,
  Field,
  MoneyField,
  fieldControlReset,
  fieldShell,
} from '@/components/ui/form-22'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MarketPriceSection } from '@/features/assets/ui/components/market-price-section'
import type { AssetPurchaseForm } from '@money-space/core/features/assets/model/asset-quantity-form'
import {
  searchableAssetClassForType,
  type Asset,
} from '@money-space/core/features/assets/model/assets'
import { isWholeQuantityType } from '@money-space/core/features/assets/model/assets-form'
import { useMarketQuote } from '@money-space/core/features/assets/hooks/use-market-quote'
import { formatVndExact } from '@money-space/core/shared/lib/format-money'
import { parseRawDecimal, parseRawMoney } from '@money-space/core/shared/lib/number-format'

type WalletOption = { value: string; label: string; balance?: number }

type AssetPurchaseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  currentQuantity: number
  walletOptions: WalletOption[]
  form: UseFormReturn<AssetPurchaseForm>
  isSubmitting: boolean
  onSubmit: () => void
}

/**
 * Buying more of a position the household already holds.
 *
 * A purchase, never a re-typed number: the wallet pays and the cost basis
 * re-averages. That is why the summary below the fields is part of the form and
 * not decoration — the new average is the figure P&L will be measured against
 * afterwards, and it is not one anybody can do in their head from the two
 * numbers they just typed.
 */
export function AssetPurchaseDialog({
  open,
  onOpenChange,
  asset,
  currentQuantity,
  walletOptions,
  form,
  isSubmitting,
  onSubmit,
}: AssetPurchaseDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    setValue,
    formState: { errors },
  } = form

  const unit = asset?.marketPosition?.unit ?? ''
  const wholeOnly = asset ? isWholeQuantityType(asset.type) : false
  const holdingLabel = `${currentQuantity} ${unit}`.trim()

  // Set by the refresh action: turns the quote query on for a holding whose
  // embedded price had made it unnecessary.
  const [refreshed, setRefreshed] = useState(false)

  const assetClass = asset ? searchableAssetClassForType(asset.type) : undefined
  const position = asset?.marketPosition
  // Ask crypto for its quote in đồng — the price field is VND, and crypto
  // quotes in USD upstream.
  //
  // For a stock, the position's OWN stored currency: the backend decides VN vs
  // foreign from `market`, and falls back to the requested currency when the
  // position has none (many do — `market` is only set by the symbol picker, so
  // anything entered before it, or by hand, has `market: null`). Without this a
  // VN holding like FPT routes to Twelve Data as a foreign equity, which cannot
  // quote it, and the price section never appears.
  //
  // Safe because it echoes what the position is already denominated in rather
  // than asserting a currency: a USD-denominated holding still asks for USD, so
  // the Twelve Data relabelling trap — a USD figure tagged `VND`, understating
  // cost basis ~26,000x — is not reachable from here. Every path that writes
  // into the đồng field re-checks for VND before doing so.
  const quoteCurrency =
    assetClass === 'crypto' ? 'VND' : (position?.quoteCurrency ?? undefined)

  // `/assets` already carries today's price for every held instrument, joined
  // in server-side from one batched call. Prefer it: the common case then costs
  // no request at all.
  //
  // The dedicated quote endpoint stays for what the embedded figure cannot do —
  // it prices in the instrument's OWN currency, so a crypto holding arrives in
  // USD and is unusable in a đồng field. That endpoint converts server-side (the
  // only place a real FX rate exists), so it is asked ONLY when the embedded
  // price is missing or not VND, and for a user-driven refresh.
  const embedded =
    position?.marketPrice !== undefined && position.marketPriceAt
      ? {
          assetClass: position.assetClass,
          symbol: position.symbol,
          price: position.marketPrice,
          unit: position.unit,
          quoteCurrency: position.marketPriceCurrency ?? position.quoteCurrency,
          priceTime: position.marketPriceAt,
          source: 'assets',
        }
      : null
  const needsFetch = !embedded || embedded.quoteCurrency !== 'VND'

  const {
    quote: fetched,
    isLoading,
    isFetching,
    isUnavailable,
    refetch,
  } = useMarketQuote(
    needsFetch || refreshed ? assetClass : undefined,
    position?.symbol ?? '',
    position?.market,
    quoteCurrency,
  )

  // A fetched figure wins once there is one — it is either the conversion the
  // embedded price could not do, or the fresher number the user just asked for.
  const quote = fetched ?? embedded

  // Apply a price that arrived AFTER the form was seeded.
  //
  // The embedded price is already seeded by `useAssetQuantity`'s reset — it has
  // to be, because that reset runs in a parent effect and React flushes child
  // effects first, so anything written here on mount would be overwritten a
  // moment later. This covers only what the reset could not know: the converted
  // quote for a non-VND holding, and the figure a refresh just fetched.
  //
  // Keyed by price so it fires once per distinct figure: a number the user
  // types survives a re-render, while a refresh that genuinely moved the price
  // still lands. The key clears on close so the next opening starts fresh.
  const seededFor = useRef<string | null>(null)
  useEffect(() => {
    if (!open) {
      seededFor.current = null
      return
    }
    if (!fetched || fetched.quoteCurrency !== 'VND') return
    const key = `${fetched.assetClass}:${fetched.symbol}:${fetched.price}`
    if (seededFor.current === key) return
    seededFor.current = key
    setValue('unitPrice', String(Math.round(fetched.price)), {
      shouldDirty: true,
      shouldValidate: true,
    })
    // `setValue` is a stable form helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fetched])

  /**
   * Resets the refresh opt-in on close, so the next opening starts from the
   * embedded price again rather than firing a request on mount. Done here
   * rather than in the effect above: setting state from an effect body is a
   * cascading render, and closing is a real event with a handler for it.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setRefreshed(false)
    onOpenChange(nextOpen)
  }

  function handleRefresh() {
    // Enables the query when the embedded price made it unnecessary, so the
    // first refresh on a VND holding actually issues a request.
    setRefreshed(true)
    void refetch()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[88dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <ResponsiveDialogHeader className="px-5 pb-5 pr-16 pt-5 text-left sm:px-8 sm:pr-16 sm:pt-7">
          <ResponsiveDialogTitle className="t-subhead font-medium tracking-[-0.015em]">
            {t('assets.purchase.dialogTitle', { name: asset?.name ?? '' })}
          </ResponsiveDialogTitle>
          {/* What is being bought into, and how much of it is already held —
              the two facts the numbers below are relative to. */}
          <ResponsiveDialogDescription className="mt-1 t-body-sm text-ink3">
            {t('assets.purchase.dialogSubtitle', {
              type: asset ? t(`options.assetType.${asset.type}`) : '',
              quantity: holdingLabel,
            })}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="overflow-y-auto px-5 pb-5 sm:px-8 sm:pb-7"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="space-y-4">
            <MarketPriceSection
              quote={quote}
              isLoading={isLoading}
              isFetching={isFetching}
              isUnavailable={isUnavailable}
              unit={unit}
              onRefresh={handleRefresh}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <DecimalField
                    id="asset-purchase-quantity"
                    label={t('assets.purchase.quantity')}
                    value={field.value}
                    // A share is indivisible: the decimal part is dropped as it
                    // is typed rather than accepted and rejected on submit.
                    onChange={
                      wholeOnly ? (raw) => field.onChange(raw.split(',')[0]) : field.onChange
                    }
                    onBlur={field.onBlur}
                    placeholder="0"
                    suffix={unit || undefined}
                    error={errors.quantity?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="unitPrice"
                render={({ field }) => (
                  <MoneyField
                    id="asset-purchase-unit-price"
                    label={t('assets.purchase.unitPrice')}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.unitPrice?.message}
                  />
                )}
              />
            </div>

            {/* Empty is a real answer, not a missing one: the units arrived
                without the household paying for them (a gift, a stock
                dividend), so no balance moves and net worth rises. */}
            <Controller
              control={control}
              name="fundingAssetId"
              render={({ field }) => (
                <Field
                  label={t('assets.purchase.fundingAsset')}
                  error={errors.fundingAssetId?.message}
                >
                  <div className={fieldShell}>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldControlReset}>
                        <SelectValue placeholder={t('assets.purchase.fundingAssetNone')} />
                      </SelectTrigger>
                      <SelectContent>
                        {walletOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {/* The balance rides along so the choice can be made
                                here, rather than by trial and error on save. */}
                            {option.balance === undefined
                              ? option.label
                              : `${option.label} · ${formatVndExact(option.balance)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
              )}
            />

            <PurchaseSummary
              control={control}
              asset={asset}
              currentQuantity={currentQuantity}
              unit={unit}
            />
          </div>

          {/* No Cancel: the dialog is dismissed by its own close control and by
              Esc, so a second button here would only compete with the one that
              does something. */}
          <ResponsiveDialogFooter className="mt-5 gap-2.5 sm:items-center sm:justify-end">
            <Button type="submit" className="px-5" disabled={isSubmitting}>
              {t('assets.purchase.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/**
 * What the household is about to spend, and what the position looks like after.
 *
 * Deliberately inline rows rather than a nested card (§8 — nothing floats): the
 * answer belongs to the fields above it, so it sits under a divider in the same
 * surface. Renders nothing until both numbers are real, because a total of
 * "0 đ" while someone is still typing states something false.
 */
function PurchaseSummary({
  control,
  asset,
  currentQuantity,
  unit,
}: {
  control: UseFormReturn<AssetPurchaseForm>['control']
  asset: Asset | null
  currentQuantity: number
  unit: string
}) {
  const { t } = useTranslation()
  const rawQuantity = useWatch({ control, name: 'quantity' })
  const rawUnitPrice = useWatch({ control, name: 'unitPrice' })

  const quantity = parseRawDecimal(rawQuantity ?? '')
  const unitPrice = parseRawMoney(rawUnitPrice ?? '')
  const hasBoth =
    Number.isFinite(quantity) && quantity > 0 && Number.isFinite(unitPrice) && unitPrice > 0

  if (!asset || !hasBoth) return null

  const total = quantity * unitPrice
  const nextQuantity = currentQuantity + quantity
  // The same weighted average the server will compute, shown before the user
  // commits to it. `purchasePrice` is the cost basis P&L is measured against —
  // never `lastPrice`, which is what the position is worth today.
  const heldCost = asset.marketPosition?.purchasePrice ?? 0
  const nextCostBasis =
    nextQuantity > 0 ? (currentQuantity * heldCost + total) / nextQuantity : 0

  return (
    <section className="border-t border-divider pt-4" aria-live="polite">
      <div className="flex items-baseline justify-between gap-5">
        <span className="t-body-sm text-ink2">{t('assets.purchase.total')}</span>
        <span className="num t-subhead font-medium">{formatVndExact(total)}</span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-5">
        <span className="t-body-sm text-ink2">{t('assets.purchase.afterPurchase')}</span>
        <span className="num t-body-sm font-medium">{`${nextQuantity} ${unit}`.trim()}</span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-5">
        <span className="t-body-sm text-ink2">{t('assets.purchase.estimatedCost')}</span>
        <span className="num t-body-sm font-medium">
          {formatVndExact(nextCostBasis)}
        </span>
      </div>

      <p className="mt-3 t-caption text-ink3">{t('assets.purchase.costBasisHint')}</p>
    </section>
  )
}
