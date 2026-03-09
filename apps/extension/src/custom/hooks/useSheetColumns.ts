import { useState, useEffect, useCallback, useRef } from 'react'
import { getSheetHeaders, autoDetectColumns, type ColumnMapping } from '../services/sheets'
import { matchSheetTemplate, createSheetTemplate, updateSheetTemplate } from '../services/api'

interface UseSheetColumnsOptions {
  spreadsheetId: string | null
  sheetName?: string
}

export function useSheetColumns({ spreadsheetId, sheetName }: UseSheetColumnsOptions) {
  const [headers, setHeaders] = useState<string[]>([])
  const [columns, setColumns] = useState<Partial<ColumnMapping>>({})
  const [loading, setLoading] = useState(true)
  const templateIdRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!spreadsheetId) { setLoading(false); return }
    setLoading(true)
    try {
      const hdrs = await getSheetHeaders(spreadsheetId, sheetName)
      setHeaders(hdrs)

      // Try backend template first
      if (sheetName) {
        try {
          const template = await matchSheetTemplate(spreadsheetId, sheetName)
          if (template?.columnMappings && Object.keys(template.columnMappings).length > 0) {
            templateIdRef.current = template.id
            setColumns(template.columnMappings as Partial<ColumnMapping>)
            setLoading(false)
            return
          }
        } catch { /* backend may not be running */ }
      }

      // Fall back to chrome.storage.sync
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

  useEffect(() => {
    templateIdRef.current = null
    load()
  }, [load])

  const updateColumn = useCallback(async (key: keyof ColumnMapping, value: string) => {
    if (!spreadsheetId) return
    const updated = { ...columns, [key]: value }
    setColumns(updated)

    // Save to chrome.storage.sync (local fallback)
    const stored = await chrome.storage.sync.get('columnMapping')
    const mappings = (stored.columnMapping || {}) as Record<string, Partial<ColumnMapping>>
    mappings[spreadsheetId] = updated
    await chrome.storage.sync.set({ columnMapping: mappings })

    // Sync to backend
    if (sheetName) {
      try {
        if (templateIdRef.current) {
          await updateSheetTemplate(templateIdRef.current, { columnMappings: updated as Record<string, string | undefined> })
        } else {
          const created = await createSheetTemplate({
            name: sheetName,
            spreadsheetId,
            sheetName,
            columnMappings: updated as Record<string, string | undefined>,
          })
          templateIdRef.current = created.id
        }
      } catch { /* backend may not be running */ }
    }
  }, [spreadsheetId, sheetName, columns])

  return { headers, columns, loading, updateColumn, reload: load }
}
