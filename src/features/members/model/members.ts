import type {
  HouseholdRole,
  PermissionLevel,
} from '@/features/members/model/members.types'

export type {
  HouseholdRole,
  MemberItem,
  PermissionLevel,
} from '@/features/members/model/members.types'

export const roleLabels: Record<HouseholdRole, string> = {
  owner: 'Chủ hộ',
  partner: 'Bạn đời',
  viewer: 'Người xem',
}

export const permissionLabels: Record<PermissionLevel, string> = {
  view_summary: 'Xem tổng quan',
  view_grouped: 'Xem theo nhóm',
  view_detail: 'Xem chi tiết',
  edit_content: 'Chỉnh sửa nội dung',
  admin: 'Toàn quyền',
}
