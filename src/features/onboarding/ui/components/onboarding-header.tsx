import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AuthUser } from '@/features/auth/model/auth.types'

function initialsOf(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

type OnboardingHeaderProps = {
  user: AuthUser | null
}

export function OnboardingHeader({ user }: OnboardingHeaderProps) {
  const { t } = useTranslation()
  const displayName = user?.displayName || user?.fullName || user?.email || ''

  return (
    <header className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 sm:px-8">
      <div className="inline-flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
          <Wallet className="size-5" />
        </span>
        <span className="font-semibold tracking-[-0.03em]">{t('onboarding.appName')}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('onboarding.signedIn')}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-sm font-semibold">
          {initialsOf(user?.displayName ?? user?.fullName ?? null, user?.email ?? null)}
        </div>
      </div>
    </header>
  )
}
