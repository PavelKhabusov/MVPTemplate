import { useState, useEffect, useCallback } from 'react'
import { getContacts, type SheetContact } from '../services/sheets'

interface UseContactsOptions {
  spreadsheetId: string | null
  nameColumn: string
  phoneColumn: string
  sheetName?: string
}

export function useContacts({ spreadsheetId, nameColumn, phoneColumn, sheetName }: UseContactsOptions) {
  const [contacts, setContacts] = useState<SheetContact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!spreadsheetId) return
    setLoading(true)
    setError(null)
    try {
      const result = await getContacts(spreadsheetId, nameColumn, phoneColumn, sheetName)
      setContacts(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [spreadsheetId, nameColumn, phoneColumn, sheetName])

  useEffect(() => { load() }, [load])

  return { contacts, loading, error, reload: load }
}