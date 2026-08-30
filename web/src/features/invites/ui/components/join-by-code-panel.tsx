import { useState } from 'react'
import { Camera, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QrScanner } from '@/components/ui/qr-scanner'
import { joinPathFor, parseInviteInput } from '@money-space/core/features/invites/model/invites.types'

/**
 * "Tham gia nhà đã có" — the second half of onboarding.
 *
 * Two ways in, and both land on the same `/join` screen, so the preview and the
 * accept have exactly one implementation:
 *
 * - **paste the link** — always available, and the only thing that works when
 *   the two people are not in the same room, or when the browser has no camera
 *   to offer (`getUserMedia` needs a secure context, so plain http:// on a LAN
 *   IP has none);
 * - **scan the QR** — for when they are.
 *
 * The paste field takes a full URL or a bare token: what lands in a clipboard
 * depends on how the link travelled, and refusing a recognizable token over
 * formatting would be the most irritating way to fail here.
 */
export function JoinByCodePanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  function go(input: string) {
    const parsed = parseInviteInput(input)
    if (!parsed) {
      setError(t('invites.joinByCode.invalid'))
      return
    }
    setError(null)
    navigate(joinPathFor(parsed))
  }

  return (
    <div>
      <h1 className="t-page-tracking t-metric leading-[1.2] sm:t-figure">
        {t('invites.joinByCode.title')}
      </h1>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault()
          go(value)
        }}
        noValidate
      >
        <label htmlFor="invite-code" className="mb-2 block t-body-sm text-ink2">
          {t('invites.joinByCode.inputLabel')}
        </label>
        <Input
          id="invite-code"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          placeholder={t('invites.joinByCode.inputPlaceholder')}
          aria-invalid={!!error}
          autoComplete="off"
          spellCheck={false}
          className="font-mono t-body-sm"
        />
        {error ? <p className="mt-2 t-caption font-medium text-alert-ink">{error}</p> : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {!scanning ? (
            <Button
              type="button"
              variant="secondary"
              className="h-11 flex-1 px-5"
              onClick={() => {
                setError(null)
                setScanning(true)
              }}
            >
              <Camera className="size-[18px]" strokeWidth={1.7} aria-hidden />
              {t('invites.joinByCode.scan')}
            </Button>
          ) : null}
          <Button
            type="submit"
            className="h-11 flex-1 px-5"
            disabled={!value.trim()}
          >
            {t('invites.joinByCode.submit')}
          </Button>
        </div>
      </form>

      {scanning ? (
        <div className="sunk mt-6 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="t-body-sm font-medium">{t('invites.joinByCode.scanTitle')}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 t-caption"
              onClick={() => setScanning(false)}
            >
              <X className="size-3.5" aria-hidden />
              {t('invites.joinByCode.scanStop')}
            </Button>
          </div>

          <div className="mt-3 flex justify-center">
            <QrScanner
              className="max-w-[320px]"
              onDecode={(text) => {
                setScanning(false)
                setValue(text)
                go(text)
              }}
              onError={(reason) => {
                setScanning(false)
                setError(
                  reason === 'denied'
                    ? t('invites.joinByCode.cameraDenied')
                    : t('invites.joinByCode.cameraUnavailable'),
                )
              }}
            />
          </div>

          <p className="mt-3 text-center t-caption leading-5 text-ink2">
            {t('invites.joinByCode.scanHint')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
