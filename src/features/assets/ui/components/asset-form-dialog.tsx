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
  Segmented,
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
import { Switch } from '@/components/ui/switch'
import {
  assetTypeOrder,
  flexibleByDefaultForAssetType,
  type Asset,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'
import { AssetClassificationFields } from '@/features/assets/ui/components/asset-classification-fields'
import {
  goldUnits,
  isInterestOptional,
  isWholeQuantityType,
  manualValueLabelKey,
  parseMoneyToVnd,
  type AssetForm,
} from '@/features/assets/model/assets-form'
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
    getValues,
    register,
    formState: { errors },
  } = form

  const selectedType = useWatch({ control, name: 'type' })
  const interestDestination = useWatch({ control, name: 'interestDestination' })
  const hasInterest = useWatch({ control, name: 'hasInterest' })
  const isSaving = selectedType === 'saving_deposit'
  // Interest is opt-in only where it is genuinely optional (a loan); every other
  // formula type is defined by its rate.
  const earnsInterest = !isInterestOptional(selectedType) || hasInterest

  function handleOpenChange(nextOpen: boolean) {
    // Onboarding renders this dialog without a `key`, so it never remounts —
    // the disclosure must be collapsed here or it stays open on the next open.
    if (!nextOpen) setShowMore(false)
    onOpenChange(nextOpen)
  }

  function handleTypeChange(next: AssetType) {
    setValue('type', next, { shouldDirty: true, shouldValidate: true })
    // Changing the type changes what the money IS, so the flexible-money answer
    // starts over from that type's default rather than carrying over a decision
    // made about a different kind of asset.
    setValue('countsAsFlexible', flexibleByDefaultForAssetType(next), {
      shouldDirty: true,
    })
    // The gold unit is a fixed choice, so it starts on the most common one
    // rather than rendering a segmented control with nothing selected.
    if (next === 'gold' && !getValues('unit')) {
      setValue('unit', goldUnits[0], { shouldDirty: true })
    }
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

            {/* A market-priced holding is identified and named by its symbol or
                kind, so a second custom-name field would duplicate input. */}
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
              <ManualFields control={control} errors={errors} type={selectedType} t={t} />
            ) : null}

            {mode === 'market_priced' ? (
              <MarketFields
                control={control}
                register={register}
                errors={errors}
                type={selectedType}
                t={t}
              />
            ) : null}

            {mode === 'formula_calculated' ? (
              <FormulaFields
                control={control}
                errors={errors}
                type={selectedType}
                earnsInterest={earnsInterest}
                t={t}
              />
            ) : null}

            {/* §22.1 — the household's own call on what "money we can use"
                means. It moves the headline number, so it belongs in the main
                section with the consequence sentence right under it. */}
            <ToggleRow
              id="asset-counts-as-flexible"
              label={t('assets.form.countsAsFlexible')}
              control={control}
              name="countsAsFlexible"
            />

            <AssetEffect
              control={control}
              mode={mode}
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
              {mode === 'formula_calculated' ? (
                <FormulaExtraFields
                  control={control}
                  errors={errors}
                  type={selectedType}
                  earnsInterest={earnsInterest}
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

              <AssetClassificationFields form={form} defaultToCurrentMember={!isEditing} />
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
  isEditing,
  editingAsset,
  t,
}: {
  control: Control
  mode: ValuationMode
  isEditing: boolean
  editingAsset?: Asset
  t: Translate
}) {
  const { flexibleMoney } = useFlexibleMoney()
  const countsAsFlexible = useWatch({ control, name: 'countsAsFlexible' })
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
    // Flipping this moves money in and out of the household's headline figure,
    // so it is exactly the kind of change §22.8 exists to state out loud.
    if (countsAsFlexible !== (editingAsset.liquidity === 'usable_now')) {
      changes.push(
        t(countsAsFlexible ? 'assets.form.changeFlexibleOn' : 'assets.form.changeFlexibleOff'),
      )
    }
    if (changes.length === 0) return null
    return <EffectBlock>{changes.join(' ')}</EffectBlock>
  }

  if (!hasAmount) return null

  // The switch, not the type, decides which sentence is true here.
  if (!countsAsFlexible || !flexibleMoney) {
    return <EffectBlock>{t('assets.form.effectOther', { amount: formatMoney(amount) })}</EffectBlock>
  }

  return (
    <EffectBlock>
      {t('assets.form.effectUsable', {
        amount: formatMoney(amount),
        flexible: formatMoney(flexibleMoney.lowestProjectedBalance + amount),
      })}
    </EffectBlock>
  )
}

/**
 * A yes/no answer as a label + switch row. No helper line under it (§22.0):
 * where the answer needs explaining, the §22.7 consequence sentence does it.
 */
function ToggleRow({
  id,
  label,
  control,
  name,
}: {
  id: string
  label: string
  control: Control
  name: 'hasInterest' | 'countsAsFlexible'
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-[13px] leading-[1.4] text-ink2">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch id={id} checked={field.value} onCheckedChange={field.onChange} />
        )}
      />
    </div>
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
  type,
  t,
}: {
  control: Control
  errors: Errors
  type: AssetType
  t: Translate
}) {
  const isRealEstate = type === 'real_estate'

  return (
    <>
      <Controller
        control={control}
        name="value"
        render={({ field }) => (
          <MoneyField
            id="asset-value"
            // Cash and a bank account have a balance, not an estimate.
            label={t(manualValueLabelKey(type))}
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
  type,
  t,
}: {
  control: Control
  register: UseFormReturn<AssetForm>['register']
  errors: Errors
  type: AssetType
  t: Translate
}) {
  const fieldPrefix = `assets.form.market.${type}`

  return (
    <>
      <Field label={t(`${fieldPrefix}.symbol`)} error={errors.symbol?.message}>
        <div className={cn(fieldShell, errors.symbol && 'border-alert')}>
          <input
            className="h-full w-full min-w-0 bg-transparent text-[16px] uppercase leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3"
            placeholder={t(`${fieldPrefix}.symbolPlaceholder`)}
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
        render={({ field }) => {
          const wholeOnly = isWholeQuantityType(type)
          return (
            <DecimalField
              id="asset-quantity"
              label={t(`${fieldPrefix}.quantity`)}
              value={field.value}
              // A share is indivisible: the decimal part is dropped as it is
              // typed rather than accepted and rejected later. A legacy
              // fractional holding still shows as stored until it is edited,
              // and the schema explains why it cannot be saved.
              onChange={wholeOnly ? (raw) => field.onChange(raw.split(',')[0]) : field.onChange}
              onBlur={field.onBlur}
              placeholder="0"
              suffix={wholeOnly ? t(`${fieldPrefix}.quantitySuffix`) : undefined}
              error={errors.quantity?.message}
            />
          )
        }}
      />

      {type === 'gold' ? <GoldUnitField control={control} errors={errors} t={t} /> : null}

      <Controller
        control={control}
        name="purchasePrice"
        render={({ field }) => (
          <MoneyField
            id="asset-purchase-price"
            label={t(`${fieldPrefix}.purchasePrice`)}
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

/**
 * Gold is held in a small, fixed set of units. As free text the same unit came
 * back as "chỉ", "Chi" and "chi vang", which makes two holdings of the same
 * thing look unrelated — so the choice is made from the list instead.
 */
function GoldUnitField({
  control,
  errors,
  t,
}: {
  control: Control
  errors: Errors
  t: Translate
}) {
  return (
    <Controller
      control={control}
      name="unit"
      render={({ field }) => {
        const options = goldUnits.map((unit) => ({
          value: unit as string,
          label: t(`assets.form.market.gold.unitOptions.${unit}`),
        }))
        // A record saved before the list existed keeps its own unit as an extra
        // option, so opening it for edit never silently blanks the field.
        if (field.value && !(goldUnits as readonly string[]).includes(field.value)) {
          options.push({ value: field.value, label: field.value })
        }
        return (
          <Field label={t('assets.form.market.gold.unit')} error={errors.unit?.message}>
            <Segmented value={field.value} onChange={field.onChange} options={options} />
          </Field>
        )
      }}
    />
  )
}

function FormulaFields({
  control,
  errors,
  type,
  earnsInterest,
  t,
}: {
  control: Control
  errors: Errors
  type: AssetType
  earnsInterest: boolean
  t: Translate
}) {
  const isLoan = type === 'loan_receivable'

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

      <Field
        label={t(isLoan ? 'assets.form.loanStartDate' : 'assets.form.startDate')}
        error={errors.startDate?.message}
      >
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

      {/* The due date is optional — many family loans have none — but it is the
          field people reach for next, so it stays in the main section. */}
      {isLoan ? (
        <Field label={t('assets.form.maturityDate')} error={errors.maturityDate?.message}>
          <div className={cn(fieldShell, errors.maturityDate && 'border-alert')}>
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
      ) : null}

      {/* Money lent to family or a friend usually carries no interest, so a rate
          field would be a question with no answer for most loans. */}
      {isLoan ? (
        <ToggleRow
          id="asset-has-interest"
          label={t('assets.form.hasInterest')}
          control={control}
          name="hasInterest"
        />
      ) : null}

      {earnsInterest ? (
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
      ) : null}
    </>
  )
}

/** The §22.2 disclosure half of the formula-mode fields. */
function FormulaExtraFields({
  control,
  errors,
  type,
  earnsInterest,
  isSaving,
  interestDestination,
  walletOptions,
  t,
}: {
  control: Control
  errors: Errors
  type: AssetType
  earnsInterest: boolean
  isSaving: boolean
  interestDestination: AssetForm['interestDestination']
  walletOptions: WalletOption[]
  t: Translate
}) {
  // A loan already asks for its maturity date in the main section.
  const isLoan = type === 'loan_receivable'

  return (
    <>
      {!isLoan ? (
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
      ) : null}

      {/* No interest, no payment schedule to choose. */}
      {earnsInterest ? (
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
      ) : null}

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
