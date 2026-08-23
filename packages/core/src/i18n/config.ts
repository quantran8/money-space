import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resources } from '#/i18n/resources'
import { storage } from '#/shared/storage'

export const supportedLanguages = ['vi', 'en'] as const
export type AppLanguage = (typeof supportedLanguages)[number]

export const LANGUAGE_STORAGE_KEY = 'money-space-language'
const FALLBACK_LANGUAGE: AppLanguage = 'vi'

export function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return supportedLanguages.includes(value as AppLanguage)
}

/**
 * Start i18next synchronously in the fallback language.
 *
 * Init cannot wait for storage: components render on the first tick and
 * `t()` must already work. The stored preference is applied by
 * `restoreLanguage()` immediately after, which re-renders through the normal
 * `languageChanged` path.
 *
 * @param deviceLanguage BCP-47 tag from the host — `navigator.language` on web,
 * `expo-localization` on native. Used only when nothing is stored yet.
 */
export function initI18n(deviceLanguage?: string | null) {
  if (i18n.isInitialized) return i18n

  const detected = deviceLanguage?.toLowerCase().startsWith('vi') ? 'vi' : 'en'

  void i18n.use(initReactI18next).init({
    resources,
    lng: deviceLanguage ? detected : FALLBACK_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
  })

  // Persist every later change. Fire-and-forget: a failed write must not break
  // a language switch that already happened in memory.
  i18n.on('languageChanged', (language) => {
    if (!isSupportedLanguage(language)) return
    void storage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => {})
  })

  return i18n
}

/**
 * Apply the stored language preference, if any. Safe to call before or after
 * the first render; a stored value that matches the active language is a no-op.
 */
export async function restoreLanguage(): Promise<void> {
  try {
    const stored = await storage.getItem(LANGUAGE_STORAGE_KEY)
    if (isSupportedLanguage(stored) && stored !== i18n.resolvedLanguage) {
      await i18n.changeLanguage(stored)
    }
  } catch {
    // No stored preference is a normal state, not an error.
  }
}

export default i18n
