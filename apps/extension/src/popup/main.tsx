import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../styles/globals.css'
import { initBrowserI18n, i18n } from '@mvp/i18n/src/browser'

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
