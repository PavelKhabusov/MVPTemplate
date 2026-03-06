export interface SheetContact {
  id: number
  name: string
  phone: string
  row: number
}

export interface ColumnMapping {
  name: string
  phone: string
  status: string
  date: string
  duration: string
  note: string
  recording: string
}

function sendMessage<T>(message: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
      else resolve(response)
    })
  })
}

export async function getSheetList(spreadsheetId: string): Promise<string[]> {
  const result = await sendMessage<{ sheets: string[]; error?: string }>({ type: 'SHEETS_GET_SHEET_LIST', spreadsheetId })
  if (result.error) throw new Error(result.error)
  return result.sheets
}

export async function getSheetHeaders(spreadsheetId: string, sheetName?: string): Promise<string[]> {
  const result = await sendMessage<{ headers: string[]; error?: string }>({ type: 'SHEETS_GET_HEADERS', spreadsheetId, sheetName })
  if (result.error) throw new Error(result.error)
  return result.headers
}

export async function getContacts(spreadsheetId: string, nameColumn: string, phoneColumn: string, sheetName?: string): Promise<SheetContact[]> {
  const result = await sendMessage<{ contacts: SheetContact[]; error?: string }>({ type: 'SHEETS_GET_CONTACTS', spreadsheetId, nameColumn, phoneColumn, sheetName })
  if (result.error) throw new Error(result.error)
  return result.contacts
}

export async function writeCallResult(
  spreadsheetId: string,
  rowIndex: number,
  columns: Partial<ColumnMapping>,
  data: { date?: string; status?: string; duration?: string; note?: string; recordingUrl?: string },
  sheetName?: string,
): Promise<void> {
  const result = await sendMessage<{ ok?: boolean; error?: string }>({ type: 'SHEETS_WRITE_RESULT', spreadsheetId, rowIndex, columns, data, sheetName })
  if (result.error) throw new Error(result.error)
}

export function columnIndexToLetter(index: number): string {
  let letter = ''
  let n = index
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

export function autoDetectColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {}
  const patterns: Record<keyof ColumnMapping, RegExp> = {
    name: /^(имя|name|фио|контакт|клиент)/i,
    phone: /^(телефон|phone|номер|тел)/i,
    status: /^(статус|status|результат|result)/i,
    date: /^(дата|date|время|time)/i,
    duration: /^(длительность|duration|продолж)/i,
    note: /^(заметк|note|коммент|comment)/i,
    recording: /^(запись|record|аудио|audio)/i,
  }
  headers.forEach((header, index) => {
    const col = columnIndexToLetter(index)
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(header.trim()) && !mapping[key as keyof ColumnMapping]) {
        mapping[key as keyof ColumnMapping] = col
      }
    }
  })
  return mapping
}