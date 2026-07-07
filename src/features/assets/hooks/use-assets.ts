import { seedAssets, seedSnapshots } from '@/features/assets/api/assets.repository'

/**
 * Read seam for the assets feature. Returns the initial asset list and
 * snapshot history. Backed by mock seed data today; swap the repository
 * calls for Supabase queries when the backend is wired up.
 */
export function useAssets() {
  return { assets: seedAssets, snapshots: seedSnapshots }
}
