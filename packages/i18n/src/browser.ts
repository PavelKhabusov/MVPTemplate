/**
 * Browser-compatible i18n initializer for Chrome extensions and web pages.
 * Uses navigator.language instead of expo-localization.
 *
 * Usage in extension main.tsx:
 *   import { initBrowserI18n, i18n } from '@mvp/i18n/src/browser'
 *   initBrowserI18n()  // init with browser language
 *   chrome.storage?.local?.get('lang').then(r => { if (r?.lang) i18n.changeLanguage(r.lang) })
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json' with { type: 'json' }
import ru from './locales/ru.json' with { type: 'json' }
import es from './locales/es.json' with { type: 'json' }
import ja from './locales/ja.json' with { type: 'json' }

export const SUPPORTED_LANGUAGES = ['en', 'ru', 'es', 'ja'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  ja: '日本語',
}

function getBrowserLanguage(): SupportedLanguage {
  const lang = (typeof navigator !== 'undefined' ? navigator.language : 'en').split('-')[0]
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage) ? (lang as SupportedLanguage) : 'en'
}

export function initBrowserI18n(savedLanguage?: string | null) {
  const lng =
    savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)
      ? (savedLanguage as SupportedLanguage)
      : getBrowserLanguage()

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      es: { translation: es },
      ja: { translation: ja },
    },
    lng,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
  })

  return i18n
}

export { i18n }
export { useTranslation } from 'react-i18next'