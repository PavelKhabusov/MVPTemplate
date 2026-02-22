import { useState, useEffect } from 'react'
import type { Plan } from '../types'

interface HttpClient {
  get<T = any>(url: string): Promise<{ data: T }>
}

export function createUsePaymentPlans(http: HttpClient) {
  return function usePaymentPlans() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      http
        .get('/payments/plans')
        .then((res) => setPlans((res.data as any).data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])

    return { plans, loading }
  }
}
