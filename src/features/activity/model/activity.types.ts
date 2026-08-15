/**
 * The household journal — Nhật ký (§2.14, §14.10).
 *
 * The server emits CODES; this app owns every word, the same contract the
 * forecast's `AssumptionCode` already follows. A server-rendered sentence could
 * not be translated or restyled, and the i18n mandate is hard.
 */
export type ActivityActionCode =
  | 'asset.created'
  | 'asset.deleted'
  | 'asset.value_updated'
  | 'asset.liquidity_changed'
  | 'asset.sold'
  | 'cashflow_event.added'
  | 'cashflow_event.completed'
  | 'cashflow_event.cancelled'
  | 'cashflow_event.postponed'
  | 'protected_reserve.created'
  | 'protected_reserve.updated'
  | 'protected_reserve.archived'
  | 'goal.created'
  | 'goal.target_changed'
  | 'record.visibility_changed'
  | 'household.created'
  | 'household.deleted'
  | 'household.member_joined'
  | 'household.member_removed'
  | 'household.invite_created'
  | 'household.invite_revoked'
  | 'household.steward_transferred'
  | 'snapshot.created'
  | 'debt.corrected'

export type ActivityImpactMetric =
  | 'liquid'
  | 'net_worth'
  | 'flexible_money'
  | 'upcoming_outgoing'
  | 'protected_reserve'

export type ActivityEntry = {
  id: string
  /** ISO. The client renders it relative. */
  occurredAt: string
  /** null = the system did it (a worker, a migration). Never invent a name. */
  actor: { id: string; name: string | null } | null
  action: ActivityActionCode
  objectType: string
  objectId: string | null
  /** null when the record is folded — the journal must not undo the fold. */
  objectName: string | null
  amount: number | null
  impact: { metric: ActivityImpactMetric; delta: number } | null
}

export type ActivityPage = {
  householdId: string
  items: ActivityEntry[]
  nextCursor: string | null
}
