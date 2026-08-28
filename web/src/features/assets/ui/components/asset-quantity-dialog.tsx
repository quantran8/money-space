import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  EventField,
  EventDecimalInput,
  EventFieldTextarea,
  EventMoneyInput,
  eventSelectTriggerClass,
} from '@/components/ui/event-field'
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
import type {
  AssetPurchaseForm,
  AssetQuantityAdjustmentForm,
} from '@money-space/core/features/assets/model/asset-quantity-form'
import type { Asset } from '@money-space/core/features/assets/model/assets'

type Option = { value: string; label: string }

type AssetQuantityDialogProps = {
  mode: 'purchase' | 'adjustment' | null
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  currentQuantity: number
  walletOptions: Option[]
  purchaseForm: UseFormReturn<AssetPurchaseForm>
  adjustmentForm: UseFormReturn<AssetQuantityAdjustmentForm>
  isSubmitting: boolean
  onSubmitPurchase: () => void
  onSubmitAdjustment: () => void
}

/**
 * The two non-sale ways a holding changes, sharing one dialog shell.
 *
 * They look alike and mean opposite things, so the copy carries the difference:
 * a purchase moves money and re-averages cost basis; an adjustment moves nothing
 * and only says the recorded number was wrong. Keeping them visibly distinct is
 * the point — the asset form used to offer a single quantity box that silently
 * did neither properly.
 */
export function AssetQuantityDialog({
  mode,
  onOpenChange,
  asset,
  currentQuantity,
  walletOptions,
  purchaseForm,
  adjustmentForm,
  isSubmitting,
  onSubmitPurchase,
  onSubmitAdjustment,
}: AssetQuantityDialogProps) {
  const { t } = useTranslation()
  const isPurchase = mode === 'purchase'
  const unit = asset?.marketPosition?.unit ?? ''
  const holdingLabel = `${currentQuantity} ${unit}`.trim()

  const {
    control: purchaseControl,
    formState: { errors: purchaseErrors, isValid: purchaseValid },
  } = purchaseForm
  const {
    control: adjustmentControl,
    register: registerAdjustment,
    formState: { errors: adjustmentErrors, isValid: adjustmentValid },
  } = adjustmentForm

  const isValid = isPurchase ? purchaseValid : adjustmentValid

  return (
    <ResponsiveDialog open={mode !== null} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[90dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <ResponsiveDialogTitle className="t-metric tracking-[-0.035em]">
            {isPurchase ? t('assets.purchase.title') : t('assets.quantityAdjustment.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 t-body-sm leading-6">
            {isPurchase
              ? t('assets.purchase.description', { name: asset?.name ?? '' })
              : t('assets.quantityAdjustment.description')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="grid min-h-0 min-w-0 grid-rows-[1fr_auto]"
          onSubmit={isPurchase ? onSubmitPurchase : onSubmitAdjustment}
          noValidate
        >
          <div className="min-h-0 space-y-4 overflow-y-auto overflow-x-hidden px-6 pb-2 pt-6 sm:px-8">
            <div className="flex items-center justify-between rounded-[18px] bg-wash px-5 py-4 t-body-sm">
              <span className="text-ink2">
                {isPurchase
                  ? t('assets.purchase.currentHolding', { quantity: holdingLabel })
                  : t('assets.quantityAdjustment.currentHolding', { quantity: holdingLabel })}
              </span>
            </div>

            {isPurchase ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <EventField
                    label={t('assets.purchase.quantity')}
                    error={purchaseErrors.quantity?.message}
                    trailing={unit ? <span className="t-body font-medium text-ink2">{unit}</span> : undefined}
                  >
                    <Controller
                      control={purchaseControl}
                      name="quantity"
                      render={({ field }) => (
                        <EventDecimalInput
                          placeholder="0"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </EventField>
                  <EventField
                    label={t('assets.purchase.unitPrice')}
                    error={purchaseErrors.unitPrice?.message}
                    trailing={<span className="t-body font-medium text-ink2">₫</span>}
                  >
                    <Controller
                      control={purchaseControl}
                      name="unitPrice"
                      render={({ field }) => (
                        <EventMoneyInput
                          placeholder="0"
                          className="t-metric"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </EventField>
                </div>

                <EventField
                  label={t('assets.purchase.fundingAsset')}
                  error={purchaseErrors.fundingAssetId?.message}
                >
                  <Controller
                    control={purchaseControl}
                    name="fundingAssetId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={eventSelectTriggerClass}>
                          <SelectValue placeholder={t('assets.purchase.fundingAssetNone')} />
                        </SelectTrigger>
                        <SelectContent>
                          {walletOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </EventField>
              </>
            ) : (
              <>
                <EventField
                  label={t('assets.quantityAdjustment.quantity')}
                  error={adjustmentErrors.quantity?.message}
                  trailing={unit ? <span className="t-body font-medium text-ink2">{unit}</span> : undefined}
                >
                  <Controller
                    control={adjustmentControl}
                    name="quantity"
                    render={({ field }) => (
                      <EventDecimalInput
                        placeholder="0"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </EventField>

                <EventField
                  label={t('assets.quantityAdjustment.reason')}
                  error={adjustmentErrors.reason?.message}
                >
                  <EventFieldTextarea
                    rows={2}
                    placeholder={t('assets.quantityAdjustment.reasonPlaceholder')}
                    {...registerAdjustment('reason')}
                  />
                </EventField>

                {/* Says plainly what this is NOT for, because choosing it for a
                    real purchase or sale is exactly the mistake that leaves the
                    ledger unable to explain where the money went. */}
                <p className="rounded-[18px] bg-accent-tint px-5 py-4 t-body-sm leading-6 text-ink2">
                  {t('assets.quantityAdjustment.notAPurchase')}
                </p>
              </>
            )}
          </div>

          <ResponsiveDialogFooter className="border-t border-black/[0.06] px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground hover:bg-canvas"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-[hsl(var(--accent))] px-6 text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {isPurchase ? t('assets.purchase.submit') : t('assets.quantityAdjustment.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
