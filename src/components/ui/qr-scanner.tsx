import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

import { cn } from '@/shared/lib/utils'

type QrScannerProps = {
  /** Called once, with the decoded text, on the first successful read. */
  onDecode: (text: string) => void
  /** Called when the camera cannot be opened at all (denied, absent, insecure). */
  onError?: (reason: 'denied' | 'unavailable') => void
  className?: string
}

/** Frames per second to decode at. Decoding is the expensive part, not capture. */
const DECODE_INTERVAL_MS = 200
/** Decode at a fixed working size — full sensor resolution buys nothing here. */
const DECODE_EDGE = 480

/**
 * Live camera QR scanner.
 *
 * Decodes with `jsQR` over frames pulled from `getUserMedia`, rather than the
 * browser's own `BarcodeDetector`: that API does not exist in Safari or Firefox,
 * and Safari on iOS is the single most likely place someone scans an invite. A
 * ~30KB pure-JS decoder that works the same everywhere beats a native path plus
 * a fallback path, only one of which would ever get tested.
 *
 * **Requires a secure context.** `getUserMedia` is unavailable on plain HTTP
 * except on localhost, so on a LAN IP over http:// this reports `unavailable`
 * and the caller must keep a paste-the-link route open.
 */
export function QrScanner({ onDecode, onError, className }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLive, setIsLive] = useState(false)

  /**
   * Held in refs, not state: the decode loop reads them on every tick, and
   * threading them through render would restart the camera on each frame.
   */
  const decodedRef = useRef(false)
  const onDecodeRef = useRef(onDecode)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onDecodeRef.current = onDecode
    onErrorRef.current = onError
  }, [onDecode, onError])

  const startedRef = useRef(false)

  const start = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true

    if (!navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current?.('unavailable')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // The rear camera is the one pointed at someone else's screen.
        video: { facingMode: 'environment' },
        audio: false,
      })
    } catch (cause) {
      const name = (cause as { name?: string } | null)?.name
      onErrorRef.current?.(name === 'NotAllowedError' ? 'denied' : 'unavailable')
      return
    }

    const video = videoRef.current
    if (!video) {
      // Unmounted while the permission prompt was open — do not leave the
      // camera light on.
      for (const track of stream.getTracks()) track.stop()
      return
    }

    video.srcObject = stream
    await video.play().catch(() => undefined)
    setIsLive(true)

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    const timer = window.setInterval(() => {
      if (decodedRef.current || !context || video.readyState < 2) return

      const { videoWidth: w, videoHeight: h } = video
      if (!w || !h) return

      const scale = Math.min(1, DECODE_EDGE / Math.max(w, h))
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const frame = context.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(frame.data, frame.width, frame.height, {
        inversionAttempts: 'dontInvert',
      })
      if (!result?.data) return

      // Guarded so a code held in frame fires the caller exactly once.
      decodedRef.current = true
      onDecodeRef.current(result.data)
    }, DECODE_INTERVAL_MS)

    stopRef.current = () => {
      window.clearInterval(timer)
      for (const track of stream.getTracks()) track.stop()
      video.srcObject = null
    }
  }, [])

  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    void start()
    return () => {
      stopRef.current?.()
      stopRef.current = null
    }
  }, [start])

  return (
    <div
      className={cn(
        'relative aspect-square w-full overflow-hidden rounded-card bg-black/80',
        className,
      )}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className={cn(
          'size-full object-cover transition-opacity',
          isLive ? 'opacity-100' : 'opacity-0',
        )}
      />
      {/* A framing guide, not a crop: jsQR reads the whole frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[14%] rounded-card border-2 border-white/70"
      />
    </div>
  )
}
