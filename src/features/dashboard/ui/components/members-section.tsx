import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import type { MemberItem } from '@/features/members/model/members.types'
import { SectionCard } from '@/features/dashboard/ui/components/section-card'
import { cn } from '@/shared/lib/utils'

type MembersSectionProps = {
  members: MemberItem[]
  subtitle: string
}

export function MembersSection({ members, subtitle }: MembersSectionProps) {
  const { t } = useTranslation()

  return (
    <SectionCard
      title={t('nav.members')}
      subtitle={subtitle}
      to="/members"
      className="lg:col-span-4"
    >
      <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]">
        {members.slice(0, 3).map((member) => (
          <Link
            key={member.id}
            to="/members"
            className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--background))] text-xs font-semibold tracking-[-0.01em]">
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium tracking-[-0.01em]">{member.name}</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {member.lastActive}
                </p>
              </div>
            </div>
            <Badge
              className={cn(
                member.status === 'active'
                  ? 'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]'
                  : 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
              )}
            >
              {member.status === 'active'
                ? t('members.strip.active')
                : t('members.list.pending')}
            </Badge>
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
