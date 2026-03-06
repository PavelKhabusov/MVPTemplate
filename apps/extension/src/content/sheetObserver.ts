import { detectPhones } from './phoneDetector'
import { markPhoneCells } from './domInjector'

let observer: MutationObserver | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 500

function rescan() {
  const phones = detectPhones()
  markPhoneCells(phones)
}

function onMutation() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(rescan, DEBOUNCE_MS)
}

export function startObserving() {
  if (observer) return
  const grid = document.querySelector('.grid-container') || document.querySelector('#sheets-viewport') || document.querySelector('.waffle') || document.querySelector('[role="grid"]')
  if (!grid) { setTimeout(startObserving, 1000); return }
  observer = new MutationObserver(onMutation)
  observer.observe(grid, { childList: true, subtree: true, characterData: true })
  const scroller = document.querySelector('.native-scrollbar') || document.querySelector('#sheets-viewport') || grid
  let scrollDebounce: ReturnType<typeof setTimeout> | null = null
  scroller.addEventListener('scroll', () => {
    if (scrollDebounce) clearTimeout(scrollDebounce)
    scrollDebounce = setTimeout(rescan, 300)
  }, { passive: true })
}

export function stopObserving() {
  if (observer) { observer.disconnect(); observer = null }
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
}