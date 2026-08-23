import type { StorageAdapter } from '@money-space/core/shared/storage'

/**
 * `localStorage` behind core's async storage interface.
 *
 * The promises resolve on the first tick, so nothing here actually waits — the
 * async shape exists for React Native, where SecureStore and AsyncStorage have
 * no synchronous equivalent.
 *
 * Every call is guarded: Safari in private mode throws on `setItem`, and a
 * failed write must never take down a sign-in that already succeeded in memory.
 */
export const webStorage: StorageAdapter = {
  getItem: async (key) => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key, value) => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Storage full or blocked — the in-memory session still works.
    }
  },
  removeItem: async (key) => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Nothing to do; a value we cannot remove is a value we cannot read back.
    }
  },
}
