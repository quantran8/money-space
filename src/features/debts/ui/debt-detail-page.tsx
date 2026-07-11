import { ArrowDownLeft, ArrowUpRight, ChevronLeft, Pencil, Scale } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useDebtDetail } from '@/features/debts/hooks/use-debt-detail'
import { useDebtsPage } from '@/features/debts/hooks/use-debts-page'
import { formatDate, getStatusLabel, getStatusTone } from '@/features/debts/model/debts-form'
import { calcFromBackendEnum } from '@/features/debts/model/debts-interest'
import type { DebtHistoryEntry } from '@/features/debts/hooks/use-debt-detail'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtUpdateModeDialog } from '@/features/debts/ui/components/debt-update-mode-dialog'
import { formatVndShort } from '@/shared/lib/format-money'

const FREQUENCY_LABELS: Record<string, string> = {
  none: 'Linh hoạt',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
}

const CALC_LABELS: Record<string, string> = {
  fixed: 'Trả cố định (niên kim)',
  reducing: 'Dư nợ giảm dần',
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-border/80 bg-white px-4 py-2 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
      {children}
    </section>
  )
}

const HISTORY_ROW_STYLES = {
  borrow: {
    bg: 'bg-[hsla(var(--status-orange),0.12)]',
    text: 'text-[hsl(var(--status-orange))]',
    sign: '+',
  },
  repayment: {
    bg: 'bg-[hsla(var(--status-green),0.12)]',
    text: 'text-[hsl(var(--status-green))]',
    sign: '-',
  },
  adjustment: {
    bg: 'bg-[hsla(var(--status-blue),0.12)]',
    text: 'text-[hsl(var(--status-blue))]',
    sign: '',
  },
} as const

function HistoryRow({ entry }: { entry: DebtHistoryEntry }) {
  const style = HISTORY_ROW_STYLES[entry.kind]
  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}
      >
        {entry.kind === 'borrow' ? (
          <ArrowDownLeft className={`size-4 ${style.text}`} strokeWidth={1.8} />
        ) : entry.kind === 'repayment' ? (
          <ArrowUpRight className={`size-4 ${style.text}`} strokeWidth={1.8} />
        ) : (
          <Scale className={`size-4 ${style.text}`} strokeWidth={1.8} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
        <p className="text-xs text-muted-foreground">{formatDate(entry.isoDate)}</p>
      </div>
      <span className={`money-number shrink-0 text-sm font-semibold ${style.text}`}>
        {style.sign}
        {formatVndShort(entry.amount)}
      </span>
    </li>
  )
}

function HistorySection({
  title,
  emptyLabel,
  countLabel,
  total,
  totalClassName,
  entries,
}: {
  title: string
  emptyLabel: string
  countLabel?: string
  /** Header total; omit for sections where a summed amount isn't meaningful. */
  total?: number
  totalClassName: string
  entries: DebtHistoryEntry[]
}) {
  return (
    <section className="rounded-[24px] border border-border/80 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">{title}</p>
        {total !== undefined && entries.length > 0 ? (
          <span className={`money-number text-sm font-semibold ${totalClassName}`}>
            {formatVndShort(total)} đ
          </span>
        ) : null}
      </div>
      {countLabel && entries.length > 0 ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{countLabel}</p>
      ) : null}

      {entries.length > 0 ? (
        <ul className="mt-1 divide-y divide-border/70">
          {entries.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyLabel}</p>
      )}
    </section>
  )
}

export function DebtDetailPage() {
  const { debtId } = useParams<{ debtId: string }>()
  const navigate = useNavigate()
  const {
    debt,
    ownerName,
    receivedToAssetName,
    borrows,
    repayments,
    adjustments,
    totalBorrowed,
    totalRepaid,
    isLoading,
  } = useDebtDetail(debtId)

  // Reuse the debts page's form machinery so editing opens a dialog in place
  // (no navigation back to the list).
  const {
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
    repaymentEstimate,
    termMonths,
    dialogOpen,
    editingId,
    showMoreDetails,
    setShowMoreDetails,
    onOpenChange,
    openEdit,
    pasteAmountFromClipboard,
    updateModeOpen,
    updateModeOriginalChanged,
    updateModeBefore,
    updateModeAfter,
    updateModeTotalRepaid,
    isSavingUpdateMode,
    confirmUpdateMode,
    cancelUpdateMode,
  } = useDebtsPage()

  if (isLoading && !debt) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-40 animate-pulse rounded-[24px] bg-muted" />
      </div>
    )
  }

  if (!debt) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/debts')}>
          <ChevronLeft className="size-4" />
          Danh sách khoản nợ
        </Button>
        <div className="rounded-[24px] border border-border/80 bg-white px-6 py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Không tìm thấy khoản nợ</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Khoản nợ này có thể đã bị xóa hoặc không tồn tại.
          </p>
        </div>
      </div>
    )
  }

  const stages = debt.interestPeriods ?? []
  const calc = calcFromBackendEnum(debt.interestCalculation)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="-ml-2 w-fit gap-1" onClick={() => navigate('/debts')}>
          <ChevronLeft className="size-4" />
          Danh sách khoản nợ
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="page-title text-3xl font-semibold tracking-[-0.03em]">{debt.name}</h1>
              <Badge className={getStatusTone(debt.status)}>{getStatusLabel(debt.status)}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {debt.lenderName || 'Chưa rõ bên cho vay'} · vay ngày {formatDate(debt.borrowedAt)}
            </p>
          </div>

          <Button onClick={() => openEdit(debt.id)}>
            <Pencil className="mr-2 size-4" />
            Chỉnh sửa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <SectionCard>
            <Row
              label="Còn nợ"
              value={
                <span className="money-number text-[hsl(var(--status-red))]">
                  {debt.outstandingAmount} đ
                </span>
              }
            />
            <Separator />
            <Row label="Tổng vay ban đầu" value={`${debt.originalAmount} đ`} />
            <Separator />
            <Row label="Đã trả" value={`${formatVndShort(totalRepaid)} đ`} />
            {debt.expectedFinalDueDate ? (
              <>
                <Separator />
                <Row label="Dự kiến trả xong" value={formatDate(debt.expectedFinalDueDate)} />
              </>
            ) : null}
          </SectionCard>

          <SectionCard>
            <Row
              label="Tần suất trả"
              value={FREQUENCY_LABELS[debt.paymentFrequency ?? 'none'] ?? 'Linh hoạt'}
            />
            {debt.fixedPaymentAmount ? (
              <>
                <Separator />
                <Row label="Mỗi kỳ trả" value={`${debt.fixedPaymentAmount} đ`} />
              </>
            ) : null}
            {ownerName ? (
              <>
                <Separator />
                <Row label="Người phụ trách" value={ownerName} />
              </>
            ) : null}
            {receivedToAssetName ? (
              <>
                <Separator />
                <Row label="Tiền nhận vào" value={receivedToAssetName} />
              </>
            ) : null}
          </SectionCard>

          {stages.length > 0 || debt.interestSummary ? (
            <section className="rounded-[24px] border border-border/80 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                  Lãi suất
                </p>
                {stages.length > 0 ? (
                  <Badge variant="secondary">{CALC_LABELS[calc] ?? calc}</Badge>
                ) : null}
              </div>

              {stages.length > 0 ? (
                <ol className="mt-3 space-y-2">
                  {stages.map((stage, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded-[16px] bg-muted/70 px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">Giai đoạn {index + 1}</span>
                      <span className="font-medium text-foreground">
                        {stage.interestRate}%/năm ·{' '}
                        {stage.months ? `${stage.months} tháng` : 'các kỳ còn lại'}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-foreground">{debt.interestSummary}</p>
              )}
            </section>
          ) : null}

          {debt.note ? (
            <section className="rounded-[24px] border border-border/80 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">Ghi chú</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{debt.note}</p>
            </section>
          ) : null}
        </div>

        <div className="space-y-4 lg:col-span-5">
          <HistorySection
            title="Nhận tiền nợ"
            total={totalBorrowed}
            totalClassName="text-[hsl(var(--status-orange))]"
            entries={borrows}
            emptyLabel="Chưa ghi nhận khoản tiền nhận vào cho khoản nợ này."
          />
          <HistorySection
            title="Lịch sử trả nợ"
            total={totalRepaid}
            totalClassName="text-[hsl(var(--status-green))]"
            countLabel={`${repayments.length} lần trả`}
            entries={repayments}
            emptyLabel='Chưa có lần trả nào. Khi bạn đánh dấu một khoản "Trả nợ" là đã trả, nó sẽ xuất hiện ở đây.'
          />
          {adjustments.length > 0 ? (
            <HistorySection
              title="Điều chỉnh"
              totalClassName="text-[hsl(var(--status-blue))]"
              countLabel={`${adjustments.length} lần điều chỉnh`}
              entries={adjustments}
              emptyLabel=""
            />
          ) : null}
        </div>
      </div>

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
    </div>
  )
}
