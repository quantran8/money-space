import { moneyEvents } from '@/features/events/api/events.repository'

/**
 * Read seam for the events feature. Returns the initial money-event list
 * from mock seed data; swap for a Supabase query later.
 */
export function useEvents() {
  return { events: moneyEvents }
}
