/**
 * Protected reserves (spec §19C).
 *
 * A reserve is a CONSTRAINT on the forecast, not an account — nothing is moved
 * anywhere. It is subtracted when computing flexible money, so "how much can we
 * spend without breaking what we promised ourselves" has an answer.
 *
 * Only `active` reserves are subtracted. `archived` keeps the record and its
 * history without distorting today's picture — which is why archiving exists
 * instead of just deleting.
 */
export type ReserveStatus = 'active' | 'archived'

export type ProtectedReserve = {
  id: string
  householdId: string
  name: string
  amount: number
  status: ReserveStatus
  note?: string
  createdAt?: string
  updatedAt?: string
}
