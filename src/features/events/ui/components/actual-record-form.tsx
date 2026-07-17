import {
  Banknote,
  CalendarDays,
  Car,
  Check,
  Gift,
  Goal,
  HeartPulse,
  House,
  Landmark,
  MoreHorizontal,
  Plus,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Controller } from 'react-hook-form'
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventFieldInput,
  EventFieldTextarea,
  EventMoneyInput,
} from '@/components/ui/event-field'
import { ResponsiveDialogFooter } from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type {
  ActualRecordForm as ActualRecordFormValues,
  LocalUpcomingPayment,
  QuickAction,
} from '@/features/events/model/events-form'
import { cn } from '@/shared/lib/utils'

type Option = { value: string; label: string }

type ActualRecordFormProps = {
  control: Control<ActualRecordFormValues>
  register: UseFormRegister<ActualRecordFormValues>
  errors: FieldErrors<ActualRecordFormValues>
  handleSubmit: UseFormHandleSubmit<ActualRecordFormValues>
  onSubmit: (values: ActualRecordFormValues) => void
  quickAction: QuickAction
  isRevaluation?: boolean
  markPaidPaymentId: string | null
  selectedUpcomingForMarkPaid?: LocalUpcomingPayment
  payments: LocalUpcomingPayment[]
  assetOptions: Option[]
  sourceAssetOptions: Option[]
  categoryOptions: Option[]
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
  isValid: boolean
  isSaving: boolean
  onCancel: () => void
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  income: Banknote,
  interest: Sparkles,
  investment: Sparkles,
  housing: House,
  household: House,
  transport: Car,
  health: HeartPulse,
  family_support: Gift,
  other: MoreHorizontal,
}

const CATEGORY_PRIORITY: Record<'income' | 'expense', string[]> = {
  income: ['income', 'interest', 'investment', 'other'],
  expense: ['household', 'housing', 'transport', 'other'],
}

const rowSelectClass =
  'h-auto w-full min-w-0 justify-end rounded-none border-0 bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:ring-0 [&>span]:truncate [&>svg]:ml-2 [&>svg]:shrink-0'

function getFeaturedCategories(options: Option[], action: 'income' | 'expense') {
  const featured = CATEGORY_PRIORITY[action]
    .map((code) => options.find((option) => option.value === code))
    .filter((option): option is Option => Boolean(option))

  for (const option of options) {
    if (featured.length >= 4) break
    if (!featured.some((item) => item.value === option.value)) featured.push(option)
  }

  return featured.slice(0, 4)
}

function DetailRow({
  icon: Icon,
  iconClassName,
  title,
  hint,
  children,
  error,
}: {
  icon: LucideIcon
  iconClassName: string
  title: string
  hint?: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <div className="flex min-h-16 items-center gap-3 px-4 py-3">
        <div className={cn('grid size-9 shrink-0 place-items-center rounded-xl text-white', iconClassName)}>
          <Icon className="size-[18px]" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="flex w-[46%] min-w-0 shrink-0 justify-end">{children}</div>
      </div>
      {error ? <p className="px-4 pb-3 text-xs font-medium text-[hsl(var(--status-red))]">{error}</p> : null}
    </div>
  )
}

export function ActualRecordForm({
  control,
  register,
  errors,
  handleSubmit,
  onSubmit,
  quickAction,
  isRevaluation = false,
  markPaidPaymentId,
  selectedUpcomingForMarkPaid,
  payments,
  assetOptions,
  sourceAssetOptions,
  categoryOptions,
  showMoreDetails,
  onToggleMoreDetails,
  isValid,
  isSaving,
  onCancel,
}: ActualRecordFormProps) {
  const isIncome = quickAction === 'income'
  const isExpense = quickAction === 'expense' || quickAction === 'payment_paid'
  const categoryAction = isIncome ? 'income' : 'expense'
  const featuredCategories = getFeaturedCategories(categoryOptions, categoryAction)

  const amountQuestion = isRevaluation
    ? 'Giá trị thay đổi bao nhiêu?'
    : isIncome
      ? 'Bạn vừa nhận bao nhiêu?'
      : quickAction === 'transfer'
        ? 'Bạn muốn chuyển bao nhiêu?'
        : quickAction === 'goal_contribution'
          ? 'Bạn muốn góp bao nhiêu?'
          : 'Bạn vừa chi bao nhiêu?'

  return (
    <form className="min-w-0 max-w-full space-y-6 overflow-x-hidden" onSubmit={handleSubmit(onSubmit)} noValidate>
      {isRevaluation ? (
        <Controller
          control={control}
          name="revaluationDirection"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
              {(['increase', 'decrease'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={cn(
                    'rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                    field.value === value ? 'bg-card shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  {value === 'increase' ? 'Tăng giá trị' : 'Giảm giá trị'}
                </button>
              ))}
            </div>
          )}
        />
      ) : null}

      <div>
        <div
          className={cn(
            'rounded-[26px] border border-[#3291ff] bg-[radial-gradient(circle_at_88%_8%,rgba(80,154,255,0.16),transparent_42%),linear-gradient(145deg,#ffffff,#f8fbff)] px-5 py-5 shadow-[0_14px_38px_rgba(50,145,255,0.12)] dark:bg-none dark:bg-card sm:px-6',
            errors.amount && 'border-[hsl(var(--status-red))]',
          )}
        >
          <p className="text-sm font-semibold text-muted-foreground">{amountQuestion}</p>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <div className="mt-2 flex items-end gap-3">
                <EventMoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  className="text-[46px] leading-none sm:text-[54px]"
                />
                <span className="pb-1 text-xl font-semibold text-muted-foreground">₫</span>
              </div>
            )}
          />
          <p className="mt-3 text-xs text-muted-foreground">Ví dụ: 5.000.000</p>
        </div>
        {errors.amount ? (
          <p className="mt-2 px-1 text-sm font-medium text-[hsl(var(--status-red))]">
            {errors.amount.message}
          </p>
        ) : null}
      </div>

      {!isRevaluation && (quickAction === 'expense' || quickAction === 'income') ? (
        <div>
          <p className="mb-3 text-sm font-semibold">Khoản này là gì?</p>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {featuredCategories.map((option) => {
                    const Icon = CATEGORY_ICON[option.value] ?? MoreHorizontal
                    const active = field.value === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          'group rounded-[22px] border px-3 py-4 text-center transition',
                          active
                            ? 'border-[#3291ff] bg-card shadow-[0_8px_24px_rgba(50,145,255,0.10)]'
                            : 'border-transparent bg-muted/75 hover:bg-muted',
                        )}
                      >
                        <span className={cn(
                          'mx-auto grid size-9 place-items-center rounded-xl bg-card text-muted-foreground shadow-sm',
                          active && 'bg-[#e8f3ff] text-[#147ce5]',
                        )}>
                          <Icon className="size-[17px]" strokeWidth={1.9} />
                        </span>
                        <span className={cn('mt-3 block truncate text-xs font-medium text-muted-foreground', active && 'text-foreground')}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {categoryOptions.length > featuredCategories.length ? (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-2 h-10 rounded-xl border-0 bg-transparent px-1 text-sm text-muted-foreground shadow-none focus-visible:ring-0">
                      <SelectValue placeholder="Xem tất cả danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </>
            )}
          />
          {errors.category ? <p className="mt-2 text-xs font-medium text-[hsl(var(--status-red))]">{errors.category.message}</p> : null}
        </div>
      ) : null}

      <div>
        <p className="mb-3 text-sm font-semibold">Thêm vào</p>
        <div className="divide-y divide-border overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_8px_28px_rgba(20,20,30,0.035)]">
          {!isRevaluation && (isExpense || quickAction === 'transfer' || quickAction === 'goal_contribution') ? (
            <DetailRow
              icon={WalletCards}
              iconClassName="bg-[#3291ff]"
              title={quickAction === 'transfer' ? 'Tài khoản chuyển' : quickAction === 'goal_contribution' ? 'Nguồn đóng góp' : 'Nơi thanh toán'}
              hint="Chọn một tài khoản"
              error={errors.fromAssetId?.message}
            >
              <Controller
                control={control}
                name="fromAssetId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={rowSelectClass}><SelectValue placeholder="Chọn" /></SelectTrigger>
                    <SelectContent>
                      {sourceAssetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </DetailRow>
          ) : null}

          {!isRevaluation && (isIncome || quickAction === 'transfer') ? (
            <DetailRow icon={Landmark} iconClassName="bg-[#3291ff]" title="Nơi nhận tiền" hint="Chọn một tài khoản" error={errors.toAssetId?.message}>
              <Controller
                control={control}
                name="toAssetId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={rowSelectClass}><SelectValue placeholder="Chọn" /></SelectTrigger>
                    <SelectContent>
                      {sourceAssetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </DetailRow>
          ) : null}

          {!isRevaluation && quickAction === 'goal_contribution' ? (
            <DetailRow icon={Goal} iconClassName="bg-[#8b5cf6]" title="Mục tiêu" hint="Khoản tiền được đóng góp vào đâu?" error={errors.financialGoalId?.message}>
              <EventFieldInput className="w-36 text-right text-sm" placeholder="Nhập mục tiêu" {...register('financialGoalId')} />
            </DetailRow>
          ) : null}

          <DetailRow icon={CalendarDays} iconClassName="bg-[#ff5353]" title={quickAction === 'payment_paid' ? 'Ngày trả' : isIncome ? 'Ngày nhận' : 'Ngày ghi nhận'} hint="Có thể sửa lại sau" error={errors.eventDate?.message}>
            <Controller
              control={control}
              name="eventDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  className="h-auto w-full min-w-0 justify-end overflow-hidden rounded-none border-0 bg-transparent p-0 text-sm font-semibold shadow-none hover:bg-transparent focus-visible:ring-0 [&_svg]:hidden"
                />
              )}
            />
          </DetailRow>

          {!isRevaluation ? (
            <DetailRow icon={Gift} iconClassName="bg-[#ff9f1a]" title="Cần chú ý" hint="Đánh dấu để cả nhà xem lại">
              <Controller
                control={control}
                name="isAttentionNeeded"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </DetailRow>
          ) : null}
        </div>
      </div>

      {quickAction === 'payment_paid' && selectedUpcomingForMarkPaid ? (
        <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Đang ghi nhận khoản đã trả cho “{selectedUpcomingForMarkPaid.name}”.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[22px] border border-border/70 bg-card">
        <button
          type="button"
          onClick={onToggleMoreDetails}
          className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-medium transition hover:bg-muted/40"
          aria-expanded={showMoreDetails}
        >
          <Plus className={cn('size-4 transition-transform', showMoreDetails && 'rotate-45')} />
          <span>{showMoreDetails ? 'Ẩn ghi chú' : 'Thêm ghi chú'}</span>
        </button>
        {showMoreDetails ? (
          <div className="space-y-4 border-t border-border px-4 py-4">
            {quickAction === 'expense' && !markPaidPaymentId ? (
              <Controller
                control={control}
                name="upcomingPaymentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl bg-muted/60"><SelectValue placeholder="Liên kết khoản sắp tới (không bắt buộc)" /></SelectTrigger>
                    <SelectContent>
                      {payments.filter((payment) => payment.status !== 'paid').map((payment) => (
                        <SelectItem key={payment.id} value={payment.id}>{payment.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : null}

            {quickAction === 'goal_contribution' ? (
              <Controller
                control={control}
                name="toAssetId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl bg-muted/60"><SelectValue placeholder="Asset nhận tiền (không bắt buộc)" /></SelectTrigger>
                    <SelectContent>
                      {assetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : null}

            <EventFieldTextarea rows={3} placeholder="Thêm ghi chú ngắn..." className="rounded-xl bg-muted/60 p-3" {...register('note')} />
          </div>
        ) : null}
      </div>

      <ResponsiveDialogFooter className="sticky -bottom-6 z-10 -mx-6 mt-2 border-t border-border/70 bg-card/95 px-6 py-4 backdrop-blur sm:-bottom-8 sm:-mx-8 sm:px-8">
        <Button type="button" variant="ghost" onClick={onCancel} className="sm:mr-auto">
          Để sau
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isSaving}
          className="min-w-0 flex-1 rounded-2xl bg-[#3291ff] text-white hover:bg-[#147ce5] sm:max-w-[330px]"
        >
          {isSaving ? 'Đang lưu...' : (
            <><Check className="mr-2 size-4" />{isRevaluation ? 'Lưu định giá' : isIncome ? 'Lưu khoản tiền' : quickAction === 'transfer' ? 'Lưu chuyển tiền' : quickAction === 'goal_contribution' ? 'Lưu đóng góp' : 'Lưu khoản chi'}</>
          )}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
