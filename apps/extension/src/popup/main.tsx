import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../styles/globals.css'
import { initBrowserI18n, i18n } from '@mvp/i18n/src/browser'
import { FONT_FAMILY_CONFIG } from '@mvp/template-config/src/designTokens'
import { APP_BRAND } from '@mvp/template-config/src/brand'

// Apply brand font from template-config
const _fc = FONT_FAMILY_CONFIG[APP_BRAND.defaultFontFamily as keyof typeof FONT_FAMILY_CONFIG]
document.documentElement.style.setProperty('--ext-font-family', _fc.cssStack)
if (_fc.googleUrl) {
  const _l = document.createElement('link')
  _l.rel = 'stylesheet'
  _l.href = _fc.googleUrl
  document.head.appendChild(_l)
}

// Initialize i18n with browser language; update to stored preference after load
initBrowserI18n()
chrome.storage?.local?.get('lang').then((r) => {
  if (r?.lang) i18n.changeLanguage(r.lang)
}).catch(() => {})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
