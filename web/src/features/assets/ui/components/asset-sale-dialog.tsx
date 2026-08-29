import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DecimalField,
  Field,
  MoneyField,
  TextareaField,
  fieldControlReset,
  fieldShell,
} from '@/components/ui/form-22'
import { MarketPriceSection } from '@/features/assets/ui/components/market-price-section'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@money-space/core/shared/lib/utils'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'
import type { AssetSaleForm } from '@money-space/core/features/assets/model/asset-sale-form'
import {
  computeCurrentValue,
  searchableAssetClassForType,
  type Asset,
} from '@money-space/core/features/assets/model/assets'
import { useMarketQuote } from '@money-space/core/features/assets/hooks/use-market-quote'
import { formatMoney, formatVndShort } from '@money-space/core/shared/lib/format-money'
import { formatDecimalDisplay, parseRawMoney } from '@money-space/core/shared/lib/number-format'

type Option = { value: string; label: string }

type AssetSaleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  asOf: string
  form: UseFormReturn<AssetSaleForm>
  walletOptions: Option[]
  isMarketAsset: boolean
  currentQuantity: number
  previewNet: number
  isSubmitting: boolean
  isEditing?: boolean
  onSubmit: () => void
}

export function AssetSaleDialog({
  open,
  onOpenChange,
  asset,
  asOf,
  form,
  walletOptions,
  isMarketAsset,
  currentQuantity,
  previewNet,
  isSubmitting,
  isEditing = false,
  onSubmit,
}: AssetSaleDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form

  // The secondary fields (date, fee, note) start collapsed: a sale is normally
  // "how much, at what price, into which account", and the rest is correction.
  // Derived, not stored: an error inside the collapsed block would otherwise be
  // unreachable, and the toggle resets itself when the dialog closes.
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const detailsOpen =
    detailsExpanded || !!(errors.date || errors.fee || errors.note)

  const sellAll = watch('sellAll')
  const quantity = watch('quantity')
  const unitPrice = watch('unitPrice')
  const proceeds = watch('proceeds')
  const fee = watch('fee')

  const unit =
    asset?.type === 'real_estate' ? 'm²' : (asset?.marketPosition?.unit ?? '')

  // --- Live price -------------------------------------------------------
  // Same contract as the purchase dialog: `/assets` already carries today's
  // price for every held instrument, so the embedded figure is preferred and
  // the dedicated quote endpoint is asked only for what it cannot do — pricing
  // a non-VND holding in đồng — plus a user-driven refresh.
  const [refreshed, setRefreshed] = useState(false)
  const assetClass = asset ? searchableAssetClassForType(asset.type) : undefined
  const position = asset?.marketPosition
  const quoteCurrency =
    assetClass === 'crypto' ? 'VND' : (position?.quoteCurrency ?? undefined)

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
    isLoading: quoteLoading,
    isFetching: quoteFetching,
    isUnavailable: quoteUnavailable,
    refetch: refetchQuote,
  } = useMarketQuote(
    needsFetch || refreshed ? assetClass : undefined,
    position?.symbol ?? '',
    position?.market,
    quoteCurrency,
  )

  const quote = fetched ?? embedded

  // Apply a price that arrived AFTER the form was seeded. The embedded price is
  // already seeded by `useAssetSale`'s reset; this covers only what that reset
  // could not know — the converted quote for a non-VND holding, and the figure
  // a refresh just fetched. Keyed by price so a number the user typed survives
  // a re-render while a genuinely moved price still lands.
  //
  // Never on EDIT unless the user asks: that form holds the price the sale was
  // actually agreed at, and silently replacing a historical figure with today's
  // would rewrite the record the user opened to correct.
  const seededFor = useRef<string | null>(null)
  useEffect(() => {
    if (!open) {
      seededFor.current = null
      return
    }
    if (isEditing && !refreshed) return
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
  }, [open, fetched, isEditing, refreshed])

  function handleRefreshQuote() {
    // Enables the query when the embedded price made it unnecessary, so the
    // first refresh on a VND holding actually issues a request.
    setRefreshed(true)
    void refetchQuote()
  }
  const holdingLabel = asset
    ? isMarketAsset
      ? t('assets.sale.holdingQuantity', { quantity: currentQuantity, unit })
      : t('assets.sale.holdingValue', {
          value: formatVndShort(computeCurrentValue(asset, asOf || AS_OF) ?? 0),
        })
    : ''

  // Mirrors the figure: what the number above is made of, in full precision.
  const breakdown = isMarketAsset
    ? t('assets.sale.breakdownMarket', {
        quantity: formatDecimalDisplay(sellAll ? String(currentQuantity) : quantity) || '0',
        unit,
        price: formatMoney(parseRawMoney(unitPrice) || 0),
        fee: formatMoney(parseRawMoney(fee) || 0),
      })
    : t('assets.sale.breakdownManual', {
        proceeds: formatMoney(parseRawMoney(proceeds) || 0),
        fee: formatMoney(parseRawMoney(fee) || 0),
      })

  const title = asset
    ? isEditing
      ? t('assets.sale.editTitle')
      : t('assets.sale.titleNamed', { name: asset.name })
    : t('assets.sale.title')

  // Collapse the details again when the dialog closes, so the next sale opens
  // in the same lean state as the first.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDetailsExpanded(false)
      setRefreshed(false)
    }
    onOpenChange(next)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[90dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <ResponsiveDialogTitle className="t-title">{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="t-body-sm text-ink2">
            {asset ? holdingLabel : t('assets.sale.eyebrow')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="grid min-h-0 min-w-0 grid-rows-[1fr_auto]" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 space-y-4 overflow-y-auto overflow-x-hidden px-6 pb-2 pt-6 sm:px-8">
            {isMarketAsset ? (
              <>
                {/* What one unit trades at right now, above the price it seeds. */}
                <MarketPriceSection
                  quote={quote}
                  isLoading={quoteLoading}
                  isFetching={quoteFetching}
                  isUnavailable={quoteUnavailable}
                  unit={unit}
                  onRefresh={handleRefreshQuote}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller control={control} name="quantity" render={({ field }) => (
                    <DecimalField
                      id="asset-sale-quantity"
                      label={asset?.type === 'real_estate' ? t('assets.sale.areaSqm') : t('assets.sale.quantity')}
                      placeholder={t('assets.sale.quantityPlaceholder')}
                      suffix={unit || undefined}
                      disabled={sellAll}
                      error={errors.quantity?.message}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )} />
                  <Controller control={control} name="unitPrice" render={({ field }) => (
                    <MoneyField
                      id="asset-sale-unit-price"
                      label={asset?.type === 'real_estate' ? t('assets.sale.pricePerSqm') : t('assets.sale.unitPrice')}
                      error={errors.unitPrice?.message}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )} />
                </div>

                {currentQuantity > 0 ? (
                  <div className="flex items-center justify-between rounded-control bg-wash px-5 py-4">
                    <p className="t-body-sm font-medium text-foreground">
                      {t('assets.sale.sellAll')}
                    </p>
                    <Controller
                      control={control}
                      name="sellAll"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(next) => {
                            field.onChange(next)
                            if (next) setValue('quantity', '', { shouldValidate: true })
                          }}
                        />
                      )}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              /* A manual asset has no quantity to price, so the amount is typed
                 directly and stays the hero field. */
              <Controller
                control={control}
                name="proceeds"
                render={({ field }) => (
                  <MoneyField
                    id="asset-sale-proceeds"
                    label={t('assets.sale.proceeds')}
                    error={errors.proceeds?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="toAssetId"
              render={({ field }) => (
                <Field
                  label={t('assets.sale.receiveInto')}
                  error={errors.toAssetId?.message}
                >
                  <div className={fieldShell}>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldControlReset}>
                        <SelectValue placeholder={t('assets.sale.receiveIntoPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {walletOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
              )}
            />

            <div>
              <button
                type="button"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsExpanded((prev) => !prev)}
                className="s-tap flex w-full items-center justify-between gap-4 py-2 text-left"
              >
                <span className="t-body text-ink2">{t('assets.sale.details')}</span>
                <ChevronDown
                  className={cn(
                    'size-[18px] text-ink3 transition-transform duration-200',
                    detailsOpen && 'rotate-180',
                  )}
                />
              </button>

              {detailsOpen ? (
                <div className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                      control={control}
                      name="date"
                      render={({ field }) => (
                        <Field label={t('assets.sale.date')} error={errors.date?.message}>
                          <div className={fieldShell}>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              className={fieldControlReset}
                            />
                          </div>
                        </Field>
                      )}
                    />

                    <Controller
                      control={control}
                      name="fee"
                      render={({ field }) => (
                        <MoneyField
                          id="asset-sale-fee"
                          label={t('assets.sale.fee')}
                          error={errors.fee?.message}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </div>

                  <TextareaField
                    id="asset-sale-note"
                    label={t('assets.sale.note')}
                    rows={3}
                    placeholder={t('assets.sale.notePlaceholder')}
                    error={errors.note?.message}
                    {...register('note')}
                  />
                </div>
              ) : null}
            </div>

            {/* The one divider in the body: it separates what you enter from
                what you get. */}
            <div className="border-t border-divider pt-6" aria-live="polite">
              <p className="t-body-sm text-ink2">{t('assets.sale.expectedNet')}</p>
              <p className="money-number t-figure text-ink">{formatVndShort(previewNet)}</p>
              <p className="mt-1 t-caption text-ink3">{breakdown}</p>
            </div>
          </div>

          <ResponsiveDialogFooter className="border-t border-divider px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="secondary"
              className="rounded-control"
              onClick={() => handleOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting
                ? t('assets.sale.submitting')
                : isEditing
                  ? t('assets.sale.submitEdit')
                  : asset
                    ? t('assets.sale.submitNamed', { name: asset.name })
                    : t('assets.sale.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
