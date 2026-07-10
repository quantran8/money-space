import { Plus } from 'lucide-react'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { useDebtsPage } from '@/features/debts/hooks/use-debts-page'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtsListSection } from '@/features/debts/ui/components/debts-list-section'
import { DebtsSummaryStrip } from '@/features/debts/ui/components/debts-summary-strip'

export function DebtsPage() {
  const {
    debts,
    assets,
    members,
    isLoading,
    summary,
    assetOptions,
    memberOptions,
    control,
    register,
    errors,
    isValid,
    setValue,
    submit,
    selectedLenderType,
    originalAmountValue,
    isSavingDebt,
    isUpdating,
    dialogOpen,
    editingId,
    showMoreDetails,
    setShowMoreDetails,
    onOpenChange,
    openCreate,
    openEdit,
    markPaidOff,
    pasteAmountFromClipboard,
  } = useDebtsPage()

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Đang nợ"
        title="Khoản vay và khoản phải trả"
        description="Giữ phần nợ tách khỏi tài sản để nhà mình nhìn đúng bức tranh tài chính, nhưng vẫn cập nhật rất nhanh và dễ hiểu."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Vay tiền
          </Button>
        }
      />

      <DebtsSummaryStrip summary={summary} />

      <DebtsListSection
        debts={debts}
        members={members}
        assets={assets}
        isLoading={isLoading}
        isUpdating={isUpdating}
        onEdit={openEdit}
        onMarkPaidOff={markPaidOff}
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
        originalAmountValue={originalAmountValue}
        showMoreDetails={showMoreDetails}
        setShowMoreDetails={setShowMoreDetails}
        assetOptions={assetOptions}
        memberOptions={memberOptions}
        onSubmit={submit}
        pasteAmountFromClipboard={pasteAmountFromClipboard}
      />
    </div>
  )
}
