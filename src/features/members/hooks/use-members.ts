import { household, householdMembers } from '@/features/members/api/members.repository'

/**
 * Read seam for the members feature. Returns the household and its members
 * from mock seed data; swap for a Supabase query later.
 */
export function useMembers() {
  return { household, members: householdMembers }
}
