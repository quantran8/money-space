import { debtItems } from '@/features/debts/api/debts.repository'

/**
 * Mock read seam for the debts feature.
 * Replace with Supabase tables `debts`, `debt_terms` and related joins later.
 */
export function useDebts() {
  return { debts: debtItems }
}
