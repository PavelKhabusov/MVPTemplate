import { useState, useEffect, useCallback } from 'react'
import { getCallHistory } from '../services/api'

export interface HistoryCall {
  id: string
  contactName: string | null
  contactPhone: string
  status: string
  duration: number | null
  recordingUrl: string | null
  note: string | null
  startedAt: string
}

export function useHistory(sheetId: string | null) {
  const [calls, setCalls] = useState<HistoryCall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCallHistory({ sheetId: sheetId ?? undefined, page: p, limit: 20 })
      setCalls(result.data)
      setPage(result.pagination.page)
      setTotalPages(result.pagination.totalPages)
      setTotal(result.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      setCalls([])
    } finally {
      setLoading(false)
    }
  }, [sheetId])

  useEffect(() => { fetchHistory(1) }, [fetchHistory])

  const nextPage = useCallback(() => { if (page < totalPages) fetchHistory(page + 1) }, [page, totalPages, fetchHistory])
  const prevPage = useCallback(() => { if (page > 1) fetchHistory(page - 1) }, [page, fetchHistory])
  const refresh = useCallback(() => { fetchHistory(page) }, [page, fetchHistory])

  return { calls, loading, error, page, totalPages, total, nextPage, prevPage, refresh }
}