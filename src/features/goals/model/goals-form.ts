import { z } from 'zod'

import type { GoalItem, GoalPriority } from '@/features/goals/model/goals'
import { formatVndShort } from '@/shared/lib/format-money'
import {
  localizedMoneyAmount,
  localizedOptionalMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/shared/lib/validation'

/** One asset's share, as the create form holds it. */
export type GoalAllocationDraft = {
  assetId: string
  kind: 'fixed' | 'percent'
  /**
   * Whether this share is money being contributed monthly, or value already
   * held. Both count towards the goal; only `contribution` counts towards the
   * pace, because a wallet has no market price and gold's does — measuring the
   * pace on gold answered "did we save 10tr?" with the gold price.
   */
  role: 'contribution' | 'holding'
  /** Digits only, when `kind = 'fixed'`. */
  amount: string
  /** 1–100, when `kind = 'percent'`. */
  percent: string
  /**
   * Digits only: what this wallet puts into the goal each month.
   *
   * Only a wallet share carries one — a pace has to name the account the money
   * comes out of — and the goal's pace is the sum across these rows. Empty means
   * "this wallet is behind the goal but feeds it no fixed amount".
   */
  monthlyContribution: string
  /**
   * Digits only: this goal's share (1–100) of the wallet's remaining monthly
   * room, used only when goals tied at the same priority cannot all be paid in
   * full.
   *
   * Asked for ONLY when the chosen wallet already backs another goal at the same
   * priority — that is the tie `priority` cannot break, and it is the only case
   * where the household has a decision to make. Empty everywhere else.
   */
  sharePercent: string
}

/**
 * The role a share takes before the household says otherwise: wallets are what
 * money is contributed THROUGH, everything else is value already held. Only a
 * default — a household with a spending wallet and a savings wallet must be able
 * to say only the second one feeds this goal.
 */
export function defaultAllocationRole(
  assetType: string | undefined,
): 'contribution' | 'holding' {
  return isWalletAssetType(assetType) ? 'contribution' : 'holding'
}

/**
 * A wallet: money the household can put in and take out at face value, with no
 * market price in between. Only these can carry a monthly amount, and a goal
 * needs at least one behind it — mirrors the server's rule.
 */
export function isWalletAssetType(assetType: string | undefined): boolean {
  return assetType === 'cash' || assetType === 'bank_account'
}

export type GoalForm = {
  name: string
  target: string
  /**
   * Which assets count towards this goal. **At least one is required** — a goal
   * is a set of shares of real assets, so one with no shares has no progress and
   * no way to gain any.
   *
   * "Set aside 100tr from shared money" is a fixed 100tr share of the wallet
   * holding it: shared money is not a separate kind of money, it is the
   * household's cash / bank accounts.
   *
   * Create-only. Shares are edited afterwards one at a time, where each write
   * can be checked against what the asset still has free.
   */
  allocations: GoalAllocationDraft[]
  /**
   * The goal's current progress, shown read-only while editing. Never sent —
   * it is derived from the allocations above.
   */
  current: string
  /**
   * The goal's declared monthly pace, shown read-only. NEVER sent: the server
   * keeps it as the sum of the wallet shares' own amounts, which is where the
   * household edits it — on create through `allocations` above, afterwards
   * through the goal's assets panel.
   *
   * It is what drives the §26C projection: undeclared, the API returns
   * `reason: 'no_contribution'` and the UI can only show progress, never a
   * projected completion date (§14.3).
   */
  plannedMonthly: string
  priority: GoalPriority
  targetDate: string
  note: string
}

export type RecentUpdate = {
  id: string
  text: string
}

export type GoalStats = {
  saved: number
  target: number
  avg: number
}

export type GoalAllocationSlice = {
  id: string
  name: string
  percent: number
  color: string
}

export const defaultGoalFormValues: GoalForm = {
  name: '',
  target: '',
  allocations: [],
  current: '',
  plannedMonthly: '',
  priority: 'medium',
  targetDate: '',
  note: '',
}

export const priorityRank: Record<GoalPriority, number> = { high: 0, medium: 1, low: 2 }

export const priorityTone: Record<GoalPriority, string> = {
  high: 'bg-alert-tint text-alert',
  medium: 'bg-[hsl(var(--secondary))] text-ink2',
  low: 'bg-[hsl(var(--secondary))] text-ink2',
}

// One hue per allocation slice, cycled by goal order (validated status palette).
export const allocationColors = [
  'hsl(142 71% 45%)', // green
  'hsl(35 100% 50%)', // orange
  'hsl(211 100% 50%)', // blue
  'hsl(240 4% 65%)', // gray
]

export function formatAmount(value: number) {
  return formatVndShort(value)
}

/** Convert a stored VND amount into the raw digit string the form holds. */
export function amountToRaw(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return String(Math.round(value))
}

/** Suggested monthly top-up: remaining spread over ~4 months, min 1M when short. */
export function suggestedPace(goal: GoalItem) {
  const remaining = Math.max(goalAmount(goal.targetAmount) - goalAmount(goal.currentAmount), 0)
  if (remaining <= 0) return 0
  return Math.max(1_000_000, Math.round(remaining / 4))
}

/**
 * The goal's VND amount as a number. The API sends the raw numeric
 * `currentAmount` / `targetAmount`; this normalizes a possibly-missing value
 * to 0.
 */
export function goalAmount(amount: number | undefined): number {
  return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
}

/**
 * Pass `isEditing` so the schema stops requiring allocations once the goal
 * exists — afterwards each share is edited on its own, where the write can be
 * checked against what the asset still has free.
 */
export function buildGoalSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
  isEditing = false,
  /**
   * Ids of the household's cash / bank accounts. A goal needs one behind it —
   * money is only ever put in through a wallet — and checking it here means the
   * household is told while filling the form, rather than by a 400 on submit.
   */
  walletAssetIds: ReadonlySet<string> = new Set(),
  /**
   * Which OTHER goals already draw on each wallet, and at what priority.
   *
   * A share is only asked for when a wallet already feeds another goal at the
   * SAME priority — that is the tie `priority` cannot break. The priority is read
   * from the values being validated rather than passed in, so the question
   * follows the dropdown without the schema having to be rebuilt.
   */
  walletRivals: ReadonlyMap<string, ReadonlyArray<{ priority: string }>> = new Map(),
) {
  return z
    .object({
      name: localizedRequiredText(t, t('goals.form.name')),
      target: localizedMoneyAmount(t),
      allocations: z.array(
        z.object({
          assetId: z.string(),
          kind: z.enum(['fixed', 'percent']),
          role: z.enum(['contribution', 'holding']),
          amount: z.string(),
          percent: z.string(),
          monthlyContribution: z.string(),
          sharePercent: z.string(),
        }),
      ),
      current: localizedOptionalMoneyAmount(t),
      plannedMonthly: localizedOptionalMoneyAmount(t),
      priority: z.enum(['high', 'medium', 'low']),
      targetDate: z.string(),
      note: localizedOptionalText(t, 120),
    })
    .superRefine((values, ctx) => {
      // Create-only: on edit the allocations panel owns this, one share at a
      // time, so an empty array here just means "not being edited".
      if (!isEditing && values.allocations.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['allocations'],
          message: t('goals.form.allocationsRequired'),
        })
      }
      // Gold and stocks can back a goal, but nothing is ever paid INTO them on a
      // schedule; without a wallet the goal moves on the market alone and "did we
      // keep our pace?" has no source to read.
      if (
        !isEditing &&
        values.allocations.length > 0 &&
        !values.allocations.some((row) => walletAssetIds.has(row.assetId))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['allocations'],
          message: t('goals.form.walletRequired'),
        })
      }
      for (const [index, row] of values.allocations.entries()) {
        if (row.kind === 'percent') {
          if (!(Number(row.percent) > 0 && Number(row.percent) <= 100)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['allocations', index],
              message: t('goals.form.allocationInvalid'),
            })
          }
          continue
        }
        const amount = Number(row.amount)
        if (row.role === 'contribution') {
          // Starting from nothing is the ordinary case: a household declaring
          // "6tr a month out of the salary account" has not set anything aside
          // yet, and demanding a starting amount would make them invent one or
          // abandon the goal. What the row cannot be is empty in BOTH senses —
          // neither money behind it nor money coming — because then it claims
          // nothing at all.
          if (!(amount > 0) && !(Number(row.monthlyContribution) > 0)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['allocations', index],
              message: t('goals.allocations.contributionEmpty'),
            })
          }
          // This wallet already feeds another goal at the same priority, so the
          // household has to say how the two divide it when it runs short.
          // Asked now rather than when the money runs out: by then the split has
          // already been guessed at, and the guess is what they would be
          // correcting.
          const rivals = walletRivals.get(row.assetId) ?? []
          if (
            rivals.some((rival) => rival.priority === values.priority) &&
            Number(row.monthlyContribution) > 0
          ) {
            const share = Number(row.sharePercent)
            if (!(share > 0 && share <= 100)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['allocations', index],
                message: t('goals.allocations.shareRequired'),
              })
            }
          }
          continue
        }
        // A holding is only ever "value we already have towards this", so a
        // share of nothing is not a share.
        if (!(amount > 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['allocations', index],
            message: t('goals.form.allocationInvalid'),
          })
        }
      }
      // Only meaningful on create — on edit the field is not rendered and the
      // API ignores it, so a stale value must not block the save.
      if (!isEditing && values.current !== '' && values.target !== '') {
        if (Number(values.current) > Number(values.target)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['current'],
            message: t('goals.form.currentExceedsTarget'),
          })
        }
      }
    })
}
