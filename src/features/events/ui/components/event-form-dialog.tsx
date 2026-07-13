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
  const eyebrow = editingEventType
    ? 'Chỉnh sửa record'
    : quickAction === 'payment_paid'
      ? 'Ghi nhận thanh toán'
      : quickAction === 'upcoming'
        ? 'Khoản sắp tới'
        : 'Record mới'

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-[720px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{eyebrow}</p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {editingEventType
              ? `Sửa: ${eventTypeLabels[editingEventType as keyof typeof eventTypeLabels] ?? 'record'}`
              : quickAction === 'payment_paid'
                ? 'Đánh dấu đã trả'
                : 'Cập nhật nhanh'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {editingEventType
              ? 'Chỉnh sửa thông tin của record này.'
              : quickAction === 'payment_paid'
                ? 'Ghi nhận khoản đã trả để timeline của nhà mình rõ hơn.'
                : 'Thêm khoản sắp tới hoặc ghi nhận một thay đổi đáng chú ý của nhà mình.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="mt-6 space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
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
