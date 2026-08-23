/**
 * One asset as the goal screens offer it, exactly as core's `useGoalsPage`
 * builds it in `assetOptions`.
 *
 * Declared here rather than imported because the hook returns it structurally;
 * this is a name for that shape, not a second source of truth. `type` seeds a
 * share's role (wallet → contribution) and nothing else.
 */
export type AllocationAssetOption = {
  value: string
  label: string
  name: string
  balance: number
  type?: string
}
