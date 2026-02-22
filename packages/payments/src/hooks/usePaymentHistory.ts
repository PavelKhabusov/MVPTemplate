import { useState, useEffect } from 'react'
import type { PaymentRecord } from '../types'

interface HttpClient {
  get<T = any>(url: string, config?: any): Promise<{ data: T }>
}

export function createUsePaymentHistory(http: HttpClient) {
  return function usePaymentHistory(page = 1, limit = 20) {
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)

    useEffect(() => {
      setLoading(true)
      http
        .get('/payments/history', { params: { page, limit } })
        .then((res) => {
          const data = res.data as any
          setPayments(data.data ?? [])
          setTotal(data.pagination?.total ?? 0)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [page, limit])

    return { payments, loading, total }
  }
}
