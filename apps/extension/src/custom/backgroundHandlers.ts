// CallSheet custom background handlers
// Tab tracking is handled in background.ts via extensionConfig.tabTracking: true

// Google Sheets API helpers
async function getAuthToken(): Promise<string> {
  const result = await chrome.identity.getAuthToken({ interactive: true })
  if (!result.token) throw new Error('No auth token received')
  return result.token
}

async function sheetsGet(spreadsheetId: string, range: string): Promise<string[][]> {
  const token = await getAuthToken()
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`)
  const data = await res.json()
  return data.values || []
}

async function sheetsWrite(spreadsheetId: string, range: string, values: string[][]): Promise<void> {
  const token = await getAuthToken()
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
  const res = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values }) })
  if (!res.ok) throw new Error(`Sheets write error: ${res.status}`)
}

async function sheetsGetHeaders(spreadsheetId: string, sheetName?: string): Promise<string[]> {
  const range = sheetName ? `'${sheetName}'!1:1` : '1:1'
  const rows = await sheetsGet(spreadsheetId, range)
  return rows[0] || []
}

async function sheetsGetSheetList(spreadsheetId: string): Promise<string[]> {
  const token = await getAuthToken()
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`)
  const data = await res.json()
  return (data.sheets || []).map((s: { properties: { title: string } }) => s.properties.title)
}

function prefixRange(range: string, sheetName?: string): string {
  return sheetName ? `'${sheetName}'!${range}` : range
}

// Message handlers
const handlers: Record<string, (message: any, sender: any, sendResponse: (r: any) => void) => boolean | void> = {
  OPEN_SIDEBAR: (message, sender, sendResponse) => {
    if (sender.tab?.id) {
      chrome.storage.session.set({ selectedContact: message.payload })
      chrome.sidePanel?.open?.({ tabId: sender.tab.id })
    }
    sendResponse({ ok: true })
    return true
  },

  GET_SELECTED_CONTACT: (_message, _sender, sendResponse) => {
    chrome.storage.session.get('selectedContact').then((result) => {
      const contact = result.selectedContact || null
      if (contact) chrome.storage.session.remove('selectedContact')
      sendResponse(contact)
    })
    return true
  },

  GET_CURRENT_SHEET: (_message, _sender, sendResponse) => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        const match = tab.url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
        if (match) { sendResponse({ spreadsheetId: match[1] }); return }
      }
      sendResponse({ spreadsheetId: null })
    })
    return true
  },

  SHEETS_GET_SHEET_LIST: (message, _sender, sendResponse) => {
    sheetsGetSheetList(message.spreadsheetId).then((sheets) => sendResponse({ sheets })).catch((e) => sendResponse({ error: e.message }))
    return true
  },

  SHEETS_GET_HEADERS: (message, _sender, sendResponse) => {
    sheetsGetHeaders(message.spreadsheetId, message.sheetName).then((headers) => sendResponse({ headers })).catch((e) => sendResponse({ error: e.message }))
    return true
  },

  SHEETS_GET_CONTACTS: (message, _sender, sendResponse) => {
    const { spreadsheetId, nameColumn, phoneColumn, sheetName } = message
    const nameRange = prefixRange(`${nameColumn}2:${nameColumn}`, sheetName)
    const phoneRange = prefixRange(`${phoneColumn}2:${phoneColumn}`, sheetName)
    Promise.all([sheetsGet(spreadsheetId, nameRange), sheetsGet(spreadsheetId, phoneRange)]).then(([names, phones]) => {
      const contacts = []
      const maxLen = Math.max(names.length, phones.length)
      for (let i = 0; i < maxLen; i++) {
        const name = names[i]?.[0] || ''
        const phone = phones[i]?.[0] || ''
        if (phone.trim()) contacts.push({ id: i + 2, name: name.trim() || 'Без имени', phone: phone.trim(), row: i + 2 })
      }
      sendResponse({ contacts })
    }).catch((e) => sendResponse({ error: e.message }))
    return true
  },

  SHEETS_WRITE_RESULT: (message, _sender, sendResponse) => {
    const { spreadsheetId: sid, rowIndex, columns, data, sheetName: sn } = message
    const writes: Promise<void>[] = []
    if (columns.date && data.date) writes.push(sheetsWrite(sid, prefixRange(`${columns.date}${rowIndex}`, sn), [[data.date]]))
    if (columns.status && data.status) writes.push(sheetsWrite(sid, prefixRange(`${columns.status}${rowIndex}`, sn), [[data.status]]))
    if (columns.duration && data.duration) writes.push(sheetsWrite(sid, prefixRange(`${columns.duration}${rowIndex}`, sn), [[data.duration]]))
    if (columns.note && data.note) writes.push(sheetsWrite(sid, prefixRange(`${columns.note}${rowIndex}`, sn), [[data.note]]))
    if (columns.recording && data.recordingUrl) writes.push(sheetsWrite(sid, prefixRange(`${columns.recording}${rowIndex}`, sn), [[data.recordingUrl]]))
    Promise.all(writes).then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ error: e.message }))
    return true
  },
}

export default handlers