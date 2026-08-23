import * as SecureStore from 'expo-secure-store'

import { SECURE_STORAGE_KEYS } from '@money-space/core/shared/storage'

import type { StorageAdapter } from '@money-space/core/shared/storage'

/**
 * Persistence for the mobile app.
 *
 * Credentials go to SecureStore (Keychain on iOS, Keystore on Android);
 * everything else — the active household, the language — is ordinary
 * preference data and lives in the same store for simplicity, since the volume
 * is tiny and SecureStore is not meaningfully slower at this size.
 *
 * SecureStore keys must be alphanumeric plus `.`, `-` and `_`, so the app's
 * `money-space-*` keys pass through unchanged.
 *
 * Every call is guarded: a device with a broken keychain must start signed out
 * rather than crash on launch.
 */

function isSecureKey(key: string): boolean {
  return (SECURE_STORAGE_KEYS as readonly string[]).includes(key)
}

export const nativeStorage: StorageAdapter = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value, {
        // Credentials stay readable only once the device has been unlocked at
        // least since boot; they are never needed in the background.
        keychainAccessible: isSecureKey(key)
          ? SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
          : SecureStore.AFTER_FIRST_UNLOCK,
      })
    } catch {
      // A failed write must not break a sign-in that already succeeded.
    }
  },
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch {
      // Nothing to do; a value we cannot delete is one we cannot read back.
    }
  },
}
