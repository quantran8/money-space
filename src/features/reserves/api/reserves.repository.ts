import { apiRequest } from '@/shared/api/http'
import type {
  ProtectedReserve,
  ReserveStatus,
} from '@/features/reserves/model/reserves.types'

type ReserveListResponse = {
  householdId: string
  items: ProtectedReserve[]
  total: number
}

export type ReservePayload = {
  name: string
  amount: number
  /** Defaults to `active` — a reserve you just declared is one you mean. */
  status?: ReserveStatus
  note?: string
}

export function listReserves(householdId: string) {
  return apiRequest<ReserveListResponse>(`/api/households/${householdId}/protected-reserves`)
}

export function createReserve(householdId: string, payload: ReservePayload) {
  return apiRequest<ProtectedReserve>(`/api/households/${householdId}/protected-reserves`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateReserve(
  householdId: string,
  reserveId: string,
  payload: Partial<ReservePayload>,
) {
  return apiRequest<ProtectedReserve>(
    `/api/households/${householdId}/protected-reserves/${reserveId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export function deleteReserve(householdId: string, reserveId: string) {
  return apiRequest<{ deleted: boolean; reserveId: string }>(
    `/api/households/${householdId}/protected-reserves/${reserveId}`,
    { method: 'DELETE' },
  )
}
