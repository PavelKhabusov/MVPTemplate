import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'
import en from './locales/en.json'
import ru from './locales/ru.json'

const SUPPORTED_LANGUAGES = ['en', 'ru'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

function getDeviceLanguage(): SupportedLanguage {
  const locales = getLocales()
  const deviceLang = locales[0]?.languageCode ?? 'en'
  if (SUPPORTED_LANGUAGES.includes(deviceLang as SupportedLanguage)) {
    return deviceLang as SupportedLanguage
  }
  return 'en'
}

export function initI18n(savedLanguage?: string | null) {
  const lng =
    savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)
      ? savedLanguage
      : getDeviceLanguage()

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  })

  return i18n
}

export { i18n, SUPPORTED_LANGUAGES }
export { useTranslation } from 'react-i18next'
