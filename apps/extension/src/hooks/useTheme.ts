import { useState, useEffect } from 'react'
import type { ThemeMode } from '../types'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system')

  useEffect(() => {
    chrome.storage?.local?.get('theme').then((result) => {
      if (result?.theme) setThemeState(result.theme as ThemeMode)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      root.removeAttribute('data-theme')
    } else {
      // System preference
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = () => {
        if (mq.matches) root.setAttribute('data-theme', 'dark')
        else root.removeAttribute('data-theme')
      }
      apply()
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode)
    chrome.storage?.local?.set({ theme: mode }).catch(() => {})
  }

  return { theme, setTheme }
}
