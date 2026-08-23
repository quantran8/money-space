import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@money-space/core/shared/lib/utils'

type QrCodeProps = {
  /** The payload to encode. Usually a URL. */
  value: string
  /** Rendered edge length in px. The bitmap is generated at 2× for retina. */
  size?: number
  /** Accessible description of what the code opens. */
  alt: string
  className?: string
}

/**
 * A QR code rendered as an image.
 *
 * **Always dark-on-white, in both themes.** A QR code is not decoration: a
 * scanner needs the quiet zone and the contrast polarity it expects, and dark
 * mode inverting both is the most common reason a code "just doesn't scan". So
 * this component opts out of the theme rather than following it — the white
 * plate is functional, not a style choice.
 */
export function QrCode({ value, size = 208, alt, className }: QrCodeProps) {
  /**
   * The encoded value is stored *alongside* its bitmap so a changed `value`
   * invalidates the previous render by comparison instead of by a synchronous
   * `setState(null)` in the effect body — which would show the code, then a
   * skeleton, then the new code, and trips `react-hooks/set-state-in-effect`.
   */
  const [rendered, setRendered] = useState<{ value: string; dataUrl: string | null } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false

    QRCode.toDataURL(value, {
      // 2× the rendered size so the code stays crisp on a phone screen — the
      // device most likely to be doing the scanning.
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#FFFFFF' },
    })
      .then((dataUrl) => {
        if (!cancelled) setRendered({ value, dataUrl })
      })
      .catch(() => {
        if (!cancelled) setRendered({ value, dataUrl: null })
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  const current = rendered?.value === value ? rendered : null

  return (
    <div
      className={cn(
        // No shadow and no border: v4.0 removed both (design.md §2.2–2.4), so
        // the white plate separates itself from the sunk block by lightness.
        'flex items-center justify-center rounded-card bg-white p-3',
        className,
      )}
      style={{ width: size + 24, height: size + 24 }}
    >
      {current === null ? (
        <Skeleton className="size-full rounded-[10px]" />
      ) : current.dataUrl ? (
        <img src={current.dataUrl} alt={alt} width={size} height={size} className="block" />
      ) : (
        // Encoding failed, so there is no join path in this box. Say nothing
        // here and let the caller's copyable link carry the flow.
        <div className="size-full rounded-[10px] bg-black/[0.04]" aria-hidden />
      )}
    </div>
  )
}
