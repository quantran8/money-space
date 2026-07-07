import type { MemberItem } from '@/features/members/model/members.types'

export const household = {
  name: 'Nhà Minh',
  currency: 'VND',
  updateFrequency: 'weekly',
  createdAt: '12 Jan 2026',
}

export const householdMembers: MemberItem[] = [
  {
    id: 'm1',
    name: 'Minh Nguyễn',
    email: 'minh@nhaminh.vn',
    initials: 'MN',
    role: 'owner',
    permission: 'admin',
    joinedAt: '12 Jan 2026',
    lastActive: 'Hôm nay',
    status: 'active',
  },
  {
    id: 'm2',
    name: 'An Trần',
    email: 'an@nhaminh.vn',
    initials: 'AT',
    role: 'partner',
    permission: 'edit_content',
    joinedAt: '18 Jan 2026',
    lastActive: 'Hôm qua',
    status: 'active',
  },
  {
    id: 'm3',
    name: 'Bà ngoại',
    email: 'ngoai@nhaminh.vn',
    initials: 'BN',
    role: 'viewer',
    permission: 'view_summary',
    joinedAt: '02 Feb 2026',
    lastActive: '3 ngày trước',
    status: 'invited',
  },
]
