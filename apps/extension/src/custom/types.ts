export interface Contact {
  id: number
  name: string
  phone: string
  company: string
  lastCall: string
  status: 'answered' | 'missed'
}

export interface CallHistoryEntry {
  id: number
  name: string
  phone: string
  duration: string
  date: string
  status: 'answered' | 'missed'
  note: string
}

export type CallState = 'idle' | 'calling' | 'active' | 'ended'
export type CallMode = 'browser' | 'phone'

export interface SelectedContact {
  phone: string
  contactName: string
  sheetId: string
  rowIndex: number
}