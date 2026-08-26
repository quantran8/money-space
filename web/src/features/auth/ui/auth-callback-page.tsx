import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useGoogleCallback } from '@money-space/core/features/auth/hooks/use-google-callback'

export function AuthCallbackPage() {
  const { t } = useTranslation()

  useGoogleCallback()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="flex items-center gap-3 t-body-sm text-ink2">
        <Loader2 className="size-5 animate-spin text-action" />
        {t('auth.callback.signingIn')}
      </div>
    </main>
  )
}
