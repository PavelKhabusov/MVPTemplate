import { useState, useEffect, useCallback } from 'react'
import type { Subscription } from '../types'

interface HttpClient {
  get<T = any>(url: string): Promise<{ data: T }>
  post<T = any>(url: string, data?: any): Promise<{ data: T }>
}

export function createUseSubscription(http: HttpClient) {
  return function useSubscription() {
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [loading, setLoading] = useState(true)

    const refetch = useCallback(async () => {
      try {
        setLoading(true)
        const res = await http.get('/payments/subscription')
        setSubscription((res.data as any).data ?? null)
      } catch {
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }, [])

    useEffect(() => {
      refetch()
    }, [refetch])

    const cancel = useCallback(async () => {
      await http.post('/payments/cancel')
      await refetch()
    }, [refetch])

    return { subscription, loading, refetch, cancel }
  }
}
