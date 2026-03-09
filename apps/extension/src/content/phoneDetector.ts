export interface DetectedPhone {
  phone: string
  element: HTMLElement
  row: number
  col: number
}

const PHONE_REGEX = /(?:\+7|8)[\s\-]*\(?[\d]{3}\)?[\s\-]*[\d]{3}[\s\-]*[\d]{2}[\s\-]*[\d]{2}/g
const INTERNATIONAL_REGEX = /\+\d{1,3}[\s\-]*\(?\d{2,4}\)?[\s\-]*\d{3,4}[\s\-]*\d{2,4}/g

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-\(\)]/g, '')
}

function isPhoneNumber(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  PHONE_REGEX.lastIndex = 0
  INTERNATIONAL_REGEX.lastIndex = 0
  const ruMatch = trimmed.match(PHONE_REGEX)
  if (ruMatch) return ruMatch[0]
  const intlMatch = trimmed.match(INTERNATIONAL_REGEX)
  if (intlMatch) return intlMatch[0]
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 10 && digits.length <= 12 && /^[78]/.test(digits)) return trimmed
  return null
}

export function detectPhones(): DetectedPhone[] {
  const results: DetectedPhone[] = []
  const seen = new Set<string>()

  const cells = document.querySelectorAll<HTMLElement>('table.waffle td')
  cells.forEach((cell) => {
    const text = cell.textContent || ''
    const phone = isPhoneNumber(text)
    if (!phone) return
    const key = `${cell.offsetTop}-${cell.offsetLeft}-${normalizePhone(phone)}`
    if (seen.has(key)) return
    seen.add(key)
    const tr = cell.closest('tr')
    const row = tr ? (tr as HTMLTableRowElement).rowIndex : 0
    const col = (cell as HTMLTableCellElement).cellIndex
    results.push({ phone, element: cell, row, col })
  })

  if (results.length === 0) {
    const gridCells = document.querySelectorAll<HTMLElement>('[role="gridcell"]')
    gridCells.forEach((cell) => {
      const text = cell.textContent || ''
      const phone = isPhoneNumber(text)
      if (!phone) return
      const key = `grid-${cell.getAttribute('data-row')}-${cell.getAttribute('data-col')}-${normalizePhone(phone)}`
      if (seen.has(key)) return
      seen.add(key)
      const row = parseInt(cell.getAttribute('data-row') || '0', 10)
      const col = parseInt(cell.getAttribute('data-col') || '0', 10)
      results.push({ phone, element: cell, row, col })
    })
  }

  return results
}

export function findContactName(cell: HTMLElement): string | null {
  const tr = cell.closest('tr')
  if (!tr) return null
  const cells = tr.querySelectorAll('td')
  const phoneIndex = Array.from(cells).indexOf(cell as HTMLTableCellElement)
  for (let i = phoneIndex - 1; i >= 0; i--) {
    const text = (cells[i].textContent || '').trim()
    if (text && !isPhoneNumber(text) && text.length > 1 && /[а-яА-Яa-zA-Z]/.test(text)) return text
  }
  return null
}

export function getSpreadsheetId(): string | null {
  const match = window.location.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}