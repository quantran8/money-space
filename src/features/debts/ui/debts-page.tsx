import { Plus } from 'lucide-react'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDebtsPage } from '@/features/debts/hooks/use-debts-page'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtsInsightsSection } from '@/features/debts/ui/components/debts-insights-section'
import { DebtUpdateModeDialog } from '@/features/debts/ui/components/debt-update-mode-dialog'
import { DebtsListSection } from '@/features/debts/ui/components/debts-list-section'
import { DebtsSummaryStrip } from '@/features/debts/ui/components/debts-summary-strip'

export function DebtsPage() {
  const {
    debts,
    assets,
    members,
    events,
    payments,
    isPaymentsLoading,
    isLoading,
    summary,
    memberOptions,
    control,
    register,
    errors,
    isValid,
    setValue,
    submit,
    selectedLenderType,
    receiveAssetOptions,
    isSavingDebt,
    isUpdating,
    repaymentEstimate,
    termMonths,
    dialogOpen,
    editingId,
    showMoreDetails,
    setShowMoreDetails,
    onOpenChange,
    openCreate,
    openEdit,
    markPaidOff,
    pasteAmountFromClipboard,
    deletingDebt,
    isDeleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
    openDetail,
    updateModeOpen,
    updateModeOriginalChanged,
    updateModeBefore,
    updateModeAfter,
    updateModeTotalRepaid,
    isSavingUpdateMode,
    confirmUpdateMode,
    cancelUpdateMode,
  } = useDebtsPage()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Khoản nợ gia đình"
        title="Nhà mình đang nợ gì?"
        description="Xem số còn phải trả, tiến độ thanh toán và các kỳ hạn sắp tới."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Thêm khoản nợ
          </Button>
        }
      />

      <DebtsSummaryStrip summary={summary} debts={debts} payments={payments} />

      <DebtsListSection
        debts={debts}
        members={members}
        assets={assets}
        payments={payments}
        isLoading={isLoading}
        isUpdating={isUpdating}
        onEdit={openEdit}
        onMarkPaidOff={markPaidOff}
        onViewDetail={openDetail}
        onDelete={requestDelete}
      />

      <DebtsInsightsSection
        debts={debts}
        events={events}
        payments={payments}
        isLoading={isLoading || isPaymentsLoading}
      />

      <DebtFormDialog
        open={dialogOpen}
        onOpenChange={onOpenChange}
        editingId={editingId}
        control={control}
        register={register}
        errors={errors}
        isValid={isValid}
        isSavingDebt={isSavingDebt}
        setValue={setValue}
        selectedLenderType={selectedLenderType}
        showMoreDetails={showMoreDetails}
        setShowMoreDetails={setShowMoreDetails}
        receiveAssetOptions={receiveAssetOptions}
        memberOptions={memberOptions}
        repaymentEstimate={repaymentEstimate}
        termMonths={termMonths}
        onSubmit={submit}
        pasteAmountFromClipboard={pasteAmountFromClipboard}
      />

      {updateModeOpen ? (
        <DebtUpdateModeDialog
          open
          onOpenChange={(open) => {
            if (!open) cancelUpdateMode()
          }}
          originalAmountChanged={updateModeOriginalChanged}
          before={updateModeBefore}
          after={updateModeAfter}
          totalRepaid={updateModeTotalRepaid}
          isSubmitting={isSavingUpdateMode}
          onConfirm={confirmUpdateMode}
        />
      ) : null}

      <ConfirmDialog
        open={!!deletingDebt}
        onOpenChange={(open) => {
          if (!open) cancelDelete()
        }}
        title="Xóa khoản nợ?"
        description={
          deletingDebt
            ? `Khoản "${deletingDebt.name}" sẽ bị xóa khỏi danh sách. Hành động này không thể hoàn tác.`
            : undefined
        }
        confirmLabel="Xóa"
        confirmLoadingLabel="Đang xóa..."
        cancelLabel="Hủy"
        confirmDisabled={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
