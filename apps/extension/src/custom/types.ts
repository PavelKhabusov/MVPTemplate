export interface Contact {
  id: number
  name: string
  phone: string
  company: string
  lastCall: string
  status: 'answered' | 'missed'
}

export interface SelectedContact {
  phone: string
  contactName: string
  sheetId: string
  rowIndex: number
}
