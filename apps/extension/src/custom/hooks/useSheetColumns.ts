import { useState, useEffect, useCallback } from 'react'
import { getSheetHeaders, autoDetectColumns, type ColumnMapping } from '../services/sheets'

interface UseSheetColumnsOptions {
  spreadsheetId: string | null
  sheetName?: string
}

export function useSheetColumns({ spreadsheetId, sheetName }: UseSheetColumnsOptions) {
  const [headers, setHeaders] = useState<string[]>([])
  const [columns, setColumns] = useState<Partial<ColumnMapping>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!spreadsheetId) { setLoading(false); return }
    setLoading(true)
    try {
      const hdrs = await getSheetHeaders(spreadsheetId, sheetName)
      setHeaders(hdrs)
      const stored = await chrome.storage.sync.get('columnMapping')
      const mappings = (stored.columnMapping || {}) as Record<string, Partial<ColumnMapping>>
      if (mappings[spreadsheetId]) {
        setColumns(mappings[spreadsheetId])
      } else {
        setColumns(autoDetectColumns(hdrs))
      }
    } catch {
      // User can configure manually
    } finally {
      setLoading(false)
    }
  }, [spreadsheetId, sheetName])

  useEffect(() => { load() }, [load])

  const updateColumn = useCallback(async (key: keyof ColumnMapping, value: string) => {
    if (!spreadsheetId) return
    const updated = { ...columns, [key]: value }
    setColumns(updated)
    const stored = await chrome.storage.sync.get('columnMapping')
    const mappings = (stored.columnMapping || {}) as Record<string, Partial<ColumnMapping>>
    mappings[spreadsheetId] = updated
    await chrome.storage.sync.set({ columnMapping: mappings })
  }, [spreadsheetId, columns])

  return { headers, columns, loading, updateColumn, reload: load }
}