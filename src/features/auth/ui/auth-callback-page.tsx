import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useGoogleCallback } from '@/features/auth/hooks/use-google-callback'

export function AuthCallbackPage() {
  const { t } = useTranslation()

  useGoogleCallback()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 className="size-5 animate-spin text-[hsl(var(--accent))]" />
        {t('auth.callback.signingIn')}
      </div>
    </main>
  )
}
