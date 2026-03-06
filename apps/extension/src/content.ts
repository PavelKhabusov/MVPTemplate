import { detectPhones } from './content/phoneDetector'
import { markPhoneCells, setupHoverListeners } from './content/domInjector'
import { startObserving } from './content/sheetObserver'
import './content/styles.css'

function init() {
  console.log('[CallSheet] Content script loaded on Google Sheets')
  setupHoverListeners()
  const phones = detectPhones()
  markPhoneCells(phones)
  console.log(`[CallSheet] Found ${phones.length} phone numbers`)
  startObserving()
}

if (document.readyState === 'complete') {
  setTimeout(init, 2000)
} else {
  window.addEventListener('load', () => setTimeout(init, 2000))
}