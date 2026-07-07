import { financialGoals } from '@/features/goals/api/goals.repository'

/**
 * Read seam for the goals feature. Returns the initial goal list from mock
 * seed data; swap for a Supabase query when the backend is wired up.
 */
export function useGoals() {
  return { goals: financialGoals }
}
