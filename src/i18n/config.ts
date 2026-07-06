import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resources } from '@/i18n/resources'

export const supportedLanguages = ['vi', 'en'] as const
export type AppLanguage = (typeof supportedLanguages)[number]

const LANGUAGE_STORAGE_KEY = 'money-space-language'
const FALLBACK_LANGUAGE: AppLanguage = 'vi'

function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return supportedLanguages.includes(value as AppLanguage)
}

function detectLanguage(): AppLanguage {
  if (typeof window === 'undefined') return FALLBACK_LANGUAGE

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isSupportedLanguage(stored)) return stored

  const browserLanguage = window.navigator.language.toLowerCase()
  return browserLanguage.startsWith('vi') ? 'vi' : 'en'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.resolvedLanguage ?? FALLBACK_LANGUAGE
}

i18n.on('languageChanged', (language) => {
  if (!isSupportedLanguage(language)) return

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
})

export default i18n
