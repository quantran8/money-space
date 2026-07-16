import { apiRequest } from '@/shared/api/http'
import { formatMoney } from '@/shared/lib/format-money'
import type { DebtInterestPeriodDto, DebtItem } from '@/features/debts/model/debts.types'

type DebtListResponse = {
  householdId: string
  items: Array<{
    id: string
    name: string
    lenderType: DebtItem['lenderType']
    lenderName?: string
    originalAmount: number
    outstandingAmount: number
    currency: string
    borrowedAt?: string
    expectedFinalDueDate?: string
    status: DebtItem['status']
    ownerMemberId?: string
    receivedToAssetId?: string
    paymentFrequency?: DebtItem['paymentFrequency']
    fixedPaymentAmount?: number
    interestType?: string
    interestCalculation?: string
    interestRate?: number
    interestPeriods?: DebtInterestPeriodDto[]
    note?: string
  }>
  total: number
}

export type DebtPayload = {
  name: string
  lenderType: DebtItem['lenderType']
  lenderName?: string
  originalAmount: number
  outstandingAmount: number
  currency?: string
  borrowedAt?: string
  expectedFinalDueDate?: string
  status?: DebtItem['status']
  ownerMemberId?: string
  receivedToAssetId?: string
  paymentFrequency?: string
  fixedPaymentAmount?: number
  interestType?: string
  interestCalculation?: string
  interestRate?: number
  interestPeriods?: DebtInterestPeriodDto[]
  note?: string
  /**
   * Required when editing a debt that already has money-event history. Absent
   * for a new debt or a history-less edit (the backend keeps the simple
   * overwrite path). See the debt-update-mode dialog + memory/debts.md.
   */
  updateMode?:
    | { kind: 'correction' }
    | {
        kind: 'effective'
        effectiveDate: string
        balanceIntent?: 'fix_original' | 'additional_disbursement' | 'reconcile_balance'
      }
}

function formatCompact(value?: number) {
  if (value === undefined || value === null) return undefined
  return formatMoney(value)
}

function toDebtItem(record: DebtListResponse['items'][number]): DebtItem {
  const interestSummary =
    record.interestRate !== undefined && record.interestRate !== null
      ? `${record.interestRate}%`
      : record.interestType
        ? [record.interestType, record.interestCalculation].filter(Boolean).join(' · ')
        : undefined

  return {
    id: record.id,
    name: record.name,
    lenderType: record.lenderType,
    lenderName: record.lenderName ?? '',
    originalAmount: formatCompact(record.originalAmount) ?? '0',
    outstandingAmount: formatCompact(record.outstandingAmount) ?? '0',
    originalAmountValue: record.originalAmount ?? 0,
    outstandingAmountValue: record.outstandingAmount ?? 0,
    fixedPaymentAmountValue: record.fixedPaymentAmount,
    currency: record.currency,
    borrowedAt: record.borrowedAt ?? '',
    expectedFinalDueDate: record.expectedFinalDueDate,
    status: record.status,
    ownerMemberId: record.ownerMemberId,
    receivedToAssetId: record.receivedToAssetId,
    paymentFrequency: record.paymentFrequency,
    fixedPaymentAmount: formatCompact(record.fixedPaymentAmount),
    interestSummary,
    interestCalculation: record.interestCalculation,
    interestPeriods: record.interestPeriods,
    note: record.note,
  }
}

export async function listDebts(householdId: string) {
  const response = await apiRequest<DebtListResponse>(`/api/households/${householdId}/debts`)
  return {
    ...response,
    items: response.items.map(toDebtItem),
  }
}

export function createDebt(householdId: string, payload: DebtPayload) {
  return apiRequest(`/api/households/${householdId}/debts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDebt(householdId: string, debtId: string, payload: Partial<DebtPayload>) {
  return apiRequest(`/api/households/${householdId}/debts/${debtId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteDebt(householdId: string, debtId: string) {
  return apiRequest<{ deleted: boolean; debtId: string }>(
    `/api/households/${householdId}/debts/${debtId}`,
    {
      method: 'DELETE',
    },
  )
}
