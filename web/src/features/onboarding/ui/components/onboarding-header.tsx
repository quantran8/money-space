import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AuthUser } from '@money-space/core/features/auth/model/auth.types'

function initialsOf(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

type OnboardingHeaderProps = {
  user: AuthUser | null
}

/**
 * Sits on the app surface ABOVE the panel, not inside it: onboarding is one
 * panel with one question on it, and a header row inside that panel read as a
 * second thing to deal with. The signed-in name went with it — the avatar
 * already answers "which account is this", and it carries the full name as its
 * tooltip for the case where the initials are ambiguous.
 */
export function OnboardingHeader({ user }: OnboardingHeaderProps) {
  const { t } = useTranslation()
  const displayName = user?.displayName || user?.fullName || user?.email || ''

  return (
    <header className="mx-auto flex w-full max-w-[960px] items-center justify-between px-5 py-5 sm:px-7">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-control bg-card text-action">
          <Wallet className="size-[19px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="text-[16px] font-semibold tracking-[-0.01em]">
          {t('onboarding.appName')}
        </span>
      </div>

      <div
        className="flex size-10 items-center justify-center rounded-full bg-card text-[13px] font-semibold"
        title={displayName}
      >
        {initialsOf(user?.displayName ?? user?.fullName ?? null, user?.email ?? null)}
      </div>
    </header>
  )
}
