import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

type GoogleButtonProps = {
  label: string
  pending: boolean
  onClick: () => void
}

export function GoogleButton({ label, pending, onClick }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="mt-7 w-full gap-3"
      disabled={pending}
      onClick={onClick}
    >
      <GoogleIcon />
      {label}
    </Button>
  )
}

export function AuthDivider() {
  const { t } = useTranslation()
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-[hsl(var(--border))]" />
      <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
        {t('auth.or')}
      </span>
      <div className="h-px flex-1 bg-[hsl(var(--border))]" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20H24v8h11.3C33.6 32.7 29.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.6 0 19.2-8.1 19.2-19.5 0-1.3-.1-2.2-.3-3.1z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.7-1.7 13.1-4.7l-6.1-5.2C29 35.4 26.6 36 24 36c-5.1 0-9.5-3.2-11.2-7.7l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.1 5.2c-.4.4 6.1-4.5 6.1-14.2 0-1.3-.1-2.2-.3-3.1z"
      />
    </svg>
  )
}
