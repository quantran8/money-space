import { Text, View } from 'react-native'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { AssetSaleForm } from '@money-space/core/features/assets/model/asset-sale-form'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'
import { computeCurrentValue, type Asset } from '@money-space/core/features/assets/model/assets'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { parseRawMoney } from '@money-space/core/shared/lib/number-format'

import {
  BottomSheet,
  Button,
  ConsequenceNote,
  DateField,
  DecimalInput,
  Field,
  Money,
  MoneyInput,
  Select,
  Sunk,
  Switch,
} from '@/components/ui'

/**
 * Bán tài sản — move value out of a holding and into a wallet, minus the fee.
 *
 * A sale is NOT a re-valuation: a valuation changes what the asset is worth on
 * paper and moves no money, while this realizes value into cash and reduces the
 * position. Net worth only drops by the fee.
 *
 * Everything computed — the net proceeds, the quantity × price product, what a
 * "bán toàn bộ" resolves to — comes from core's `useAssetSale`; this file only
 * lays the fields out.
 */
export function AssetSaleSheet({
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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  asOf: string
  form: UseFormReturn<AssetSaleForm>
  walletOptions: { value: string; label: string }[]
  isMarketAsset: boolean
  currentQuantity: number
  previewNet: number
  isSubmitting: boolean
  isEditing?: boolean
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = form

  const sellAll = watch('sellAll')
  const proceeds = watch('proceeds')
  const isRealEstate = asset?.type === 'real_estate'

  // What the household still holds, so the amount being sold is checkable
  // against it without leaving the sheet.
  const holdingLabel = asset
    ? isMarketAsset
      ? t('assets.sale.holdingQuantity', {
          quantity: currentQuantity,
          unit: isRealEstate ? 'm²' : (asset.marketPosition?.unit ?? ''),
        })
      : t('assets.sale.holdingValue', {
          value: formatVndShort(computeCurrentValue(asset, asOf || AS_OF) ?? 0),
        })
    : ''

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? t('assets.sale.editTitle') : t('assets.sale.title')}
      footer={
        // §22.10 — never disabled on validity, even here where the web gates on
        // `isValid`. Pressing it must report what is missing.
        <Button onPress={onSubmit} loading={isSubmitting}>
          {isEditing ? t('assets.sale.submitEdit') : t('assets.sale.submit')}
        </Button>
      }
    >
      <View className="gap-4">
        {/* What is being sold and how much of it is left. Scope, not a field —
            the sheet title says the action, this says what it acts on. */}
        {asset ? (
          <Sunk>
            <Text className="text-[14px] font-medium text-ink">{asset.name}</Text>
            <Text className="mt-0.5 text-[12px] text-ink2">{holdingLabel}</Text>
          </Sunk>
        ) : null}

        {isMarketAsset ? (
          <>
            {currentQuantity > 0 ? (
              <Controller
                control={control}
                name="sellAll"
                render={({ field }) => (
                  <Switch
                    label={t('assets.sale.sellAll')}
                    // The scope line above already says how much is held, so
                    // this needs no hint repeating it.
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next)
                      // Core recomputes proceeds from the held quantity when
                      // this is on, so a typed figure must not linger behind it.
                      if (next) setValue('quantity', '', { shouldValidate: true })
                    }}
                  />
                )}
              />
            ) : null}

            {/* Hidden rather than disabled while selling the lot: there is no
                quantity to enter, and a greyed field showing a number the user
                cannot change reads as an input that stopped working. */}
            {!sellAll ? (
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <DecimalInput
                    label={isRealEstate ? t('assets.sale.areaSqm') : t('assets.sale.quantity')}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('assets.sale.quantityPlaceholder')}
                    suffix={isRealEstate ? 'm²' : asset?.marketPosition?.unit}
                    error={errors.quantity?.message}
                  />
                )}
              />
            ) : null}

            <Controller
              control={control}
              name="unitPrice"
              render={({ field }) => (
                <MoneyInput
                  label={isRealEstate ? t('assets.sale.pricePerSqm') : t('assets.sale.unitPrice')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.unitPrice?.message}
                />
              )}
            />
          </>
        ) : null}

        {/* Gross proceeds, before the fee — "đã bán được bao nhiêu" is the
            figure people quote, and the fee is stated separately below.

            For a market asset this is DERIVED (quantity × đơn giá, computed in
            core), so it is shown as a read-out rather than a field: an input
            that core overwrites on the next keystroke is an input that looks
            broken. Everything else is sold by a price that was agreed, not
            calculated, so there it is typed. */}
        {isMarketAsset ? (
          <Sunk className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-[13px] text-ink2">{t('assets.sale.proceeds')}</Text>
            <Money size={18}>{formatVndShort(parseRawMoney(proceeds) || 0)}</Money>
          </Sunk>
        ) : (
          <Controller
            control={control}
            name="proceeds"
            render={({ field }) => (
              <MoneyInput
                label={t('assets.sale.proceeds')}
                value={field.value}
                onChange={field.onChange}
                placeholder={t('assets.sale.proceedsPlaceholder')}
                error={errors.proceeds?.message}
              />
            )}
          />
        )}

        {/* The schema still validates `proceeds`, so a market sale with no
            price yet says so here rather than failing silently on submit. */}
        {isMarketAsset && errors.proceeds?.message ? (
          <Text className="-mt-2 text-[12px] text-alert">{errors.proceeds.message}</Text>
        ) : null}

        <Controller
          control={control}
          name="fee"
          render={({ field }) => (
            <MoneyInput
              label={t('assets.sale.fee')}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('assets.sale.feePlaceholder')}
              error={errors.fee?.message}
            />
          )}
        />

        {/* The one number the household actually receives. The wallet is
            credited NET, so stating it here is what makes the fee visible as a
            real deduction rather than a footnote. */}
        <ConsequenceNote>
          {`${t('assets.sale.receivedNet')}: ${formatVndShort(previewNet)}`}
        </ConsequenceNote>

        <Controller
          control={control}
          name="toAssetId"
          render={({ field }) => (
            <Select
              label={t('assets.sale.receiveInto')}
              value={field.value || null}
              placeholder={t('assets.sale.receiveIntoPlaceholder')}
              error={errors.toAssetId?.message}
              onChange={field.onChange}
              options={walletOptions}
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DateField
              label={t('assets.sale.date')}
              value={field.value}
              onChange={field.onChange}
              error={errors.date?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <Field
              label={t('assets.sale.note')}
              placeholder={t('assets.sale.notePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.note?.message}
              multiline
            />
          )}
        />
      </View>
    </BottomSheet>
  )
}
