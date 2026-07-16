import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { TODAY } from '@/features/events/model/events-form'
import { formatVndShort } from '@/shared/lib/format-money'

export type DebtBalanceIntent =
  | 'fix_original'
  | 'additional_disbursement'
  | 'reconcile_balance'

export type DebtUpdateModeChoice =
  | { kind: 'correction' }
  | { kind: 'effective'; effectiveDate: string; balanceIntent?: DebtBalanceIntent }

/** Scalar snapshot of the fields the preview compares before → after. */
export type DebtUpdateSnapshot = {
  originalAmount: number
  outstandingAmount?: number
  fixedPaymentAmount?: number
  interestRate?: number
  installments?: number
  lenderType: string
  name: string
}

type DebtUpdateModeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** True when the user changed the loan amount — surfaces the 3-way intent. */
  originalAmountChanged: boolean
  before?: DebtUpdateSnapshot
  after?: DebtUpdateSnapshot
  /** Sum of recorded repayments — used to recompute outstanding on correction. */
  totalRepaid: number
  isSubmitting: boolean
  onConfirm: (choice: DebtUpdateModeChoice) => void
}

type ModeKind = 'correction' | 'effective'

const LENDER_TYPE_LABELS: Record<string, string> = {
  relative: 'Người thân',
  bank_institution: 'Ngân hàng / Tổ chức',
  other: 'Khác',
}

function money(value?: number) {
  return value === undefined ? '—' : formatVndShort(value)
}

/** One before → after row; only rendered when the value actually changed. */
function PreviewRow({
  label,
  before,
  after,
  emphasize,
}: {
  label: string
  before: string
  after: string
  emphasize?: boolean
}) {
  if (before === after) return null
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-[#6e6e73]">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-right">
        <span className="truncate text-[#8e8e93] line-through">{before}</span>
        <span className="shrink-0 text-[#8e8e93]">→</span>
        <span
          className={`shrink-0 font-semibold ${emphasize ? 'text-[hsl(var(--status-blue))]' : 'text-[#1d1d1f]'}`}
        >
          {after}
        </span>
      </span>
    </div>
  )
}

function OptionCard({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
        active
          ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
          : 'border-[#e5e5ea] bg-white text-[#1d1d1f] hover:bg-[#f2f2f7]'
      }`}
    >
      <p className="text-[14px] font-semibold tracking-[-0.01em]">{title}</p>
      <p className={`mt-0.5 text-xs ${active ? 'text-white/70' : 'text-[#8e8e93]'}`}>{hint}</p>
    </button>
  )
}

export function DebtUpdateModeDialog({
  open,
  onOpenChange,
  originalAmountChanged,
  before,
  after,
  totalRepaid,
  isSubmitting,
  onConfirm,
}: DebtUpdateModeDialogProps) {
  const [mode, setMode] = useState<ModeKind>('correction')
  const [effectiveDate, setEffectiveDate] = useState<string>(TODAY)
  // Only relevant when the loan amount changed. The intent both classifies the
  // change and (for fix_original) forces correction mode.
  const [balanceIntent, setBalanceIntent] = useState<DebtBalanceIntent>('fix_original')

  // "Sửa số tiền vay ban đầu" is a correction; the other two are effective.
  function chooseIntent(intent: DebtBalanceIntent) {
    setBalanceIntent(intent)
    setMode(intent === 'fix_original' ? 'correction' : 'effective')
  }

  // The new outstanding depends on the chosen mode/intent — mirrors the backend
  // (see memory/debts.md). Reconcile / additional-disbursement carry their amount
  // in the loan-amount field the form used.
  function computeAfterOutstanding(): number | undefined {
    if (!before || !after) return undefined
    const beforeOutstanding = before.outstandingAmount ?? 0
    if (mode === 'correction') {
      // Correction: outstanding = max(0, corrected original − total repaid).
      return Math.max(0, after.originalAmount - totalRepaid)
    }
    if (originalAmountChanged && balanceIntent === 'additional_disbursement') {
      return beforeOutstanding + (after.originalAmount - before.originalAmount)
    }
    if (originalAmountChanged && balanceIntent === 'reconcile_balance') {
      return after.originalAmount
    }
    // Effective with no balance change: outstanding is untouched.
    return beforeOutstanding
  }
  const afterOutstanding = computeAfterOutstanding()
  // In a reconcile, the number typed into the loan-amount field is the new
  // outstanding, not a new original — so show the original as unchanged.
  const isReconcile =
    mode === 'effective' && originalAmountChanged && balanceIntent === 'reconcile_balance'
  const afterOriginal = isReconcile ? before?.originalAmount : after?.originalAmount
  // Whether any preview row will actually render (rows self-hide when unchanged).
  const hasVisibleChange =
    !!before &&
    !!after &&
    (before.name !== after.name ||
      before.lenderType !== after.lenderType ||
      before.originalAmount !== afterOriginal ||
      (before.outstandingAmount ?? 0) !== (afterOutstanding ?? 0) ||
      (mode === 'correction' &&
        (before.fixedPaymentAmount !== after.fixedPaymentAmount ||
          before.interestRate !== after.interestRate ||
          before.installments !== after.installments)))

  function handleConfirm() {
    if (mode === 'correction') {
      onConfirm({ kind: 'correction' })
      return
    }
    onConfirm({
      kind: 'effective',
      effectiveDate,
      balanceIntent: originalAmountChanged ? balanceIntent : undefined,
    })
  }

  const showEffectiveDate = mode === 'effective'

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 overflow-hidden border-white bg-[#fcfcfd] p-0 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:max-w-[480px] sm:rounded-[32px]">
        <ResponsiveDialogHeader className="gap-1.5 border-b border-[#e8e8ee] px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <ResponsiveDialogTitle className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#1d1d1f]">
            Cập nhật khoản nợ đã có lịch sử
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-sm text-[#6e6e73]">
            Khoản nợ này đã có giao dịch. Cho mình biết đây là loại thay đổi nào để cập nhật đúng.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {originalAmountChanged ? (
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-[#6e6e73]">
                Bạn thay đổi số tiền vay — ý bạn là:
              </p>
              <OptionCard
                active={balanceIntent === 'fix_original'}
                title="Sửa số tiền vay ban đầu"
                hint="Trước đây nhập sai — tính lại dư nợ và lịch sử theo số đúng."
                onClick={() => chooseIntent('fix_original')}
              />
              <OptionCard
                active={balanceIntent === 'additional_disbursement'}
                title="Ghi nhận vay thêm"
                hint="Vay thêm một khoản — tăng dư nợ và ghi vào dòng tiền."
                onClick={() => chooseIntent('additional_disbursement')}
              />
              <OptionCard
                active={balanceIntent === 'reconcile_balance'}
                title="Cập nhật dư nợ hiện tại"
                hint="Số dư thực tế (theo sao kê) khác app — đặt lại cho khớp."
                onClick={() => chooseIntent('reconcile_balance')}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <OptionCard
                active={mode === 'correction'}
                title="Sửa thông tin đã nhập sai"
                hint="Trước đây nhập sai — cập nhật lại lịch sử và số dư khoản nợ."
                onClick={() => setMode('correction')}
              />
              <OptionCard
                active={mode === 'effective'}
                title="Thay đổi áp dụng từ bây giờ"
                hint="Điều khoản mới, chỉ áp dụng cho các kỳ từ một ngày trở đi."
                onClick={() => setMode('effective')}
              />
            </div>
          )}

          {mode === 'correction' ? (
            <p className="rounded-[16px] bg-[hsla(var(--status-orange),0.1)] px-4 py-3 text-[13px] leading-5 text-[hsl(var(--status-orange))]">
              Thay đổi này sẽ cập nhật lại lịch sử và số dư khoản nợ.
            </p>
          ) : null}

          {showEffectiveDate ? (
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-[#6e6e73]">
                Thay đổi này áp dụng từ ngày nào?
              </p>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
                className="h-[52px] rounded-[20px] border-[#e5e5ea] bg-white text-[15px]"
              />
            </div>
          ) : null}

          {before && after ? (
            <div className="rounded-[20px] border border-[#e5e5ea] bg-white px-4 py-3">
              <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
                Xem trước thay đổi
              </p>
              <div className="mt-1 divide-y divide-[#f2f2f7]">
                <PreviewRow
                  label="Tên khoản vay"
                  before={before.name}
                  after={after.name}
                />
                <PreviewRow
                  label="Loại nợ"
                  before={LENDER_TYPE_LABELS[before.lenderType] ?? before.lenderType}
                  after={LENDER_TYPE_LABELS[after.lenderType] ?? after.lenderType}
                />
                <PreviewRow
                  label="Số tiền vay"
                  before={money(before.originalAmount)}
                  after={money(afterOriginal)}
                />
                <PreviewRow
                  label="Còn nợ"
                  before={money(before.outstandingAmount)}
                  after={money(afterOutstanding)}
                  emphasize
                />
                {/* Under correction the whole schedule is recomputed, so the
                    repayment figures below reflect the new plan exactly. Under
                    effective mode the backend appends a period instead of
                    rewriting, so we hide these to avoid an approximate preview. */}
                {mode === 'correction' ? (
                  <>
                    <PreviewRow
                      label="Trả mỗi kỳ"
                      before={money(before.fixedPaymentAmount)}
                      after={money(after.fixedPaymentAmount)}
                    />
                    <PreviewRow
                      label="Lãi suất"
                      before={
                        before.interestRate !== undefined ? `${before.interestRate}%/năm` : '—'
                      }
                      after={after.interestRate !== undefined ? `${after.interestRate}%/năm` : '—'}
                    />
                    <PreviewRow
                      label="Số kỳ trả"
                      before={
                        before.installments !== undefined ? `${before.installments} kỳ` : '—'
                      }
                      after={after.installments !== undefined ? `${after.installments} kỳ` : '—'}
                    />
                  </>
                ) : null}
              </div>
              {hasVisibleChange ? (
                <p className="mt-2 text-xs text-[#8e8e93]">
                  Chỉ hiển thị các mục thay đổi. Bạn có thể quay lại để chỉnh trước khi lưu.
                </p>
              ) : (
                <p className="mt-1 text-sm text-[#6e6e73]">Không có thay đổi nào để áp dụng.</p>
              )}
            </div>
          ) : null}
        </div>

        <ResponsiveDialogFooter className="border-t border-[#e8e8ee] bg-[#fcfcfd] px-5 py-4 sm:px-6">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Quay lại
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Xác nhận'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
