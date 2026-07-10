import type { UseFormRegisterReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type InviteSectionProps = {
  register: UseFormRegisterReturn
  error?: string
  invalid: boolean
}

/** Optional "invite a partner" block inside the create-household form. */
export function InviteSection({ register, error, invalid }: InviteSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">{t('onboarding.invite.title')}</h3>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('onboarding.invite.description')}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[hsl(var(--card))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          {t('onboarding.invite.optional')}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Label>{t('onboarding.invite.emailLabel')}</Label>
        <Input
          type="email"
          autoComplete="email"
          placeholder={t('onboarding.invite.emailPlaceholder')}
          aria-invalid={invalid}
          {...register}
        />
        {error ? (
          <p className="text-xs font-medium text-[hsl(var(--status-red))]">{error}</p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[hsl(var(--card))] p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {t('onboarding.invite.defaultRoleLabel')}
          </p>
          <p className="mt-1 text-sm font-semibold">{t('options.role.partner')}</p>
        </div>
        <div className="rounded-2xl bg-[hsl(var(--card))] p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {t('onboarding.invite.defaultPermissionLabel')}
          </p>
          <p className="mt-1 text-sm font-semibold">{t('options.permission.view_detail')}</p>
        </div>
      </div>
    </section>
  )
}
