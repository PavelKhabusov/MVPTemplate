import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@mvp/store'
import type { SupportedLanguage } from './index'

export function useAppTranslation() {
  const { t, i18n: i18nInstance } = useTranslation()
  const { setLanguage } = useLanguageStore()

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
