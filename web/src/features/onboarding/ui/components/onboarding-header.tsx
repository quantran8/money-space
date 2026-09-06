import { LogOut, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AuthUser } from '@money-space/core/features/auth/model/auth.types'
import { useLogout } from '@money-space/core/features/auth/hooks/use-logout'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
 *
 * The avatar is a menu rather than a label because this screen is a dead end:
 * there is no sidebar, no tab bar, and no household to navigate back into, so
 * the account menu is the ONLY way off it that is not answering the question.
 * Someone who just left a space and is not ready to create another must still
 * be able to sign out.
 */
export function OnboardingHeader({ user }: OnboardingHeaderProps) {
  const { t } = useTranslation()
  const logout = useLogout()
  const displayName = user?.displayName || user?.fullName || user?.email || ''

  return (
    <header className="mx-auto flex w-full max-w-[960px] items-center justify-between px-5 py-5 sm:px-7">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-control bg-card text-action">
          <Wallet className="size-[19px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="t-body font-medium tracking-[-0.01em]">
          {t('onboarding.appName')}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-10 items-center justify-center rounded-full bg-card t-body-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
          title={displayName}
          aria-label={t('shell.accountMenu')}
        >
          {initialsOf(user?.displayName ?? user?.fullName ?? null, user?.email ?? null)}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void logout()}>
            <LogOut className="size-4" />
            {t('shell.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
