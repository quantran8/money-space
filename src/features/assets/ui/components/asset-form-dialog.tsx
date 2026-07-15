import { useState } from 'react'
import { Controller, type UseFormReturn, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventDecimalInput,
  EventField,
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
  assetTypeOrder,
  defaultLiquidityForType,
  liquidityOrder,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'
import { type AssetForm } from '@/features/assets/model/assets-form'
import { ComputedPreview } from '@/features/assets/ui/components/computed-preview'
import { cn } from '@/shared/lib/utils'

type WalletOption = { value: string; label: string }

type AssetFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<AssetForm>
  setValue: UseFormSetValue<AssetForm>
  mode: ValuationMode
  previewValue: number | null
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

export function AssetFormDialog({
  open,
  onOpenChange,
  form,
  setValue,
  mode,
  previewValue,
  walletOptions,
  isEditing,
  isSubmitting,
  onSubmit,
}: AssetFormDialogProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<1 | 2>(1)
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
  } = form
  const selectedType = watch('type')
  const liquidity = watch('liquidity')
  const name = watch('name')
  const interestDestination = watch('interestDestination')
  const isSaving = selectedType === 'saving_deposit'
  const isRealEstate = selectedType === 'real_estate'

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setStep(1)
    onOpenChange(nextOpen)
  }

  function selectType(type: AssetType) {
    setValue('type', type, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setValue('liquidity', defaultLiquidityForType(type), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[92dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[980px]">
        <ResponsiveDialogHeader className="border-b border-border px-6 py-5 pr-14 text-left sm:px-8 sm:pr-16">
          <p className="text-xs font-medium text-muted-foreground">
            {isEditing ? t('assets.form.editEyebrow') : 'Tài sản mới'}
          </p>
          <ResponsiveDialogTitle className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
            {isEditing ? t('assets.form.editTitle') : 'Thêm tài sản'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-2 max-w-xl text-sm leading-6">
            Chọn loại tài sản trước. Ứng dụng chỉ hiển thị những thông tin phù hợp với loại đó.
          </ResponsiveDialogDescription>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <StepTab step={1} active={step === 1} label="Chọn loại tài sản" onClick={() => setStep(1)} />
            <StepTab step={2} active={step === 2} label="Nhập thông tin" onClick={() => setStep(2)} />
          </div>
        </ResponsiveDialogHeader>

        <form className="grid min-h-0 grid-rows-[1fr_auto]" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
            {step === 1 ? (
              <div className="space-y-7">
                <AssetTypeGroup title="Loại phổ biến" types={POPULAR_TYPES} selectedType={selectedType} onSelect={selectType} />
                <AssetTypeGroup title="Đầu tư và tài sản khác" types={INVESTMENT_TYPES} selectedType={selectedType} onSelect={selectType} />
                <AssetTypeGroup title="Thêm lựa chọn" types={EXTRA_TYPES} selectedType={selectedType} onSelect={selectType} compact />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <div className="space-y-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Thông tin tài sản</p>
                      <h3 className="mt-1 text-lg font-semibold">{t(`options.assetType.${selectedType}`)}</h3>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Đổi loại</button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <EventField label="Tên hiển thị" error={errors.name?.message}>
                      <EventFieldInput placeholder="Ví dụ: Tài khoản sinh hoạt, FPT" {...register('name')} />
                    </EventField>
                    <EventField label="Nhóm thanh khoản" error={errors.liquidity?.message}>
                      <Controller control={control} name="liquidity" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}><SelectValue /></SelectTrigger>
                          <SelectContent>{liquidityOrder.map((item) => <SelectItem key={item} value={item}>{t(`options.liquidity.${item}`)}</SelectItem>)}</SelectContent>
                        </Select>
                      )} />
                    </EventField>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-muted/65 px-4 py-3">
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

                  {mode === 'market_priced' ? <MarketFields control={control} register={register} errors={errors} previewValue={previewValue} /> : null}

                  {mode === 'formula_calculated' ? (
                    <FormulaFields
                      control={control}
                      errors={errors}
                      isSaving={isSaving}
                      interestDestination={interestDestination}
                      walletOptions={walletOptions}
                      previewValue={previewValue}
                      t={t}
                    />
                  ) : null}

                  <EventField label="Ghi chú" error={errors.note?.message}>
                    <EventFieldTextarea rows={3} placeholder="Thông tin cần nhớ..." {...register('note')} />
                  </EventField>
                </div>

                <aside className="h-fit rounded-2xl bg-muted/65 p-5 lg:sticky lg:top-0">
                  <p className="text-xs font-medium text-muted-foreground">Tóm tắt</p>
                  <h3 className="mt-1 truncate text-lg font-semibold">{name.trim() || (isEditing ? 'Tài sản cập nhật' : 'Tài sản mới')}</h3>
                  <div className="mt-5 divide-y divide-border">
                    <SummaryRow label="Loại tài sản" value={t(`options.assetType.${selectedType}`)} />
                    <SummaryRow label="Nhóm thanh khoản" value={t(`options.liquidity.${liquidity}`)} />
                    <SummaryRow label="Cách định giá" value={t(`options.valuationMode.${mode}`)} />
                    {previewValue != null ? <SummaryRow label="Giá trị dự kiến" value={`${new Intl.NumberFormat('vi-VN').format(Math.round(previewValue))} đ`} /> : null}
                  </div>
                  <p className="mt-5 text-xs leading-5 text-muted-foreground">{MODE_HINTS[mode]}</p>
                </aside>
              </div>
            )}
          </div>

          <ResponsiveDialogFooter className="flex-row items-center justify-between border-t border-border px-6 py-4 sm:px-8">
            <div>{step === 2 ? <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Quay lại</Button> : null}</div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
              {step === 1 ? <Button type="button" onClick={() => setStep(2)}>Tiếp tục</Button> : <Button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Đang lưu...' : isEditing ? t('assets.form.save') : 'Lưu tài sản'}</Button>}
            </div>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function StepTab({ step, active, label, onClick }: { step: number; active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn('rounded-xl px-4 py-3 text-left transition', active ? 'bg-[#1d1d1f] text-white' : 'bg-muted text-muted-foreground')}><p className={cn('text-[11px] font-medium', active ? 'text-white/45' : 'text-muted-foreground/70')}>Bước {step}</p><p className="mt-1 text-sm font-semibold">{label}</p></button>
}

function AssetTypeGroup({ title, types, selectedType, onSelect, compact = false }: { title: string; types: AssetType[]; selectedType: AssetType; onSelect: (type: AssetType) => void; compact?: boolean }) {
  const { t } = useTranslation()
  return <section><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p><div className={cn('mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4', compact && 'lg:grid-cols-5')}>{types.map((type) => { const meta = TYPE_META[type]; const active = selectedType === type; return <button key={type} type="button" onClick={() => onSelect(type)} className={cn('rounded-2xl border p-4 text-left transition hover:bg-muted/50', active ? 'border-foreground bg-muted/65 shadow-sm' : 'border-border bg-card')}><div className="grid size-10 place-items-center rounded-xl bg-muted text-lg">{meta.icon}</div><p className="mt-4 text-sm font-semibold">{t(`options.assetType.${type}`)}</p>{!compact ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.description}</p> : null}</button> })}</div></section>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="max-w-[65%] truncate text-right text-sm font-semibold">{value}</span></div>
}

function MarketFields({ control, register, errors, previewValue }: { control: UseFormReturn<AssetForm>['control']; register: UseFormReturn<AssetForm>['register']; errors: UseFormReturn<AssetForm>['formState']['errors']; previewValue: number | null }) {
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><EventField label="Mã / Ký hiệu" error={errors.symbol?.message}><EventFieldInput className="uppercase" placeholder="FPT, BTC, SJC" {...register('symbol')} /></EventField><EventField label="Số lượng" error={errors.quantity?.message}><Controller control={control} name="quantity" render={({ field }) => <EventDecimalInput placeholder="0" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField><EventField label="Đơn vị" error={errors.unit?.message}><EventFieldInput placeholder="cp, coin, lượng" {...register('unit')} /></EventField></div><EventField label="Giá mua mỗi đơn vị" error={errors.purchasePrice?.message} trailing={<span className="text-xs text-muted-foreground">VND</span>}><Controller control={control} name="purchasePrice" render={({ field }) => <EventMoneyInput placeholder="0" className="text-[20px] sm:text-[22px]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField><ComputedPreview value={previewValue} /></div>
}

function FormulaFields({ control, errors, isSaving, interestDestination, walletOptions, previewValue, t }: { control: UseFormReturn<AssetForm>['control']; errors: UseFormReturn<AssetForm>['formState']['errors']; isSaving: boolean; interestDestination: AssetForm['interestDestination']; walletOptions: WalletOption[]; previewValue: number | null; t: (key: string, params?: Record<string, unknown>) => string }) {
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><EventField label="Số tiền gốc" error={errors.principal?.message} trailing={<span className="text-xs text-muted-foreground">VND</span>}><Controller control={control} name="principal" render={({ field }) => <EventMoneyInput placeholder="0" className="text-[20px] sm:text-[22px]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField><EventField label="Lãi suất" error={errors.interestRate?.message} trailing={<span className="text-xs text-muted-foreground">% / năm</span>}><Controller control={control} name="interestRate" render={({ field }) => <EventDecimalInput placeholder="4,8" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField><EventField label="Ngày bắt đầu" error={errors.startDate?.message}><Controller control={control} name="startDate" render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />} /></EventField><EventField label="Ngày đáo hạn" error={errors.maturityDate?.message}><Controller control={control} name="maturityDate" render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className={eventDateTriggerClass} />} /></EventField><EventField label="Hình thức nhận lãi" error={errors.interestPayment?.message}><Controller control={control} name="interestPayment" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className={eventSelectTriggerClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="end_of_term">{t('options.interestPayment.end_of_term')}</SelectItem><SelectItem value="monthly">{t('options.interestPayment.monthly')}</SelectItem></SelectContent></Select>} /></EventField>{isSaving ? <EventField label="Lãi không kỳ hạn" error={errors.nonTermRate?.message} trailing={<span className="text-xs text-muted-foreground">% / năm</span>}><Controller control={control} name="nonTermRate" render={({ field }) => <EventDecimalInput placeholder="0,2" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></EventField> : null}</div>{isSaving ? <div className="grid gap-4 sm:grid-cols-2"><EventField label="Nơi nhận tiền lãi" error={errors.interestDestination?.message}><Controller control={control} name="interestDestination" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className={eventSelectTriggerClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="principal">{t('options.interestDestination.principal')}</SelectItem><SelectItem value="wallet">{t('options.interestDestination.wallet')}</SelectItem></SelectContent></Select>} /></EventField>{interestDestination === 'wallet' ? <EventField label="Ví nhận lãi" error={errors.receivingWalletId?.message}><Controller control={control} name="receivingWalletId" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className={eventSelectTriggerClass}><SelectValue placeholder="Chọn ví nhận lãi" /></SelectTrigger><SelectContent>{walletOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>} /></EventField> : null}</div> : null}<ComputedPreview value={previewValue} /></div>
}
