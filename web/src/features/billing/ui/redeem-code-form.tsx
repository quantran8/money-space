import { ClipboardPaste } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useRedeemCode } from '@money-space/core/features/billing/hooks/use-redeem-code'
import { clipboard } from '@money-space/core/shared/clipboard'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** `2027-12-31T…` → `31/12/2027`. */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

const ERROR_KEYS = {
  invalid: 'billing.redeem.error.invalid',
  expired: 'billing.redeem.error.expired',
  exhausted: 'billing.redeem.error.exhausted',
  already_used: 'billing.redeem.error.alreadyUsed',
  no_effect: 'billing.redeem.error.noEffect',
  rate_limited: 'billing.redeem.error.rateLimited',
} as const

/**
 * Enter a code, see what it does, then activate it.
 *
 * The confirm step is not ceremony: a spent code cannot be recovered, and codes
 * are typed off a screenshot in a chat. The preview also names the household,
 * which is what saves someone who belongs to two of them.
 */
export function RedeemCodeForm({ onRedeemed }: { onRedeemed?: () => void }) {
  const { t } = useTranslation()
  const {
    input,
    onChange,
    step,
    preview,
    reason,
    pending,
    canSubmit,
    check,
    confirm,
    reset,
  } = useRedeemCode(onRedeemed)

  if (step === 'done') {
    const grant = preview?.grant
    return (
      <div>
        <p className="t-subtitle">{t('billing.redeem.success.title')}</p>
        <p className="mt-2 t-body-sm leading-5 text-ink2">
          {grant?.isLifetime || !grant?.periodEndAfter
            ? t('billing.redeem.success.lifetime')
            : t('billing.redeem.success.description', {
                date: formatDate(grant.periodEndAfter),
              })}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={reset}>
          {t('billing.redeem.success.done')}
        </Button>
      </div>
    )
  }

  if (step === 'previewing' && preview?.grant) {
    const { grant } = preview
    return (
      <div>
        <p className="t-subtitle">{t('billing.redeem.preview.title')}</p>
        <p className="mt-2 t-body-sm leading-5 text-ink2">
          {grant.isLifetime
            ? t('billing.redeem.preview.lifetime')
            : grant.stacked && grant.periodEndAfter
              ? t('billing.redeem.preview.stacked', {
                  current: formatDate(
                    new Date(
                      new Date(grant.periodEndAfter).getTime() -
                        grant.addedDays * 86_400_000,
                    ).toISOString(),
                  ),
                  days: grant.addedDays,
                  after: formatDate(grant.periodEndAfter),
                })
              : t('billing.redeem.preview.description', { days: grant.addedDays })}
        </p>
        <p className="mt-1 t-caption text-ink3">
          {t('billing.redeem.preview.forHousehold', { name: preview.householdName })}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void confirm()} disabled={pending}>
            {pending
              ? t('billing.redeem.submitting')
              : t('billing.redeem.preview.confirm')}
          </Button>
          <Button variant="secondary" size="sm" onClick={reset} disabled={pending}>
            {t('billing.redeem.preview.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="t-subtitle">{t('billing.redeem.title')}</p>
      <p className="mt-1 t-body-sm leading-5 text-ink2">
        {t('billing.redeem.description')}
      </p>

      <form
        className="mt-4 flex flex-wrap items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void check()
        }}
      >
        <Input
          value={input}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('billing.redeem.placeholder')}
          // A phone keyboard's autocorrect will happily rewrite a code.
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!reason}
          className="w-full max-w-[15rem] font-mono uppercase"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t('billing.redeem.paste')}
          onClick={() => void clipboard.readText().then(onChange).catch(() => {})}
        >
          <ClipboardPaste className="size-4" strokeWidth={1.75} />
        </Button>
        {/* Never disabled while there is something to submit: a dead button
            explains nothing, the error under it does. */}
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {pending ? t('billing.redeem.submitting') : t('billing.redeem.submit')}
        </Button>
      </form>

      {reason ? (
        <p className="mt-2 t-caption font-medium text-alert-ink">
          {t(ERROR_KEYS[reason])}
        </p>
      ) : null}
    </div>
  )
}
