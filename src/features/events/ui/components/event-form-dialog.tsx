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
  onSelectQuickAction: (action: QuickAction) => void
  onBorrowMoney: () => void
  onSellAsset: () => void
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
  markPaidPaymentId: string | null
  selectedUpcomingForMarkPaid?: LocalUpcomingPayment
  payments: LocalUpcomingPayment[]
  assetOptions: Option[]
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
  onSelectQuickAction,
  onBorrowMoney,
  onSellAsset,
  showMoreDetails,
  onToggleMoreDetails,
  markPaidPaymentId,
  selectedUpcomingForMarkPaid,
  payments,
  assetOptions,
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
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {quickAction === 'payment_paid' ? 'Đánh dấu đã trả' : 'Cập nhật nhanh'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {quickAction === 'payment_paid'
              ? 'Ghi nhận khoản đã trả để timeline của nhà mình rõ hơn.'
              : 'Thêm khoản sắp tới hoặc ghi nhận một thay đổi đáng chú ý của nhà mình.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-5">
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
              assetOptions={assetOptions}
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
              markPaidPaymentId={markPaidPaymentId}
              selectedUpcomingForMarkPaid={selectedUpcomingForMarkPaid}
              payments={payments}
              assetOptions={assetOptions}
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
