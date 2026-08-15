/**
 * A person in the household. There is no role and no permission level: both
 * partners have the same rights, and the only distinction anywhere is who
 * created the household, which the client never needs to render.
 */
export type MemberItem = {
  id: string
  name: string
  email: string
  initials: string
  joinedAt: string
  lastActive: string
  status: 'active' | 'invited'
}
