import {
  assetGroups,
  attentionItems,
  dashboardGoals,
  dashboardSnapshot,
  upcomingPayments,
} from '@/features/dashboard/api/dashboard.repository'
import { moneyEvents } from '@/features/events/api/events.repository'

/**
 * Read seam for the home dashboard. Aggregates the household snapshot,
 * upcoming payments, goals, asset groups, attention items and recent events
 * from mock seed data; swap for Supabase reads/rollups later.
 */
export function useDashboardOverview() {
  return {
    snapshot: dashboardSnapshot,
    payments: upcomingPayments,
    goals: dashboardGoals,
    assetGroups,
    attentionItems,
    recentEvents: moneyEvents,
  }
}
