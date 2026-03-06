import type { DetectedPhone } from './phoneDetector'
import { findContactName, getSpreadsheetId } from './phoneDetector'

const PHONE_ATTR = 'data-callsheet-phone'
const ROW_ATTR = 'data-callsheet-row'

let popover: HTMLDivElement | null = null
let currentCell: HTMLElement | null = null
let hideTimeout: ReturnType<typeof setTimeout> | null = null

const PHONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`

function ensurePopover(): HTMLDivElement {
  if (popover && document.body.contains(popover)) return popover
  const el = document.createElement('div')
  el.className = 'callsheet-popover'
  el.innerHTML = `<div class="callsheet-popover-info"><div class="callsheet-popover-name"></div><div class="callsheet-popover-phone"></div></div><button class="callsheet-popover-btn">${PHONE_SVG} Позвонить</button>`
  el.addEventListener('mouseenter', () => { if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null } })
  el.addEventListener('mouseleave', () => scheduleHide())
  const btn = el.querySelector('.callsheet-popover-btn') as HTMLButtonElement
  btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); handleCallClick() })
  btn.addEventListener('mousedown', (e) => e.stopPropagation())
  document.body.appendChild(el)
  popover = el
  return el
}

function handleCallClick() {
  if (!currentCell) return
  const phone = currentCell.getAttribute(PHONE_ATTR)
  if (!phone) return
  const contactName = findContactName(currentCell)
  const spreadsheetId = getSpreadsheetId()
  const row = parseInt(currentCell.getAttribute(ROW_ATTR) || '0', 10)
  chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR', payload: { phone, contactName: contactName || '', sheetId: spreadsheetId || '', rowIndex: row } })
  hidePopoverNow()
}

function showPopover(cell: HTMLElement) {
  if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null }
  const pop = ensurePopover()
  currentCell = cell
  const phone = cell.getAttribute(PHONE_ATTR) || ''
  const name = findContactName(cell) || ''
  ;(pop.querySelector('.callsheet-popover-name') as HTMLElement).textContent = name || 'Контакт'
  ;(pop.querySelector('.callsheet-popover-phone') as HTMLElement).textContent = phone
  const rect = cell.getBoundingClientRect()
  let left = rect.left
  if (left + 200 > window.innerWidth) left = window.innerWidth - 208
  pop.style.top = `${rect.bottom + 4}px`
  pop.style.left = `${left}px`
  pop.classList.add('callsheet-popover-visible')
}

function scheduleHide() {
  if (hideTimeout) clearTimeout(hideTimeout)
  hideTimeout = setTimeout(hidePopoverNow, 200)
}

function hidePopoverNow() {
  popover?.classList.remove('callsheet-popover-visible')
  currentCell = null
  hideTimeout = null
}

export function markPhoneCells(phones: DetectedPhone[]) {
  document.querySelectorAll(`[${PHONE_ATTR}]`).forEach((el) => {
    el.removeAttribute(PHONE_ATTR)
    el.removeAttribute(ROW_ATTR)
    el.classList.remove('callsheet-phone-cell')
  })
  for (const detected of phones) {
    detected.element.setAttribute(PHONE_ATTR, detected.phone)
    detected.element.setAttribute(ROW_ATTR, String(detected.row))
    detected.element.classList.add('callsheet-phone-cell')
  }
}

export function setupHoverListeners() {
  document.addEventListener('mouseover', (e) => {
    const phoneCell = (e.target as HTMLElement).closest?.(`[${PHONE_ATTR}]`) as HTMLElement | null
    if (phoneCell) showPopover(phoneCell)
  }, true)
  document.addEventListener('mouseout', (e) => {
    const phoneCell = (e.target as HTMLElement).closest?.(`[${PHONE_ATTR}]`) as HTMLElement | null
    if (phoneCell) scheduleHide()
  }, true)
}