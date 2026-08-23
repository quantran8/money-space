import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'


import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { ActualRecordForm } from '@/features/events/ui/components/actual-record-form'
import { QuickActionPicker } from '@/features/events/ui/components/quick-action-picker'
import type {
  ActualRecordForm as ActualRecordFormValues,
  QuickAction,
} from '@money-space/core/features/events/model/events-form'

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
  /** Returns to the picker without closing the dialog. */
  onBack: () => void
  onBorrowMoney: () => void
  onBuyAsset: () => void
  onSellAsset: () => void
  onPlanUpcoming: () => void
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
  /** Wallets eligible as a money source (cash / bank account only). Used for the
   *  "nguồn tiền" selects; destination selects still use the full assetOptions. */
  sourceAssetOptions: Option[]
  categoryOptions: Option[]
  // actual form
  actualControl: Control<ActualRecordFormValues>
  registerActual: UseFormRegister<ActualRecordFormValues>
  actualErrors: FieldErrors<ActualRecordFormValues>
  handleActualSubmit: UseFormHandleSubmit<ActualRecordFormValues>
  onSubmitActual: (values: ActualRecordFormValues) => void
  isSavingActual: boolean
}

/** Maps a quick action to its title key suffix. */
function titleKeyFor(quickAction: QuickAction, isRevaluation: boolean) {
  if (isRevaluation) return 'revaluation'
  return quickAction === 'debt_borrow' ? 'expense' : quickAction
}

export function EventFormDialog({
  open,
  onOpenChange,
  quickAction,
  editingEventType,
  onSelectQuickAction,
  onBack,
  onBorrowMoney,
  onBuyAsset,
  onSellAsset,
  onPlanUpcoming,
  showMoreDetails,
  onToggleMoreDetails,
  sourceAssetOptions,
  categoryOptions,
  actualControl,
  registerActual,
  actualErrors,
  handleActualSubmit,
  onSubmitActual,
  isSavingActual,
}: EventFormDialogProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(editingEventType)
  const isRevaluation = editingEventType === 'asset_update'

  const title = quickAction
    ? t(
        `events.form.${isEditing ? 'updateTitle' : 'createTitle'}.${titleKeyFor(
          quickAction,
          isRevaluation,
        )}`,
      )
    : t('events.form.pickTitle')

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      {/* §22.9 — 520px for a simple form, body scrolls, footer stays visible. */}
      <ResponsiveDialogContent className="grid max-h-[88dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <ResponsiveDialogHeader className="px-5 pb-5 pr-16 pt-5 text-left sm:px-8 sm:pr-16 sm:pt-7">
          {/* Returning to the picker used to require closing the dialog. */}
          {quickAction && !isEditing ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 self-start text-[13px] text-accent transition-opacity hover:opacity-70"
            >
              ← {t('events.form.back')}
            </button>
          ) : null}
          <ResponsiveDialogTitle className="text-[19px] font-medium tracking-[-0.015em]">
            {title}
          </ResponsiveDialogTitle>
          {/* §16.2 — a subtitle here would be mood, not meaning. */}
          <ResponsiveDialogDescription className="sr-only">{title}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="overflow-y-auto px-5 pb-5 sm:px-8 sm:pb-7">
          {!quickAction ? (
            <QuickActionPicker
              onSelect={onSelectQuickAction}
              onBorrowMoney={onBorrowMoney}
              onBuyAsset={onBuyAsset}
              onSellAsset={onSellAsset}
              onPlanUpcoming={onPlanUpcoming}
            />
          ) : (
            <ActualRecordForm
              control={actualControl}
              register={registerActual}
              errors={actualErrors}
              handleSubmit={handleActualSubmit}
              onSubmit={onSubmitActual}
              quickAction={quickAction}
              isRevaluation={isRevaluation}
              isEditing={isEditing}
              sourceAssetOptions={sourceAssetOptions}
              categoryOptions={categoryOptions}
              showMoreDetails={showMoreDetails}
              onToggleMoreDetails={onToggleMoreDetails}
              isSaving={isSavingActual}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
