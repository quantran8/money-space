import { useCallback, useState } from 'react'

import {
  fetchExport,
  type ExportDataset,
  type ExportFormat,
} from '#/features/export/api/export.repository'
import { usePremiumAction } from '#/features/billing/hooks/use-premium-action'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { ApiError } from '#/shared/api/http'

/**
 * Hand the household a copy of their own data.
 *
 * Not a `useMutation`: nothing on the server changes and there is no cache to
 * touch. What it needs is the request, a saved file, and an error the caller
 * can render — so it is a plain async callback with the flags around it.
 *
 * The paywall is checked up front through `usePremiumAction` for the same
 * reason every other gate is: a Free household should see the sheet on click,
 * not after a round trip that was always going to 402. The server still
 * refuses independently.
 */
export function useExportData() {
  const { activeHouseholdId } = useActiveHousehold()
  const { run } = usePremiumAction()
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const exportData = useCallback(
    async (format: ExportFormat = 'json', dataset?: ExportDataset) => {
      if (!activeHouseholdId || isExporting) return

      await run({ reason: 'export' }, async () => {
        setIsExporting(true)
        setError(null)
        try {
          const file = await fetchExport(activeHouseholdId, format, dataset)
          saveFile(file.blob, file.filename || `oursight-export.${format}`)
        } catch (cause) {
          // A 402 is not an error to show here — the global handler has
          // already opened the paywall, and a red message beside it would be
          // saying the same thing twice, less kindly.
          if (!(cause instanceof ApiError && cause.statusCode === 402)) {
            setError(cause instanceof Error ? cause : new Error(String(cause)))
          }
        } finally {
          setIsExporting(false)
        }
      })
    },
    [activeHouseholdId, isExporting, run],
  )

  return { exportData, isExporting, error }
}

/**
 * Save a Blob under a filename.
 *
 * The object URL is revoked on the next tick rather than immediately: Safari
 * cancels the download if the URL dies before it has started reading.
 */
function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
