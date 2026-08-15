/**
 * Asset classification — who is responsible for a record, and how much of it
 * the shared picture shows.
 *
 * There is exactly ONE disclosure axis now. The old model paired
 * `visibilityLevel` with a `financialNature` axis whose only real job was to
 * pull `personal_private` money out of the household's totals, and offered a
 * `private` level that hid a record AND excluded it from every shared figure.
 * Both are gone: **everything recorded in Money Space counts toward the shared
 * picture.** A household number that silently omits records is not a shared
 * source of truth, which is the whole product.
 *
 * What remains is a choice about *detail*, not about *inclusion*:
 *  - `detail` — the shared list shows the source, the amount and the holder.
 *  - `summary_only` — the amount is counted, the specifics are folded away.
 *
 * `holderMemberId` lives alongside this but is a different question entirely:
 * who is *responsible for* the money, not who may see it.
 */

/**
 * How much of a record the shared picture shows.
 *
 * **This is a presentation level, not an access boundary.** Both partners have
 * the same rights and either can switch any record to `detail` with a single
 * edit, so folding a record is a courtesy about attention — "don't make me
 * explain this line, just count it" — never concealment. It applies to
 * everyone, including the person who set it: what I see is what they see, and
 * that symmetry is what makes the setting trustworthy without a permission
 * system behind it. Changing it is recorded in the journal.
 */
export type VisibilityLevel = 'detail' | 'summary_only'

export const VISIBILITY_LEVELS: VisibilityLevel[] = ['detail', 'summary_only']

export const DEFAULT_VISIBILITY_LEVEL: VisibilityLevel = 'detail'

/**
 * Collapse whatever the API sends into the two levels this app knows.
 *
 * This is the single read boundary for the 4 → 2 migration, and every display
 * and form site must go through it. While the backend still stores the retired
 * `grouped` and `private` values, this is what keeps the rest of the app from
 * ever seeing them.
 *
 * Retired values fold to `summary_only`, not `detail`: a record the household
 * had previously chosen not to itemize should not start showing its name and
 * holder just because the app was redeployed. A genuinely absent value is a new
 * record that never made a choice, so it takes the default.
 */
export function normalizeVisibility(
  raw: string | null | undefined,
): VisibilityLevel {
  if (raw === null || raw === undefined) return DEFAULT_VISIBILITY_LEVEL
  return raw === 'detail' ? 'detail' : 'summary_only'
}
