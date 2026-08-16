/**
 * The household journal — Nhật ký (§2.14, §14.10).
 *
 * The server emits CODES; this app owns every word, the same contract the
 * forecast's `AssumptionCode` already follows. A server-rendered sentence could
 * not be translated or restyled, and the i18n mandate is hard.
 *
 * The `protected_reserve.*` codes are gone from this union because the backend
 * can no longer emit them. Their COPY stays in `resources.ts`: `activity-copy`
 * looks the key up dynamically, and audit rows written before the removal still
 * carry those action strings — dropping the strings would render a raw key in
 * somebody's history.
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
