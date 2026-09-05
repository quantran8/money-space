import { Text, View } from 'react-native'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { buildPurchaseSummary } from '@money-space/core/features/assets/model/asset-quantity-form'
import { formatVndExact } from '@money-space/core/shared/lib/format-money'

import { BottomSheet, Button, DecimalInput, Field, MoneyInput, Select } from '@/components/ui'
import type {
  AssetPurchaseForm,
  AssetQuantityAdjustmentForm,
} from '@money-space/core/features/assets/model/asset-quantity-form'
import type { Asset } from '@money-space/core/features/assets/model/assets'

type Option = { value: string; label: string }

type AssetQuantitySheetProps = {
  mode: 'purchase' | 'adjustment' | null
  onClose: () => void
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
 * The mobile twin of `AssetQuantityDialog`: the two non-sale ways a holding
 * changes, kept visibly apart because they mean opposite things. A purchase
 * moves money and re-averages the cost basis; an adjustment moves nothing and
 * only says the recorded number was wrong.
 */
export function AssetQuantitySheet({
  mode,
  onClose,
  asset,
  currentQuantity,
  walletOptions,
  purchaseForm,
  adjustmentForm,
  isSubmitting,
  onSubmitPurchase,
  onSubmitAdjustment,
}: AssetQuantitySheetProps) {
  const { t } = useTranslation()
  const isPurchase = mode === 'purchase'
  const unit = asset?.marketPosition?.unit ?? ''
  const holdingLabel = `${currentQuantity} ${unit}`.trim()

  const {
    control: purchaseControl,
    formState: { errors: purchaseErrors },
  } = purchaseForm
  const {
    control: adjustmentControl,
    formState: { errors: adjustmentErrors },
  } = adjustmentForm

  return (
    <BottomSheet
      open={mode !== null}
      onClose={onClose}
      title={isPurchase ? t('assets.purchase.title') : t('assets.quantityAdjustment.title')}
      footer={
        <Button
          onPress={isPurchase ? onSubmitPurchase : onSubmitAdjustment}
          loading={isSubmitting}
        >
          {isPurchase ? t('assets.purchase.submit') : t('assets.quantityAdjustment.submit')}
        </Button>
      }
    >
      <View className="gap-4">
        <Text className="text-ink2">
          {isPurchase
            ? t('assets.purchase.description', { name: asset?.name ?? '' })
            : t('assets.quantityAdjustment.description')}
        </Text>

        <View className="rounded-2xl bg-wash px-4 py-3">
          <Text className="text-ink2">
            {isPurchase
              ? t('assets.purchase.currentHolding', { quantity: holdingLabel })
              : t('assets.quantityAdjustment.currentHolding', { quantity: holdingLabel })}
          </Text>
        </View>

        {isPurchase ? (
          <>
            <Controller
              control={purchaseControl}
              name="quantity"
              render={({ field }) => (
                <DecimalInput
                  label={t('assets.purchase.quantity')}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0"
                  suffix={unit || undefined}
                  error={purchaseErrors.quantity?.message}
                />
              )}
            />
            <Controller
              control={purchaseControl}
              name="unitPrice"
              render={({ field }) => (
                <MoneyInput
                  label={t('assets.purchase.unitPrice')}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0"
                  error={purchaseErrors.unitPrice?.message}
                />
              )}
            />
            <Controller
              control={purchaseControl}
              name="fundingAssetId"
              render={({ field }) => (
                <Field label={t('assets.purchase.fundingAsset')} error={purchaseErrors.fundingAssetId?.message}>
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={walletOptions}
                    placeholder={t('assets.purchase.fundingAssetNone')}
                  />
                </Field>
              )}
            />

            <PurchaseSummary
              control={purchaseControl}
              asset={asset}
              currentQuantity={currentQuantity}
              unit={unit}
            />
          </>
        ) : (
          <>
            <Controller
              control={adjustmentControl}
              name="quantity"
              render={({ field }) => (
                <DecimalInput
                  label={t('assets.quantityAdjustment.quantity')}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0"
                  suffix={unit || undefined}
                  error={adjustmentErrors.quantity?.message}
                />
              )}
            />
            {/* States plainly what this is NOT for: choosing it for a real
                purchase or sale is the mistake that leaves the ledger unable to
                explain where the money went. */}
            <Text className="rounded-2xl bg-wash px-4 py-3 text-ink2">
              {t('assets.quantityAdjustment.notAPurchase')}
            </Text>
          </>
        )}
      </View>
    </BottomSheet>
  )
}

/**
 * What the household is about to spend, and what the position looks like after.
 *
 * Mobile had no purchase summary at all: a purchase was committed without the
 * total or the new cost basis ever being shown. Both matter — the total is the
 * money actually leaving a wallet, and the re-averaged basis is what every
 * future gain or loss on this holding is measured against.
 *
 * Inline rows under a divider rather than a nested card (§8 — nothing floats):
 * the answer belongs to the fields above it, so it shares their surface. The
 * arithmetic is core's, so this and the web dialog cannot drift apart.
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

  const summary = buildPurchaseSummary({
    rawQuantity: rawQuantity ?? '',
    rawUnitPrice: rawUnitPrice ?? '',
    currentQuantity,
    heldCostBasis: asset?.marketPosition?.purchasePrice ?? 0,
  })

  // Nothing until both numbers are real — a total of "0 đ" mid-typing states
  // something false.
  if (!asset || !summary) return null

  return (
    <View className="border-t border-divider pt-4" accessibilityLiveRegion="polite">
      <SummaryRow
        label={t('assets.purchase.total')}
        value={formatVndExact(summary.total)}
        lead
      />
      <SummaryRow
        label={t('assets.purchase.afterPurchase')}
        value={`${summary.nextQuantity} ${unit}`.trim()}
      />
      <SummaryRow
        label={t('assets.purchase.estimatedCost')}
        value={formatVndExact(summary.nextCostBasis)}
      />

      <Text className="mt-3 t-caption text-ink3">{t('assets.purchase.costBasisHint')}</Text>
    </View>
  )
}

/** One label/value line of the summary. `lead` is the figure being agreed to. */
function SummaryRow({ label, value, lead = false }: { label: string; value: string; lead?: boolean }) {
  return (
    <View className={lead ? 'flex-row items-baseline justify-between gap-5' : 'mt-3 flex-row items-baseline justify-between gap-5'}>
      <Text className="t-body-sm text-ink2">{label}</Text>
      <Text
        className={lead ? 't-subtitle text-ink' : 't-body-sm font-medium text-ink'}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  )
}
