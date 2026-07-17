import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form'

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { ActualRecordForm } from '@/features/events/ui/components/actual-record-form'
import { QuickActionPicker } from '@/features/events/ui/components/quick-action-picker'
import { UpcomingRecordForm } from '@/features/events/ui/components/upcoming-record-form'
import { eventTypeLabels } from '@/features/events/model/events'
import type {
  ActualRecordForm as ActualRecordFormValues,
  LocalUpcomingPayment,
  QuickAction,
  UpcomingRecordForm as UpcomingRecordFormValues,
} from '@/features/events/model/events-form'

type Option = { value: string; label: string }

type EventFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quickAction: QuickAction | null
  /** Raw type of the event being edited (undefined when creating). Drives the
   *  edit-specific title so the dialog reflects the actual record, not a generic
   *  "quick update". */
  editingEventType?: string
  onSelectQuickAction: (action: QuickAction) => void
  onBorrowMoney: () => void
  onSellAsset: () => void
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
  markPaidPaymentId: string | null
  selectedUpcomingForMarkPaid?: LocalUpcomingPayment
  payments: LocalUpcomingPayment[]
  assetOptions: Option[]
  /** Wallets eligible as a money source (cash / bank account only). Used for the
   *  "nguồn tiền" selects; destination selects still use the full assetOptions. */
  sourceAssetOptions: Option[]
  memberOptions: Option[]
  categoryOptions: Option[]
  // upcoming form
  upcomingControl: Control<UpcomingRecordFormValues>
  registerUpcoming: UseFormRegister<UpcomingRecordFormValues>
  upcomingErrors: FieldErrors<UpcomingRecordFormValues>
  handleUpcomingSubmit: UseFormHandleSubmit<UpcomingRecordFormValues>
  onSubmitUpcoming: (values: UpcomingRecordFormValues) => void
  isUpcomingValid: boolean
  isSavingUpcoming: boolean
  // actual form
  actualControl: Control<ActualRecordFormValues>
  registerActual: UseFormRegister<ActualRecordFormValues>
  actualErrors: FieldErrors<ActualRecordFormValues>
  handleActualSubmit: UseFormHandleSubmit<ActualRecordFormValues>
  onSubmitActual: (values: ActualRecordFormValues) => void
  isActualValid: boolean
  isSavingActual: boolean
}

export function EventFormDialog({
  open,
  onOpenChange,
  quickAction,
  editingEventType,
  onSelectQuickAction,
  onBorrowMoney,
  onSellAsset,
  showMoreDetails,
  onToggleMoreDetails,
  markPaidPaymentId,
  selectedUpcomingForMarkPaid,
  payments,
  assetOptions,
  sourceAssetOptions,
  memberOptions,
  categoryOptions,
  upcomingControl,
  registerUpcoming,
  upcomingErrors,
  handleUpcomingSubmit,
  onSubmitUpcoming,
  isUpcomingValid,
  isSavingUpcoming,
  actualControl,
  registerActual,
  actualErrors,
  handleActualSubmit,
  onSubmitActual,
  isActualValid,
  isSavingActual,
}: EventFormDialogProps) {
  const isActualForm = quickAction !== null && quickAction !== 'upcoming'
  const title = editingEventType
    ? `Sửa ${eventTypeLabels[editingEventType as keyof typeof eventTypeLabels] ?? 'khoản tiền'}`
    : quickAction === 'income'
      ? 'Thêm khoản tiền'
      : quickAction === 'expense'
        ? 'Thêm khoản chi'
        : quickAction === 'transfer'
          ? 'Chuyển tiền'
          : quickAction === 'goal_contribution'
            ? 'Góp vào mục tiêu'
            : quickAction === 'payment_paid'
              ? 'Đánh dấu đã trả'
              : quickAction === 'upcoming'
                ? 'Thêm khoản sắp tới'
                : 'Bạn muốn cập nhật gì?'

  const description = editingEventType
    ? 'Chỉnh sửa thông tin đã ghi nhận.'
    : isActualForm
      ? 'Chỉ vài chạm là xong.'
      : quickAction === 'upcoming'
        ? 'Ghi lại khoản cần chuẩn bị trong thời gian tới.'
        : 'Chọn một loại cập nhật để bắt đầu.'

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        className={`gap-0 overflow-x-hidden border-0 bg-[hsl(var(--muted))]/95 p-0 [&>button]:right-5 [&>button]:top-5 [&>button]:grid [&>button]:size-9 [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-black/[0.05] ${isActualForm ? 'sm:max-w-[560px]' : 'sm:max-w-[720px]'}`}
      >
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
          <ResponsiveDialogTitle className="text-[25px] font-semibold tracking-[-0.035em] sm:text-[28px]">
            {title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="mt-6 min-w-0 max-w-full space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
          {!quickAction ? (
            <QuickActionPicker
              onSelect={onSelectQuickAction}
              onBorrowMoney={onBorrowMoney}
              onSellAsset={onSellAsset}
            />
          ) : quickAction === 'upcoming' ? (
            <UpcomingRecordForm
              control={upcomingControl}
              register={registerUpcoming}
              errors={upcomingErrors}
              handleSubmit={handleUpcomingSubmit}
              onSubmit={onSubmitUpcoming}
              showMoreDetails={showMoreDetails}
              onToggleMoreDetails={onToggleMoreDetails}
              memberOptions={memberOptions}
              sourceAssetOptions={sourceAssetOptions}
              isValid={isUpcomingValid}
              isSaving={isSavingUpcoming}
              onCancel={() => onOpenChange(false)}
            />
          ) : (
            <ActualRecordForm
              control={actualControl}
              register={registerActual}
              errors={actualErrors}
              handleSubmit={handleActualSubmit}
              onSubmit={onSubmitActual}
              quickAction={quickAction}
              isRevaluation={editingEventType === 'asset_update'}
              markPaidPaymentId={markPaidPaymentId}
              selectedUpcomingForMarkPaid={selectedUpcomingForMarkPaid}
              payments={payments}
              assetOptions={assetOptions}
              sourceAssetOptions={sourceAssetOptions}
              categoryOptions={categoryOptions}
              showMoreDetails={showMoreDetails}
              onToggleMoreDetails={onToggleMoreDetails}
              isValid={isActualValid}
              isSaving={isSavingActual}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
