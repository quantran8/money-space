export type HouseholdRole = 'owner' | 'partner' | 'viewer'

export type PermissionLevel =
  | 'view_summary'
  | 'view_grouped'
  | 'view_detail'
  | 'edit_content'
  | 'admin'

export type MemberItem = {
  id: string
  name: string
  email: string
  initials: string
  role: HouseholdRole
  permission: PermissionLevel
  joinedAt: string
  lastActive: string
  status: 'active' | 'invited'
}
