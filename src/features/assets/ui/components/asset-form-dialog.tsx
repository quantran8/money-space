import { useState } from 'react'
import { Controller, useWatch, type UseFormReturn, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DecimalField,
  Disclosure,
  Field,
  MoneyField,
  TextField,
  TextareaField,
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
import {
  assetTypeOrder,
  defaultLiquidityForType,
  liquidityOrder,
  type Asset,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'
import { AssetClassificationFields } from '@/features/assets/ui/components/asset-classification-fields'
import { parseMoneyToVnd, type AssetForm } from '@/features/assets/model/assets-form'
import { useFlexibleMoney } from '@/features/forecast/hooks/use-forecast'
import { formatMoney } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type WalletOption = { value: string; label: string }

type AssetFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<AssetForm>
  setValue: UseFormSetValue<AssetForm>
  mode: ValuationMode
  walletOptions: WalletOption[]
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
  /** The stored asset being edited — drives the §22.8 change sentence. */
  editingAsset?: Asset
  /** §22.11 destructive action, shown in the button row on edit only. */
  onRemove?: () => void
}

export function AssetFormDialog({
  open,
  onOpenChange,
  form,
  setValue,
  mode,
  walletOptions,
  isEditing,
  isSubmitting,
  onSubmit,
  editingAsset,
  onRemove,
}: AssetFormDialogProps) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const {
    control,
    register,
    formState: { errors },
  } = form

  const selectedType = useWatch({ control, name: 'type' })
  const liquidity = useWatch({ control, name: 'liquidity' })
  const interestDestination = useWatch({ control, name: 'interestDestination' })
  const isSaving = selectedType === 'saving_deposit'
  const isRealEstate = selectedType === 'real_estate'

  function handleOpenChange(nextOpen: boolean) {
    // Onboarding renders this dialog without a `key`, so it never remounts —
    // the disclosure must be collapsed here or it stays open on the next open.
    if (!nextOpen) setShowMore(false)
    onOpenChange(nextOpen)
  }

  /**
   * Type drives valuation mode AND the default liquidity bucket (§22.1: the app
   * never asks what it can derive). This used to live in the step-1 tile grid;
   * with the wizard gone it must fire here or liquidity stops pre-filling.
   */
  function handleTypeChange(next: AssetType) {
    setValue('type', next, { shouldDirty: true, shouldValidate: true })
    setValue('liquidity', defaultLiquidityForType(next), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[88dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <ResponsiveDialogHeader className="px-5 pb-5 pr-16 pt-5 text-left sm:px-8 sm:pr-16 sm:pt-7">
          <ResponsiveDialogTitle className="text-[19px] font-medium tracking-[-0.015em]">
            {isEditing ? t('assets.form.updateTitle') : t('assets.form.createTitle')}
          </ResponsiveDialogTitle>
          {/* §16.2 — a subtitle here would be mood, not meaning. */}
          <ResponsiveDialogDescription className="sr-only">
            {t('assets.form.help')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="overflow-y-auto px-5 pb-5 sm:px-8 sm:pb-7"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="space-y-4">
            <Field label={t('assets.form.type')} error={errors.type?.message}>
              <div className={fieldShell}>
                <Select value={selectedType} onValueChange={(next) => handleTypeChange(next as AssetType)}>
                  <SelectTrigger className={fieldControlReset}>
                    <SelectValue placeholder={t('assets.form.typePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypeOrder.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`options.assetType.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>

            {/* §22.1 — a market-priced holding is identified by its symbol, so
                asking for a name too would mean typing "FPT" twice. The stored
                name is derived in `resolveAssetName`; renaming stays available
                in the disclosure for anyone who wants a custom label. */}
            {mode !== 'market_priced' ? (
              <TextField
                id="asset-name"
                label={t('assets.form.name')}
                placeholder={t('assets.form.namePlaceholder')}
                error={errors.name?.message}
                {...register('name')}
              />
            ) : null}

            {mode === 'manual' ? (
              <ManualFields
                control={control}
                errors={errors}
                isRealEstate={isRealEstate}
                t={t}
              />
            ) : null}

            {mode === 'market_priced' ? (
              <MarketFields control={control} register={register} errors={errors} t={t} />
            ) : null}

            {mode === 'formula_calculated' ? (
              <FormulaFields control={control} errors={errors} t={t} />
            ) : null}

            <AssetEffect
              control={control}
              mode={mode}
              liquidity={liquidity}
              isEditing={isEditing}
              editingAsset={editingAsset}
              t={t}
            />

            {/* §22.2 — exactly one disclosure, never a second level. */}
            <Disclosure
              open={showMore}
              onToggle={() => setShowMore((current) => !current)}
              label={showMore ? t('assets.form.less') : t('assets.form.more')}
            >
              <Field label={t('assets.form.group')} error={errors.liquidity?.message}>
                <div className={fieldShell}>
                  <Controller
                    control={control}
                    name="liquidity"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={fieldControlReset}>
                          <SelectValue placeholder={t('assets.form.groupPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {liquidityOrder.map((item) => (
                            <SelectItem key={item} value={item}>
                              {t(`options.liquidity.${item}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </Field>

              {mode === 'market_priced' ? (
                <>
                  {/* Empty → the symbol is used (`resolveAssetName`). Here for
                      the user who holds the same ticker in two places. */}
                  <TextField
                    id="asset-name"
                    label={t('assets.form.customName')}
                    placeholder={t('assets.form.customNamePlaceholder')}
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <TextField
                    id="asset-unit"
                    label={t('assets.form.unit')}
                    placeholder={t('assets.form.unitPlaceholder')}
                    error={errors.unit?.message}
                    {...register('unit')}
                  />
                </>
              ) : null}

              {mode === 'formula_calculated' ? (
                <FormulaExtraFields
                  control={control}
                  errors={errors}
                  isSaving={isSaving}
                  interestDestination={interestDestination}
                  walletOptions={walletOptions}
                  t={t}
                />
              ) : null}

              <TextareaField
                id="asset-note"
                label={t('assets.form.note')}
                placeholder={t('assets.form.notePlaceholder')}
                error={errors.note?.message}
                {...register('note')}
              />

              <AssetClassificationFields form={form} />
            </Disclosure>
          </div>

          {/* §22.11 — a text button in the row, never a bordered "Danger zone". */}
          <ResponsiveDialogFooter className="mt-5 gap-2.5 sm:items-center sm:justify-between">
            {isEditing && onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="text-[13px] text-alert transition-opacity hover:opacity-70 sm:mr-auto"
              >
                {t('assets.form.remove')}
              </button>
            ) : null}
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                className="h-10 px-4 text-[13px]"
                onClick={() => handleOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              {/* §22.10 — never disabled on validity; errors explain the reason. */}
              <Button type="submit" className="h-10 px-5 text-[13px]" disabled={isSubmitting}>
                {isSubmitting
                  ? t('assets.form.saving')
                  : isEditing
                    ? t('assets.form.update')
                    : t('assets.form.create')}
              </Button>
            </div>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

type Translate = (key: string, params?: Record<string, unknown>) => string
type Control = UseFormReturn<AssetForm>['control']
type Errors = UseFormReturn<AssetForm>['formState']['errors']

/**
 * §22.7 — the consequence, as ONE SENTENCE, updating per keystroke. On edit it
 * becomes the §22.8 change summary instead: also a sentence, never a
 * before/after table, and listing only fields that actually changed.
 *
 * The flexible-money figure is projected client-side (current + this asset)
 * rather than re-fetched per keystroke. It is an estimate of what the save will
 * produce, which is exactly what a "what happens if I do this" block is for.
 */
function AssetEffect({
  control,
  mode,
  liquidity,
  isEditing,
  editingAsset,
  t,
}: {
  control: Control
  mode: ValuationMode
  liquidity: AssetForm['liquidity']
  isEditing: boolean
  editingAsset?: Asset
  t: Translate
}) {
  const { flexibleMoney } = useFlexibleMoney()
  const rawValue = useWatch({ control, name: 'value' })
  const rawPrincipal = useWatch({ control, name: 'principal' })
  const name = useWatch({ control, name: 'name' })
  const symbol = useWatch({ control, name: 'symbol' })
  const type = useWatch({ control, name: 'type' })

  // Market-priced assets are valued from a live quote, so no honest amount can
  // be shown here while typing (§2.16 — never look more certain than the data).
  const raw = mode === 'formula_calculated' ? rawPrincipal : rawValue
  const amount = mode === 'market_priced' ? NaN : parseMoneyToVnd(raw ?? '')
  const hasAmount = Number.isFinite(amount) && amount > 0

  if (isEditing && editingAsset) {
    const changes: string[] = []
    const storedValue =
      editingAsset.manualValue ?? editingAsset.calculationTerm?.principalAmount ?? 0
    if (hasAmount && Math.round(amount) !== Math.round(storedValue)) {
      changes.push(
        t('assets.form.changeValue', {
          from: formatMoney(storedValue),
          to: formatMoney(amount),
        }),
      )
    }
    // Compare the RESOLVED name: for a market-priced holding an empty field
    // means "use the symbol", so comparing the raw field would report a rename
    // that is not happening.
    const nextName =
      name?.trim() || (mode === 'market_priced' ? (symbol?.trim().toUpperCase() ?? '') : '')
    if (nextName && nextName !== editingAsset.name) {
      changes.push(t('assets.form.changeName', { from: editingAsset.name, to: nextName }))
    }
    if (type && type !== editingAsset.type) {
      changes.push(
        t('assets.form.changeType', {
          from: t(`options.assetType.${editingAsset.type}`),
          to: t(`options.assetType.${type}`),
        }),
      )
    }
    if (changes.length === 0) return null
    return <EffectBlock>{changes.join(' ')}</EffectBlock>
  }

  if (!hasAmount) return null

  if (liquidity !== 'usable_now' || !flexibleMoney) {
    return <EffectBlock>{t('assets.form.effectOther', { amount: formatMoney(amount) })}</EffectBlock>
  }

  return (
    <EffectBlock>
      {t('assets.form.effectUsable', {
        amount: formatMoney(amount),
        flexible: formatMoney(flexibleMoney.flexibleMoneyHorizon + amount),
      })}
    </EffectBlock>
  )
}

/**
 * `--accent-soft`, same as the simulation surface — both answer "what happens
 * if I do this" (§22.7). `aria-live` because §24 requires the trying-state to
 * be announced, not signalled by background alone.
 */
function EffectBlock({ children }: { children: React.ReactNode }) {
  return (
    <p
      aria-live="polite"
      className="num rounded-[10px] bg-accent-soft px-4 py-3 text-[13px] font-medium leading-[1.6] text-ink2"
    >
      {children}
    </p>
  )
}

function ManualFields({
  control,
  errors,
  isRealEstate,
  t,
}: {
  control: Control
  errors: Errors
  isRealEstate: boolean
  t: Translate
}) {
  return (
    <>
      <Controller
        control={control}
        name="value"
        render={({ field }) => (
          <MoneyField
            id="asset-value"
            label={t('assets.form.value')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.value?.message}
          />
        )}
      />
      {isRealEstate ? (
        <Controller
          control={control}
          name="areaSqm"
          render={({ field }) => (
            <DecimalField
              id="asset-area"
              label={t('assets.form.areaSqm')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="0"
              suffix="m²"
              error={errors.areaSqm?.message}
            />
          )}
        />
      ) : null}
    </>
  )
}

/**
 * Symbol is a free-text input for EVERY market-priced type — stock, crypto,
 * fund, gold, foreign currency alike.
 *
 * There was a searchable picker for stock/crypto backed by
 * `/api/market-data/symbols`, but that reference data does not exist yet. A
 * combobox with nothing behind it is worse than a text field: it implies a
 * canonical list, then shows "không tìm thấy" for a symbol the user holds. Let
 * them type the code until the instrument DB is real.
 */
function MarketFields({
  control,
  register,
  errors,
  t,
}: {
  control: Control
  register: UseFormReturn<AssetForm>['register']
  errors: Errors
  t: Translate
}) {
  return (
    <>
      <Field label={t('assets.form.symbol')} error={errors.symbol?.message}>
        <div className={cn(fieldShell, errors.symbol && 'border-alert')}>
          <input
            className="h-full w-full min-w-0 bg-transparent text-[16px] uppercase leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3"
            placeholder={t('assets.form.symbolPlaceholder')}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            {...register('symbol')}
          />
        </div>
      </Field>

      <Controller
        control={control}
        name="quantity"
        render={({ field }) => (
          <DecimalField
            id="asset-quantity"
            label={t('assets.form.quantity')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="0"
            error={errors.quantity?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="purchasePrice"
        render={({ field }) => (
          <MoneyField
            id="asset-purchase-price"
            label={t('assets.form.purchasePrice')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.purchasePrice?.message}
          />
        )}
      />
    </>
  )
}

function FormulaFields({
  control,
  errors,
  t,
}: {
  control: Control
  errors: Errors
  t: Translate
}) {
  return (
    <>
      <Controller
        control={control}
        name="principal"
        render={({ field }) => (
          <MoneyField
            id="asset-principal"
            label={t('assets.form.principal')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.principal?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="interestRate"
        render={({ field }) => (
          <DecimalField
            id="asset-interest-rate"
            label={t('assets.form.interestRate')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="4,8"
            suffix="%/năm"
            error={errors.interestRate?.message}
          />
        )}
      />
      <Field label={t('assets.form.startDate')} error={errors.startDate?.message}>
        <div className={cn(fieldShell, errors.startDate && 'border-alert')}>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                className={cn(fieldControlReset, 'justify-start [&_svg]:hidden')}
              />
            )}
          />
        </div>
      </Field>
    </>
  )
}

/** The §22.2 disclosure half of the formula-mode fields. */
function FormulaExtraFields({
  control,
  errors,
  isSaving,
  interestDestination,
  walletOptions,
  t,
}: {
  control: Control
  errors: Errors
  isSaving: boolean
  interestDestination: AssetForm['interestDestination']
  walletOptions: WalletOption[]
  t: Translate
}) {
  return (
    <>
      <Field label={t('assets.form.maturityDate')} error={errors.maturityDate?.message}>
        <div className={fieldShell}>
          <Controller
            control={control}
            name="maturityDate"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                className={cn(fieldControlReset, 'justify-start [&_svg]:hidden')}
              />
            )}
          />
        </div>
      </Field>

      <Field label={t('assets.form.interestPayment')} error={errors.interestPayment?.message}>
        <div className={fieldShell}>
          <Controller
            control={control}
            name="interestPayment"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={fieldControlReset}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_of_term">
                    {t('options.interestPayment.end_of_term')}
                  </SelectItem>
                  <SelectItem value="monthly">{t('options.interestPayment.monthly')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </Field>

      {isSaving ? (
        <>
          <Controller
            control={control}
            name="nonTermRate"
            render={({ field }) => (
              <DecimalField
                id="asset-non-term-rate"
                label={t('assets.form.nonTermRate')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0,2"
                suffix="%/năm"
                error={errors.nonTermRate?.message}
              />
            )}
          />

          <Field
            label={t('assets.form.interestDestination')}
            error={errors.interestDestination?.message}
          >
            <div className={fieldShell}>
              <Controller
                control={control}
                name="interestDestination"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldControlReset}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principal">
                        {t('options.interestDestination.principal')}
                      </SelectItem>
                      <SelectItem value="wallet">
                        {t('options.interestDestination.wallet')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </Field>

          {interestDestination === 'wallet' ? (
            <Field
              label={t('assets.form.receivingWallet')}
              error={errors.receivingWalletId?.message}
            >
              <div className={cn(fieldShell, errors.receivingWalletId && 'border-alert')}>
                <Controller
                  control={control}
                  name="receivingWalletId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldControlReset}>
                        <SelectValue placeholder={t('assets.form.receivingWalletPlaceholder')} />
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
              </div>
            </Field>
          ) : null}
        </>
      ) : null}
    </>
  )
}
