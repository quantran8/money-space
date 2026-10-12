import { apiRequest } from '#/shared/api/http'
import type {
  BankCredential,
  BankEventCounts,
  BankEventPage,
  BankEventStatus,
  BankNotificationEvent,
  BankPostingMode,
  BankProviderCode,
  BankSource,
  CreatedBankCredential,
} from '#/features/bank-sync/model/bank-sync.types'

const base = (householdId: string) => `/households/${householdId}/bank-sync`

function post<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function listBankCredentials(householdId: string) {
  return apiRequest<{ items: BankCredential[] }>(`${base(householdId)}/credentials`)
}

export function createBankCredential(householdId: string, deviceLabel: string) {
  return post<CreatedBankCredential>(`${base(householdId)}/credentials`, { deviceLabel })
}

export function revokeBankCredential(householdId: string, id: string) {
  return apiRequest<{ revoked: true }>(`${base(householdId)}/credentials/${id}`, {
    method: 'DELETE',
  })
}

export function listBankSources(householdId: string) {
  return apiRequest<{ items: BankSource[] }>(`${base(householdId)}/sources`)
}

export function createBankSource(
  householdId: string,
  payload: { providerCode: BankProviderCode; accountNumber: string; displayLabel?: string },
) {
  return post<BankSource>(`${base(householdId)}/sources`, payload)
}

export function updateBankSource(
  householdId: string,
  id: string,
  payload: { displayLabel?: string | null; status?: 'ACTIVE' | 'DISABLED' },
) {
  return apiRequest<BankSource>(`${base(householdId)}/sources/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function linkBankSource(
  householdId: string,
  id: string,
  payload: { assetId: string; postingMode: BankPostingMode },
) {
  return post<BankSource & { reprocessed: number }>(`${base(householdId)}/sources/${id}/link`, payload)
}

export function unlinkBankSource(householdId: string, id: string) {
  return apiRequest<BankSource>(`${base(householdId)}/sources/${id}/link`, { method: 'DELETE' })
}

export function listBankEvents(
  householdId: string,
  params: { statuses: BankEventStatus[]; cursor?: string | null; limit?: number },
) {
  return apiRequest<BankEventPage>(`${base(householdId)}/events`, undefined, {
    status: params.statuses.join(','),
    cursor: params.cursor ?? undefined,
    limit: params.limit,
  })
}

export function getBankEventCounts(householdId: string) {
  return apiRequest<BankEventCounts>(`${base(householdId)}/events/counts`)
}

export function resolveBankEvent(
  householdId: string,
  id: string,
  payload: { action: 'post'; assetId?: string } | { action: 'ignore' },
) {
  return post<BankNotificationEvent>(`${base(householdId)}/events/${id}/resolve`, payload)
}

export function reparseBankEvent(householdId: string, id: string) {
  return post<BankNotificationEvent>(`${base(householdId)}/events/${id}/reparse`)
}
