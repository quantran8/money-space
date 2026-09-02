import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { Controller, useWatch, type UseFormReturn, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { useMarketQuote } from '@money-space/core/features/assets/hooks/use-market-quote'
import {
  assetTypeGroups,
  flexibleByDefaultForAssetType,
  searchableAssetClassForType,
  type Asset,
  type AssetType,
  type ValuationMode,
} from '@money-space/core/features/assets/model/assets'
import {
  canBePurchased,
  goldUnits,
  isInterestOptional,
  quotePriceForUnit,
  isWholeQuantityType,
  manualValueLabelKey,
  parseMoneyToVnd,
  type AssetForm,
} from '@money-space/core/features/assets/model/assets-form'
import { useFlexibleMoney } from '@money-space/core/features/forecast/hooks/use-forecast'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { currentMemberId } from '@money-space/core/features/members/model/members.types'
import { formatMoney, formatVndShort, type DisplayCurrency } from '@money-space/core/shared/lib/format-money'
import { useAuthStore } from '@money-space/core/shared/stores/auth-store'

import {
  BottomSheet,
  Button,
  ConsequenceNote,
  DateField,
  DecimalInput,
  Disclosure,
  Field,
  MoneyInput,
  Segmented,
  Select,
  Switch,
} from '@/components/ui'
import { SymbolPicker } from '@/features/assets/components/symbol-picker'

type WalletOption = { value: string; label: string; balance?: number }

/**
 * A field the record cannot change once it exists — shown, not hidden, so the
 * user still sees what they are editing. The field shell with its text muted to
 * `ink3`, which is how the app says "you cannot type here".
 */
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="mb-1.5 t-body-sm text-ink2">{label}</Text>
      <View className="h-[46px] justify-center rounded-control border border-divider bg-wash px-3.5">
        <Text className="t-body text-ink3">{value}</Text>
      </View>
    </View>
  )
}

type Translate = (key: string, params?: Record<string, unknown>) => string
type Control = UseFormReturn<AssetForm>['control']
type Errors = UseFormReturn<AssetForm>['formState']['errors']

/**
 * Create or edit a money source.
 *
 * A bottom sheet, which is what a modal becomes on a phone (§22.9). The form is
 * DISCRIMINATED: which fields exist is decided by the type's valuation mode,
 * and the mode is derived from the type — never picked by the user (the
 * invariant this whole feature rests on).
 *
 * Every field, schema and conversion here comes from core; this file only
 * decides what is on screen and in what order.
 */
export function AssetFormSheet({
  open,
  onOpenChange,
  form,
  setValue,
  mode,
  walletOptions,
  isEditing,
  onBuyMore,
  onAdjustQuantity,
  isSubmitting,
  onSubmit,
  editingAsset,
  onRemove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<AssetForm>
  setValue: UseFormSetValue<AssetForm>
  mode: ValuationMode
  walletOptions: WalletOption[]
  isEditing: boolean
  /** Open the "buy more" flow — editing a holding routes here, not to a text box. */
  onBuyMore?: () => void
  /** Open the "correct this quantity" flow. */
  onAdjustQuantity?: () => void
  isSubmitting: boolean
  onSubmit: () => void
  /** The stored record behind an edit — drives the §22.8 change sentence. */
  editingAsset?: Asset
  /** §22.11 destructive action, on edit only. */
  onRemove?: () => void
}) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const {
    control,
    formState: { errors },
  } = form

  const selectedType = useWatch({ control, name: 'type' })
  const interestDestination = useWatch({ control, name: 'interestDestination' })
  const hasInterest = useWatch({ control, name: 'hasInterest' })
  const isSaving = selectedType === 'saving_deposit'
  // Interest is opt-in only where it is genuinely optional (a loan to family);
  // every other formula type is defined by its rate.
  const earnsInterest = !isInterestOptional(selectedType) || hasInterest

  function handleClose() {
    setShowMore(false)
    onOpenChange(false)
  }

  function handleTypeChange(next: AssetType) {
    setValue('type', next, { shouldDirty: true, shouldValidate: true })
    // Changing the type changes what the money IS, so the flexible-money answer
    // starts over from that type's default rather than carrying a decision made
    // about a different kind of asset.
    setValue('countsAsFlexible', flexibleByDefaultForAssetType(next), { shouldDirty: true })
    // An instrument belongs to exactly one class: "Vàng miếng SJC" is not a
    // crypto symbol, and its venue, unit and per-unit price mean nothing against
    // the new class. Leaving them would submit a position nothing can price.
    setValue('symbol', '', { shouldDirty: true })
    setValue('market', '', { shouldDirty: true })
    setValue('unit', '', { shouldDirty: true })
    setValue('purchasePrice', '', { shouldDirty: true })
    if (next === 'gold') setValue('unit', goldUnits[0], { shouldDirty: true })
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={isEditing ? t('assets.form.updateTitle') : t('assets.form.createTitle')}
      footer={
        <View className="gap-2">
          {/* §22.10 — never disabled on validity. Pressing it with something
              missing must SAY what is missing, not sit inert. */}
          <Button onPress={onSubmit} loading={isSubmitting}>
            {isEditing ? t('assets.form.update') : t('assets.form.create')}
          </Button>
          {/* §22.11 — a text button at the end of the flow, never a bordered
              "danger zone" panel. */}
          {isEditing && onRemove ? (
            <Button variant="destructive" onPress={onRemove}>
              {t('assets.form.remove')}
            </Button>
          ) : null}
        </View>
      }
    >
      <View className="gap-4">
        {/* Locked on edit — a wrong type is deleted and entered again, not
            re-typed over an asset's history (memory/assets.md). */}
        {isEditing ? (
          <LockedField
            label={t('assets.form.type')}
            value={t(`options.assetType.${selectedType}`)}
          />
        ) : (
          <Select
            label={t('assets.form.type')}
            value={selectedType}
            placeholder={t('assets.form.typePlaceholder')}
            error={errors.type?.message}
            searchable={false}
            onChange={handleTypeChange}
            // Grouped by how the value is arrived at: a balance you hold, a price
            // the market sets, everything else.
            options={assetTypeGroups.flatMap((group) =>
              group.types.map((type) => ({
                value: type,
                label: t(`options.assetType.${type}`),
                group: t(`assets.form.typeGroup.${group.id}`),
              })),
            )}
          />
        )}

        {/* A market-priced holding is identified AND named by its symbol, so a
            second name field would ask for the same thing twice. */}
        {mode !== 'market_priced' ? (
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Field
                label={t('assets.form.name')}
                placeholder={t('assets.form.namePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.name?.message}
              />
            )}
          />
        ) : null}

        {mode === 'manual' ? (
          <ManualFields control={control} errors={errors} type={selectedType} t={t} />
        ) : null}

        {mode === 'market_priced' ? (
          <MarketFields
            control={control}
            errors={errors}
            type={selectedType}
            setValue={setValue}
            isEditing={isEditing}
            onBuyMore={onBuyMore}
            onAdjustQuantity={onAdjustQuantity}
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

        {/* Which act is this? It decides whether net worth MOVES, so it belongs
            in the main section — not folded away with the optional details. */}
        {!isEditing && canBePurchased(selectedType) ? (
          <AcquisitionFields
            control={control}
            errors={errors}
            walletOptions={walletOptions}
            t={t}
          />
        ) : null}

        {/* §22.1 — the household's own call on what "money we can use" means.
            It moves the headline number, so the consequence sits right under it. */}
        <Controller
          control={control}
          name="countsAsFlexible"
          render={({ field }) => (
            <Switch
              label={t('assets.form.countsAsFlexible')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
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
          className="gap-4"
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

          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <Field
                label={t('assets.form.note')}
                placeholder={t('assets.form.notePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.note?.message}
                multiline
              />
            )}
          />

          <HolderField form={form} defaultToCurrentMember={!isEditing} />
        </Disclosure>
      </View>
    </BottomSheet>
  )
}

/**
 * §22.7 — the consequence, as ONE SENTENCE, updating per keystroke. On edit it
 * becomes the §22.8 change summary: also a sentence, never a before/after
 * table, and listing only what actually changed.
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

  // A market-priced asset is valued from a live quote, so no honest amount can
  // be shown while typing — never look more certain than the data.
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
          from: formatVndShort(storedValue),
          to: formatVndShort(amount),
        }),
      )
    }
    // Compare the RESOLVED name: for a market holding an empty field means "use
    // the symbol", so comparing the raw field would report a rename that is not
    // happening.
    const nextName =
      name?.trim() || (mode === 'market_priced' ? (symbol?.trim().toUpperCase() ?? '') : '')
    if (nextName && nextName !== editingAsset.name) {
      changes.push(t('assets.form.changeName', { from: editingAsset.name, to: nextName }))
    }
    // Flipping this moves money in and out of the household's headline figure.
    if (countsAsFlexible !== (editingAsset.liquidity === 'usable_now')) {
      changes.push(
        t(countsAsFlexible ? 'assets.form.changeFlexibleOn' : 'assets.form.changeFlexibleOff'),
      )
    }
    if (changes.length === 0) return null
    return <ConsequenceNote>{changes.join(' ')}</ConsequenceNote>
  }

  if (!hasAmount) return null

  // The switch, not the type, decides which sentence is true here.
  if (!countsAsFlexible || !flexibleMoney) {
    return (
      <ConsequenceNote>
        {t('assets.form.effectOther', { amount: formatVndShort(amount) })}
      </ConsequenceNote>
    )
  }

  return (
    <ConsequenceNote>
      {t('assets.form.effectUsable', {
        amount: formatVndShort(amount),
        // Projected client-side (current + this asset) rather than re-fetched
        // per keystroke: it is an estimate of what saving will produce, which is
        // exactly what a "what happens if I do this" line is for.
        flexible: formatVndShort(flexibleMoney.lowestProjectedBalance + amount),
      })}
    </ConsequenceNote>
  )
}

/**
 * "Đã có sẵn" or "Vừa mua" — and, when bought, which wallet paid.
 *
 * Not a detail: declaring gold bought in 2020 RAISES net worth (the household
 * is no richer, just newly honest about what it holds), while buying gold today
 * leaves net worth PUT (money left a wallet and came back as gold). Without the
 * question every entry read as the first, and buying 100tr of gold appeared to
 * create 100tr out of nothing.
 */
function AcquisitionFields({
  control,
  errors,
  walletOptions,
  t,
}: {
  control: Control
  errors: Errors
  walletOptions: WalletOption[]
  t: Translate
}) {
  const acquisition = useWatch({ control, name: 'acquisition' })

  return (
    <>
      <Controller
        control={control}
        name="acquisition"
        render={({ field }) => (
          <Segmented
            label={t('assets.form.acquisition')}
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: 'owned' as const, label: t('assets.form.acquisitionOwned') },
              { value: 'purchased' as const, label: t('assets.form.acquisitionPurchased') },
            ]}
          />
        )}
      />

      {acquisition === 'purchased' ? (
        <Controller
          control={control}
          name="fundingAssetId"
          render={({ field }) => (
            <Select
              label={t('assets.form.payFrom')}
              value={field.value || null}
              placeholder={t('assets.form.payFromPlaceholder')}
              error={errors.fundingAssetId?.message}
              onChange={field.onChange}
              // The balance rides along so the choice can be made here, rather
              // than by trial and error on save.
              options={walletOptions.map((option) => ({
                value: option.value,
                label:
                  option.balance === undefined
                    ? option.label
                    : `${option.label} · ${formatVndShort(option.balance)}`,
              }))}
            />
          )}
        />
      ) : null}
    </>
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
  return (
    <>
      <Controller
        control={control}
        name="value"
        render={({ field }) => (
          <MoneyInput
            // Cash and a bank account hold a BALANCE, not an estimate — calling
            // it "giá trị ước tính" invites a guess at a number already known.
            label={t(manualValueLabelKey(type))}
            value={field.value}
            onChange={field.onChange}
            error={errors.value?.message}
          />
        )}
      />

      {type === 'real_estate' ? (
        <Controller
          control={control}
          name="areaSqm"
          render={({ field }) => (
            <DecimalInput
              label={t('assets.form.areaSqm')}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('assets.form.areaSqmPlaceholder')}
              suffix="m²"
              error={errors.areaSqm?.message}
            />
          )}
        />
      ) : null}
    </>
  )
}

function MarketFields({
  control,
  errors,
  type,
  setValue,
  isEditing,
  onBuyMore,
  onAdjustQuantity,
  t,
}: {
  control: Control
  errors: Errors
  type: AssetType
  setValue: UseFormSetValue<AssetForm>
  isEditing: boolean
  onBuyMore?: () => void
  onAdjustQuantity?: () => void
  t: Translate
}) {
  const fieldPrefix = `assets.form.market.${type}`
  const assetClass = searchableAssetClassForType(type)
  const symbol = useWatch({ control, name: 'symbol' })
  const market = useWatch({ control, name: 'market' })
  // Ask crypto for its quote in đồng: every money field here is VND, but crypto
  // defaults to USD upstream. Crypto ONLY — foreign equities route to a provider
  // that labels a USD price with whatever currency was asked for, which would
  // slip past the guard below and understate the cost basis ~26,000x.
  const quoteCurrency = assetClass === 'crypto' ? 'VND' : undefined

  // A gold quote carries every unit's price, so switching chỉ → gram picks a
  // figure out of the response rather than re-fetching. The backend owns the
  // ratios; converting here let the form and the server's own valuation
  // disagree by the unit's ratio — see memory/asset-valuation.md.
  const unit = useWatch({ control, name: 'unit' })
  const { quote, isLoading, isUnavailable } = useMarketQuote(
    assetClass,
    symbol,
    market,
    quoteCurrency,
  )
  const quotedPrice = quote ? quotePriceForUnit(quote, unit) : null

  // A quote in another currency must NOT be written into a VND field: BTC at
  // 78,188 USD would land as 78,188đ.
  const canPrefill = quote?.quoteCurrency === 'VND'

  // The chosen unit is part of the key, not the quote's: switching chỉ → lượng
  // makes the field's figure wrong by a factor of ten, so that re-prefills even
  // though the symbol — and now the response — has not changed.
  const prefilledFor = useRef<string | null>(null)
  useEffect(() => {
    if (!quote || !canPrefill || quotedPrice === null) return
    const key = `${quote.assetClass}:${quote.symbol}:${unit ?? quote.unit}`
    if (prefilledFor.current === key) return
    prefilledFor.current = key
    // Once per symbol: picking a different instrument re-prefills, while a
    // figure the user edited afterwards survives a stale refetch of the same one.
    setValue('purchasePrice', String(Math.round(quotedPrice)), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [quote, canPrefill, quotedPrice, unit, setValue])

  return (
    <>
      {/* The symbol IS the holding: switching it is a sale plus a purchase,
          not an edit. Same reason the quantity below is read-only. */}
      {isEditing ? (
        <LockedField label={t(`${fieldPrefix}.symbol`)} value={symbol} />
      ) : (
        <Controller
          control={control}
          name="symbol"
          render={({ field }) =>
            assetClass ? (
              <SymbolPicker
                label={t(`${fieldPrefix}.symbol`)}
                assetClass={assetClass}
                value={field.value}
                onChange={field.onChange}
                onSelectSymbol={(reference) => {
                  // The venue/brand rides along so the backend can route pricing,
                  // and the unit comes from reference data rather than a guess.
                  setValue('market', reference.exchange ?? '', { shouldDirty: true })
                  if (reference.unit) setValue('unit', reference.unit, { shouldDirty: true })
                }}
                placeholder={t(`${fieldPrefix}.symbolPlaceholder`)}
                error={errors.symbol?.message}
              />
            ) : (
              // A class with no instrument list behind it keeps a text field — a
              // picker that can only answer "not found" is worse than typing.
              <Field
                label={t(`${fieldPrefix}.symbol`)}
                placeholder={t(`${fieldPrefix}.symbolPlaceholder`)}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.symbol?.message}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            )
          }
        />
      )}

      <MarketQuoteHint
        symbol={symbol}
        quote={quote}
        price={quotedPrice}
        unit={type === 'gold' ? unit : undefined}
        isLoading={isLoading}
        isUnavailable={isUnavailable}
        t={t}
      />

      {/* Editing routes to the act — buy, sell, or correct — rather than letting
          the holding be overwritten. Typing over it moved no money and left no
          event when more was bought, and recorded a corrected typo as the PRICE
          having moved. Mirrors the web form. */}
      {isEditing ? (
        <View className="gap-3 rounded-2xl bg-wash px-4 py-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-ink2">{t(`${fieldPrefix}.quantity`)}</Text>
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <Text className="font-medium text-foreground">{field.value || '0'}</Text>
              )}
            />
          </View>
          <View className="flex-row gap-2">
            <Button variant="secondary" onPress={onBuyMore}>
              {t('assets.purchase.title')}
            </Button>
            <Button variant="secondary" onPress={onAdjustQuantity}>
              {t('assets.quantityAdjustment.title')}
            </Button>
          </View>
        </View>
      ) : (
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => {
            const wholeOnly = isWholeQuantityType(type)
            return (
              <DecimalInput
                label={t(`${fieldPrefix}.quantity`)}
                value={field.value}
                // A share is indivisible: the decimal part is dropped as it is
                // typed rather than accepted and rejected later.
                onChange={wholeOnly ? (raw) => field.onChange(raw.split(',')[0]) : field.onChange}
                placeholder="0"
                suffix={wholeOnly ? t(`${fieldPrefix}.quantitySuffix`) : undefined}
                error={errors.quantity?.message}
              />
            )
          }}
        />
      )}

      {type === 'gold' ? (
        <Controller
          control={control}
          name="unit"
          render={({ field }) => {
            const options = goldUnits.map((unit) => ({
              value: unit as string,
              label: t(`assets.form.market.gold.unitOptions.${unit}`),
            }))
            // A record saved before the list existed keeps its own unit as an
            // extra option, so editing it never silently blanks the field.
            if (field.value && !(goldUnits as readonly string[]).includes(field.value)) {
              options.push({ value: field.value, label: field.value })
            }
            return (
              <Segmented
                label={t('assets.form.market.gold.unit')}
                value={field.value}
                onChange={field.onChange}
                options={options}
              />
            )
          }}
        />
      ) : null}

      <Controller
        control={control}
        name="purchasePrice"
        render={({ field }) => (
          <MoneyInput
            label={t(`${fieldPrefix}.purchasePrice`)}
            value={field.value}
            onChange={field.onChange}
            error={errors.purchasePrice?.message}
          />
        )}
      />
    </>
  )
}

/**
 * The live market price for the chosen symbol.
 *
 * It seeds `purchasePrice` while that field is empty, then stays visible
 * because the two are not the same number: this is what the instrument is worth
 * NOW, while `purchasePrice` is the cost basis — what the household actually
 * paid, which may be years old.
 */
function MarketQuoteHint({
  symbol,
  quote,
  price,
  unit,
  isLoading,
  isUnavailable,
  t,
}: {
  symbol: string
  quote: { price: number; unit: string; quoteCurrency: string; source: string } | null
  /** The quote's price in `unit` — for gold, the unit the form is showing. */
  price: number | null
  /** The chosen gold unit; absent for classes quoted in one unit only. */
  unit?: string
  isLoading: boolean
  isUnavailable: boolean
  t: Translate
}) {
  if (!symbol.trim()) return null

  if (isLoading) {
    return <Text className="t-body-sm text-ink3">{t('assets.form.market.quoteLoading')}</Text>
  }

  if (isUnavailable || !quote || price === null) {
    // The form still submits, valued from whatever the user types.
    return <Text className="t-body-sm text-ink3">{t('assets.form.market.quoteUnavailable')}</Text>
  }

  return (
    <View>
      <Text className="t-body-sm text-ink2">
        {t('assets.form.market.quoteLabel')}{' '}
        <Text className="font-medium text-ink" style={{ fontVariant: ['tabular-nums'] }}>
          {/* `formatMoney`, not the app-wide `formatVndShort`: a quote is
              priced in the EXCHANGE's currency, which is not the household's,
              and only this formatter takes one. */}
          {formatMoney(price, quote.quoteCurrency as DisplayCurrency)} / {unit || quote.unit}
        </Text>
      </Text>
      {/* Every derived number is explainable — this says where it came from. */}
      <Text className="mt-0.5 t-caption-sm text-ink3">
        {t('assets.form.market.quoteSource', { source: quote.source })}
      </Text>
    </View>
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
          <MoneyInput
            label={t('assets.form.principal')}
            value={field.value}
            onChange={field.onChange}
            error={errors.principal?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="startDate"
        render={({ field }) => (
          <DateField
            label={t(isLoan ? 'assets.form.loanStartDate' : 'assets.form.startDate')}
            value={field.value}
            onChange={field.onChange}
            error={errors.startDate?.message}
          />
        )}
      />

      {/* The due date is optional — money lent to family often has none — but
          it is the field people reach for next, so it stays in the main
          section rather than behind the disclosure. */}
      {isLoan ? (
        <Controller
          control={control}
          name="maturityDate"
          render={({ field }) => (
            <DateField
              label={t('assets.form.maturityDate')}
              value={field.value}
              onChange={field.onChange}
              error={errors.maturityDate?.message}
            />
          )}
        />
      ) : null}

      {/* Money lent to family or a friend usually carries no interest, so a
          rate field would be a question with no answer for most loans. */}
      {isLoan ? (
        <Controller
          control={control}
          name="hasInterest"
          render={({ field }) => (
            <Switch
              label={t('assets.form.hasInterest')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}

      {earnsInterest ? (
        <Controller
          control={control}
          name="interestRate"
          render={({ field }) => (
            <DecimalInput
              label={t('assets.form.interestRate')}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('assets.form.interestRatePlaceholder')}
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
        <Controller
          control={control}
          name="maturityDate"
          render={({ field }) => (
            <DateField
              label={t('assets.form.maturityDate')}
              value={field.value}
              onChange={field.onChange}
              error={errors.maturityDate?.message}
            />
          )}
        />
      ) : null}

      {/* No interest, no payment schedule to choose. */}
      {earnsInterest ? (
        <Controller
          control={control}
          name="interestPayment"
          render={({ field }) => (
            <Segmented
              label={t('assets.form.interestPayment')}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'end_of_term' as const, label: t('options.interestPayment.end_of_term') },
                { value: 'monthly' as const, label: t('options.interestPayment.monthly') },
              ]}
            />
          )}
        />
      ) : null}

      {isSaving ? (
        <>
          <Controller
            control={control}
            name="nonTermRate"
            render={({ field }) => (
              <DecimalInput
                label={t('assets.form.nonTermRate')}
                value={field.value}
                onChange={field.onChange}
                placeholder={t('assets.form.nonTermRatePlaceholder')}
                error={errors.nonTermRate?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="interestDestination"
            render={({ field }) => (
              <Segmented
                label={t('assets.form.interestDestination')}
                value={field.value}
                onChange={field.onChange}
                options={[
                  {
                    value: 'principal' as const,
                    label: t('options.interestDestination.principal'),
                  },
                  { value: 'wallet' as const, label: t('options.interestDestination.wallet') },
                ]}
              />
            )}
          />

          {interestDestination === 'wallet' ? (
            <Controller
              control={control}
              name="receivingWalletId"
              render={({ field }) => (
                <Select
                  label={t('assets.form.receivingWallet')}
                  value={field.value || null}
                  placeholder={t('assets.form.receivingWalletPlaceholder')}
                  error={errors.receivingWalletId?.message}
                  onChange={field.onChange}
                  options={walletOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              )}
            />
          ) : null}
        </>
      ) : null}
    </>
  )
}

/**
 * Who is RESPONSIBLE for a money source — never who spent from it.
 *
 * The distinction is the product's voice, not a wording preference: "ai phụ
 * trách" is a household arrangement; "ai đã tiêu" is surveillance of a partner.
 */
function HolderField({
  form,
  defaultToCurrentMember,
}: {
  form: UseFormReturn<AssetForm>
  defaultToCurrentMember: boolean
}) {
  const { t } = useTranslation()
  const { control, setValue } = form
  const { members } = useMembers()
  const userId = useAuthStore((state) => state.user?.id)
  const holderMemberId = useWatch({ control, name: 'holderMemberId' })
  const creatorMemberId = currentMemberId(members, userId)

  useEffect(() => {
    if (defaultToCurrentMember && !holderMemberId && creatorMemberId) {
      setValue('holderMemberId', creatorMemberId)
    }
  }, [creatorMemberId, defaultToCurrentMember, holderMemberId, setValue])

  return (
    <Controller
      control={control}
      name="holderMemberId"
      render={({ field }) => (
        <Select
          label={t('assets.form.holder')}
          value={field.value || null}
          placeholder={t('assets.form.holderPlaceholder')}
          onChange={field.onChange}
          options={members
            .filter((member) => member.status === 'active')
            .map((member) => ({ value: member.id, label: member.name || member.email }))}
        />
      )}
    />
  )
}
