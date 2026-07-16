import { useState, type ComponentProps } from 'react'
import { Controller, useWatch, type UseFormReturn, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventDecimalInput,
  EventField as BaseEventField,
  EventFieldInput,
  EventFieldTextarea,
  EventMoneyInput,
  eventDateTriggerClass,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  assetClassForType,
  assetTypeOrder,
  defaultLiquidityForType,
  liquidityOrder,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'
import { type AssetForm } from '@/features/assets/model/assets-form'
import type { SymbolAssetClass } from '@/features/assets/api/symbols.repository'
import { SymbolCombobox } from '@/features/assets/ui/components/symbol-combobox'
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
}

const POPULAR_TYPES: AssetType[] = ['cash', 'bank_account', 'saving_deposit', 'gold']
const INVESTMENT_TYPES: AssetType[] = ['stock', 'crypto', 'real_estate', 'other']
const EXTRA_TYPES = assetTypeOrder.filter(
  (type) => !POPULAR_TYPES.includes(type) && !INVESTMENT_TYPES.includes(type),
)

const TYPE_META: Record<AssetType, { icon: string; description: string }> = {
  cash: { icon: '💵', description: 'Tiền đang giữ trực tiếp.' },
  bank_account: { icon: '🏦', description: 'Số dư có thể sử dụng.' },
  saving_deposit: { icon: '🔒', description: 'Tiền gửi có kỳ hạn.' },
  certificate_of_deposit: { icon: '📜', description: 'Chứng chỉ có thời hạn.' },
  bond: { icon: '📄', description: 'Trái phiếu và lãi định kỳ.' },
  loan_receivable: { icon: '🤝', description: 'Khoản tiền cho người khác vay.' },
  gold: { icon: '🟡', description: 'Theo lượng và giá hiện tại.' },
  stock: { icon: '📈', description: 'Mã, số lượng và giá mua.' },
  fund: { icon: '📊', description: 'Chứng chỉ quỹ đang nắm giữ.' },
  crypto: { icon: '₿', description: 'Coin, số lượng và giá vốn.' },
  foreign_currency: { icon: '💱', description: 'Ngoại tệ theo tỷ giá.' },
  real_estate: { icon: '🏠', description: 'Giá trị ước tính hiện tại.' },
  insurance: { icon: '🛡️', description: 'Giá trị hợp đồng bảo hiểm.' },
  investment: { icon: '💼', description: 'Khoản đầu tư dài hạn khác.' },
  other: { icon: '＋', description: 'Tài sản chưa thuộc nhóm trên.' },
}

const MODE_HINTS: Record<ValuationMode, string> = {
  manual: 'Giá trị hiện tại được nhập và cập nhật thủ công.',
  market_priced: 'Giá trị được tính từ số lượng và giá thị trường.',
  formula_calculated: 'Giá trị được tính từ số tiền gốc, lãi suất và thời hạn.',
}

function EventField(props: ComponentProps<typeof BaseEventField>) {
  return <BaseEventField {...props} variant="outline" />
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
}: AssetFormDialogProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1)
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
  } = form
  const selectedType = watch('type')
  const interestDestination = watch('interestDestination')
  const isSaving = selectedType === 'saving_deposit'
  const isRealEstate = selectedType === 'real_estate'

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setStep(isEditing ? 2 : 1)
    onOpenChange(nextOpen)
  }

  function selectType(type: AssetType) {
    setValue('type', type, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setValue('liquidity', defaultLiquidityForType(type), {
      shouldDirty: true,
      shouldValidate: true,
    })
    setStep(2)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[94dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 shadow-[0_35px_100px_rgba(20,20,28,0.22)] sm:max-w-[820px]">
        <ResponsiveDialogHeader className="border-b border-border px-6 py-5 pr-14 text-left sm:px-8 sm:py-6 sm:pr-16">
          <p className="text-xs font-medium text-muted-foreground">
            {isEditing ? t('assets.form.editEyebrow') : 'Tài sản mới'}
          </p>
          <ResponsiveDialogTitle className="mt-2 text-[27px] font-semibold tracking-[-0.045em] sm:text-[31px]">
            {isEditing ? t('assets.form.editTitle') : 'Thêm tài sản'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-2 max-w-xl text-sm leading-6">
            {step === 1
              ? 'Chọn loại tài sản để bắt đầu.'
              : 'Thêm thông tin cơ bản trước. Bạn luôn có thể chỉnh sửa hoặc bổ sung chi tiết sau.'}
          </ResponsiveDialogDescription>

        </ResponsiveDialogHeader>

        <form className="grid min-h-0 grid-rows-[1fr_auto]" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
            {step === 1 ? (
              <div className="space-y-7">
                <AssetTypeGroup title="Loại phổ biến" types={POPULAR_TYPES} selectedType={selectedType} onSelect={selectType} />
                <AssetTypeGroup title="Đầu tư và tài sản khác" types={INVESTMENT_TYPES} selectedType={selectedType} onSelect={selectType} />
                <AssetTypeGroup title="Thêm lựa chọn" types={EXTRA_TYPES} selectedType={selectedType} onSelect={selectType} compact />
              </div>
            ) : (
              <div className="mx-auto max-w-[700px] space-y-7">
                  <section>
                  <div className="mb-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Loại tài sản</p>
                      <h3 className="mt-1.5 text-[19px] font-semibold tracking-[-0.025em]">Bạn đang thêm khoản nào?</h3>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="rounded-full px-3 py-2 text-sm font-medium text-[hsl(var(--accent))] transition hover:bg-[hsla(var(--accent),0.06)]">Đổi loại</button>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="flex w-full items-center gap-4 rounded-[22px] border border-border bg-card p-4 text-left transition hover:border-foreground/20">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-xl">{TYPE_META[selectedType].icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{t(`options.assetType.${selectedType}`)}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{TYPE_META[selectedType].description}</span>
                    </span>
                    <span className="text-xl text-muted-foreground">›</span>
                  </button>
                  </section>

                    <EventField label="Tên tài sản" error={errors.name?.message}>
                      <EventFieldInput className="py-1 text-[15px]" placeholder="Ví dụ: Tiền sinh hoạt, tài khoản TCB..." {...register('name')} />
                    </EventField>

                    <EventField label="Khoản này dùng cho mục đích nào?" error={errors.liquidity?.message}>
                      <Controller control={control} name="liquidity" render={({ field }) => (
                        <div className="grid grid-cols-3 gap-1.5 rounded-[14px] border border-border bg-card p-1.5">
                          {liquidityOrder.map((item) => (
                            <button key={item} type="button" onClick={() => field.onChange(item)} className={cn('rounded-[13px] px-2 py-3 text-sm font-medium transition', field.value === item ? 'bg-foreground text-background shadow-[0_8px_18px_rgba(20,20,22,0.13)]' : 'text-muted-foreground hover:text-foreground')}>
                              {t(`options.liquidity.${item}`)}
                            </button>
                          ))}
                        </div>
                      )} />
                    </EventField>

                  <div className="flex items-start gap-3 rounded-[18px] border border-[hsla(var(--accent),0.1)] bg-[hsla(var(--accent),0.045)] px-4 py-3.5">
                    <span className="rounded-full bg-[hsla(var(--accent),0.12)] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--accent))]">{t(`options.valuationMode.${mode}`)}</span>
                    <p className="text-xs leading-5 text-muted-foreground">{MODE_HINTS[mode]}</p>
                  </div>

                  {mode === 'manual' ? (
                    <div className={cn('grid gap-4', isRealEstate && 'sm:grid-cols-2')}>
                      <EventField label="Giá trị hiện tại" error={errors.value?.message} trailing={<span className="text-sm text-muted-foreground">VND</span>}>
                        <Controller control={control} name="value" render={({ field }) => <EventMoneyInput placeholder="0" className="text-[26px] sm:text-[30px]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
                      </EventField>
                      {isRealEstate ? <EventField label="Diện tích" error={errors.areaSqm?.message} trailing={<span className="text-sm text-muted-foreground">m²</span>}><Controller control={control} name="areaSqm" render={({ field }) => <EventDecimalInput placeholder="0" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField> : null}
                    </div>
                  ) : null}

                  {mode === 'market_priced' ? <MarketFields control={control} register={register} errors={errors} assetType={selectedType} setValue={setValue} /> : null}

                  {mode === 'formula_calculated' ? (
                    <FormulaFields
                      control={control}
                      errors={errors}
                      isSaving={isSaving}
                      interestDestination={interestDestination}
                      walletOptions={walletOptions}
                      t={t}
                    />
                  ) : null}

                  <EventField label="Ghi chú · Không bắt buộc" error={errors.note?.message}>
                    <EventFieldTextarea className="pt-1 text-[15px]" rows={3} placeholder="Ví dụ: Tiền dùng cho sinh hoạt hằng tháng..." {...register('note')} />
                  </EventField>
              </div>
            )}
          </div>

          <ResponsiveDialogFooter className="flex-row items-center justify-between border-t border-border px-6 py-4 sm:px-8">
            <div>{step === 2 ? <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Quay lại</Button> : null}</div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
              {step === 2 ? <Button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Đang lưu...' : isEditing ? t('assets.form.save') : 'Lưu tài sản'}</Button> : null}
            </div>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function AssetTypeGroup({ title, types, selectedType, onSelect, compact = false }: { title: string; types: AssetType[]; selectedType: AssetType; onSelect: (type: AssetType) => void; compact?: boolean }) {
  const { t } = useTranslation()
  return <section><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p><div className={cn('mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4', compact && 'lg:grid-cols-5')}>{types.map((type) => { const meta = TYPE_META[type]; const active = selectedType === type; return <button key={type} type="button" onClick={() => onSelect(type)} className={cn('rounded-2xl border p-4 text-left transition hover:bg-muted/50', active ? 'border-foreground bg-muted/65 shadow-sm' : 'border-border bg-card')}><div className="grid size-10 place-items-center rounded-xl bg-muted text-lg">{meta.icon}</div><p className="mt-4 text-sm font-semibold">{t(`options.assetType.${type}`)}</p>{!compact ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.description}</p> : null}</button> })}</div></section>
}

function MarketFields({ control, register, errors, assetType, setValue }: { control: UseFormReturn<AssetForm>['control']; register: UseFormReturn<AssetForm>['register']; errors: UseFormReturn<AssetForm>['formState']['errors']; assetType: AssetType; setValue: UseFormSetValue<AssetForm> }) {
  const assetClass = assetClassForType(assetType)
  const currentUnit = useWatch({ control, name: 'unit' })
  // Stock & crypto get the searchable symbol picker (Twelve Data reference
  // data); other market classes (e.g. gold) keep a free-text symbol input.
  const searchableClass: SymbolAssetClass | undefined = assetClass === 'stock' || assetClass === 'crypto' ? assetClass : undefined
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><EventField label="Mã / Ký hiệu" error={errors.symbol?.message}>{searchableClass ? <Controller control={control} name="symbol" render={({ field }) => <SymbolCombobox assetClass={searchableClass} value={field.value} onChange={field.onChange} onSelectSymbol={(symbol) => { if (!currentUnit?.trim()) setValue('unit', symbol.unit, { shouldDirty: true, shouldValidate: true }) }} />} /> : <EventFieldInput className="uppercase" placeholder="SJC" {...register('symbol')} />}</EventField><EventField label="Số lượng" error={errors.quantity?.message}><Controller control={control} name="quantity" render={({ field }) => <EventDecimalInput placeholder="0" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField><EventField label="Đơn vị" error={errors.unit?.message}><EventFieldInput placeholder="cp, coin, lượng" {...register('unit')} /></EventField></div><EventField label="Giá mua mỗi đơn vị" error={errors.purchasePrice?.message} trailing={<span className="text-xs text-muted-foreground">VND</span>}><Controller control={control} name="purchasePrice" render={({ field }) => <EventMoneyInput placeholder="0" className="text-[20px] sm:text-[22px]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField></div>
}

function FormulaFields({ control, errors, isSaving, interestDestination, walletOptions, t }: { control: UseFormReturn<AssetForm>['control']; errors: UseFormReturn<AssetForm>['formState']['errors']; isSaving: boolean; interestDestination: AssetForm['interestDestination']; walletOptions: WalletOption[]; t: (key: string, params?: Record<string, unknown>) => string }) {
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><EventField label="Số tiền gốc" error={errors.principal?.message} trailing={<span className="text-xs text-muted-foreground">VND</span>}><Controller control={control} name="principal" render={({ field }) => <EventMoneyInput placeholder="0" className="text-[20px] sm:text-[22px]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField><EventField label="Lãi suất" error={errors.interestRate?.message} trailing={<span className="text-xs text-muted-foreground">% / năm</span>}><Controller control={control} name="interestRate" render={({ field }) => <EventDecimalInput placeholder="4,8" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField><EventField label="Ngày bắt đầu" error={errors.startDate?.message}><Controller control={control} name="startDate" render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />} /></EventField><EventField label="Ngày đáo hạn" error={errors.maturityDate?.message}><Controller control={control} name="maturityDate" render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />} /></EventField><EventField label="Hình thức nhận lãi" error={errors.interestPayment?.message}><Controller control={control} name="interestPayment" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className={eventSelectTriggerClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="end_of_term">{t('options.interestPayment.end_of_term')}</SelectItem><SelectItem value="monthly">{t('options.interestPayment.monthly')}</SelectItem></SelectContent></Select>} /></EventField>{isSaving ? <EventField label="Lãi không kỳ hạn" error={errors.nonTermRate?.message} trailing={<span className="text-xs text-muted-foreground">% / năm</span>}><Controller control={control} name="nonTermRate" render={({ field }) => <EventDecimalInput placeholder="0,2" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField> : null}</div>{isSaving ? <div className="grid gap-4 sm:grid-cols-2"><EventField label="Nơi nhận tiền lãi" error={errors.interestDestination?.message}><Controller control={control} name="interestDestination" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className={eventSelectTriggerClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="principal">{t('options.interestDestination.principal')}</SelectItem><SelectItem value="wallet">{t('options.interestDestination.wallet')}</SelectItem></SelectContent></Select>} /></EventField>{interestDestination === 'wallet' ? <EventField label="Ví nhận lãi" error={errors.receivingWalletId?.message}><Controller control={control} name="receivingWalletId" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className={eventSelectTriggerClass}><SelectValue placeholder="Chọn ví nhận lãi" /></SelectTrigger><SelectContent>{walletOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>} /></EventField> : null}</div> : null}</div>
}
