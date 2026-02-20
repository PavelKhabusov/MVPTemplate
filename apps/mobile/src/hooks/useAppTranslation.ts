import { useCallback } from 'react'
import { useTranslation, i18n } from '@mvp/i18n'
import { useLanguageStore } from '@mvp/store'
import type { SupportedLanguage } from '@mvp/i18n'

export function useAppTranslation() {
  const { t, i18n: i18nInstance } = useTranslation()
  const { language, setLanguage } = useLanguageStore()

  const changeLanguage = useCallback(
    async (lang: SupportedLanguage | null) => {
      setLanguage(lang)
      if (lang) {
        await i18nInstance.changeLanguage(lang)
      }
    },
    [i18nInstance, setLanguage]
  )

  return {
    t,
    i18n: i18nInstance,
    currentLanguage: i18nInstance.language as SupportedLanguage,
    changeLanguage,
  }
}
