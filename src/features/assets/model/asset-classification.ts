/**
 * Asset classification (spec §11, §30) — Phase 11.
 *
 * Two independent axes that are easy to conflate:
 *  - `financialNature` — whose money this fundamentally IS.
 *  - `visibilityLevel` — how much of it other members SEE.
 *
 * A `personal_included` asset counts toward household totals but is still
 * someone's own money; a `summary_only` asset is everyone's money shown without
 * detail. Neither implies the other.
 */

/** Whose money this fundamentally is (§11). */
export type FinancialNature =
  | 'household'
  | 'personal_included'
  | 'managed_for_household'
  | 'personal_private'

export const FINANCIAL_NATURES: FinancialNature[] = [
  'household',
  'personal_included',
  'managed_for_household',
  'personal_private',
]

/**
 * The canonical model union (§30). All four levels are stored.
 *
 * **This is a breaking rename** from the pre-v3.1 frontend union
 * `'overview' | 'grouped' | 'detailed'`, which did not match the backend at
 * all — `detailed` was never a valid value and `private` could not be
 * expressed.
 */
export type VisibilityLevel = 'summary_only' | 'grouped' | 'detail' | 'private'

/**
 * The MVP exposes THREE levels in the picker, not four.
 *
 * `grouped` is deliberately omitted: it is a meaningful stored state but too
 * subtle to explain in a form without confusing people. A record already stored
 * as `grouped` still renders its label (read-only) rather than showing an empty
 * Select — see `isSelectableVisibility`.
 */
export const MVP_VISIBILITY_LEVELS: VisibilityLevel[] = [
  'detail',
  'summary_only',
  'private',
]

export function isSelectableVisibility(level: VisibilityLevel): boolean {
  return MVP_VISIBILITY_LEVELS.includes(level)
}

/**
 * `private` requires naming whose privacy it is (§30) — `created_by` is not a
 * valid substitute for a new record.
 */
export function requiresPrivacyOwner(level: VisibilityLevel): boolean {
  return level === 'private'
}

export const DEFAULT_FINANCIAL_NATURE: FinancialNature = 'household'
export const DEFAULT_VISIBILITY_LEVEL: VisibilityLevel = 'detail'
