/**
 * Persistence adapter, injected by the host app.
 *
 * The web reads `localStorage` synchronously; React Native's AsyncStorage and
 * SecureStore are promise-based. Core therefore talks to an async interface and
 * the web adapter simply resolves immediately — the reverse (a sync interface)
 * cannot be satisfied on native at all.
 *
 * This is what makes `hydrated` in the auth store a real flag rather than a
 * hardcoded `true`: on native the first read genuinely takes a tick, and a gate
 * that does not wait for it would bounce a signed-in user to the login screen
 * on every cold start.
 */

export type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/**
 * Keys that hold credentials. A host may route these to a more protected store
 * (Keychain / Keystore via expo-secure-store) while leaving the rest in plain
 * async storage.
 */
export const SECURE_STORAGE_KEYS = ['money-space-auth'] as const

/** Loses everything on reload; only used if a host forgets to configure one. */
function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>()
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    removeItem: async (key) => void map.delete(key),
  }
}

let adapter: StorageAdapter = createMemoryStorage()

export function configureStorage(next: StorageAdapter) {
  adapter = next
}

export const storage: StorageAdapter = {
  getItem: (key) => adapter.getItem(key),
  setItem: (key, value) => adapter.setItem(key, value),
  removeItem: (key) => adapter.removeItem(key),
}
