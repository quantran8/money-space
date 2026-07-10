import { Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { PermissionLevel } from '@/features/members/model/members'

type MembersSidebarProps = {
  permissionLabels: Record<PermissionLevel, string>
  onInvite: () => void
}

export function MembersSidebar({ permissionLabels, onInvite }: MembersSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="space-y-4 lg:col-span-5">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('members.quickInvite.eyebrow')}
            </p>
            <h3 className="section-title mt-1 text-xl font-semibold">
              {t('members.quickInvite.title')}
            </h3>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserPlus className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {t('members.invite.helper')}
        </p>
        <Button className="mt-4 w-full" onClick={onInvite}>
          <Mail className="mr-2 size-4" />
          {t('members.invite.submit')}
        </Button>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
          <h3 className="text-lg font-semibold">{t('members.access.title')}</h3>
        </div>
        <div className="space-y-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          <p>
            <span className="font-medium text-[hsl(var(--foreground))]">
              {t('options.role.owner')}
            </span>{' '}
            {t('members.access.owner')}
          </p>
          <p>
            <span className="font-medium text-[hsl(var(--foreground))]">
              {t('options.role.partner')}
            </span>{' '}
            {t('members.access.partner')}
          </p>
          <p>
            <span className="font-medium text-[hsl(var(--foreground))]">
              {t('options.role.viewer')}
            </span>{' '}
            {t('members.access.viewer')}
          </p>
        </div>

        <p className="mb-3 mt-6 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          {t('members.permissionLevels.title')}
        </p>
        <div className="surface-muted rounded-3xl p-2">
          {(Object.keys(permissionLabels) as PermissionLevel[]).map((level) => (
            <div
              key={level}
              className="flex items-start justify-between gap-4 rounded-2xl px-3 py-3"
            >
              <p className="shrink-0 text-sm font-semibold text-[hsl(var(--foreground))]">
                {permissionLabels[level]}
              </p>
              <p className="text-right text-sm text-[hsl(var(--muted-foreground))]">
                {t(`members.permissionLevels.${level}`)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-transparent bg-[hsl(var(--foreground))] text-white">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-white/60" strokeWidth={1.8} />
          <p className="text-sm text-white/60">{t('members.privacy.eyebrow')}</p>
        </div>
        <h3 className="section-title mt-2 text-2xl font-semibold">
          {t('members.privacy.title')}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/70">
          {t('members.privacy.description')}
        </p>
      </Card>
    </aside>
  )
}
