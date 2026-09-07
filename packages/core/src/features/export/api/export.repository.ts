import { apiFileRequest, type ApiFile } from '#/shared/api/http'

/** JSON is everything at once; CSV is one dataset per file. */
export type ExportFormat = 'json' | 'csv'

export type ExportDataset =
  | 'assets'
  | 'money-events'
  | 'cashflow-events'
  | 'goals'
  | 'debts'

export const EXPORT_DATASETS: ExportDataset[] = [
  'assets',
  'money-events',
  'cashflow-events',
  'goals',
  'debts',
]

/**
 * Download the household's data.
 *
 * Gated by `export_data` on the server, so a Free household gets a 402 with the
 * `export` paywall reason on it — the client never decides this itself.
 */
export function fetchExport(
  householdId: string,
  format: ExportFormat,
  dataset?: ExportDataset,
): Promise<ApiFile> {
  return apiFileRequest(`/households/${householdId}/export`, {
    format,
    dataset: format === 'csv' ? dataset : undefined,
  })
}
