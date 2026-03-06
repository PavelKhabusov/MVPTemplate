import { useState, useEffect } from 'react'
import { getSubscription } from '../services/api'
import type { Subscription } from '../types'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getSubscription()
      .then((data) => {
        if (mounted) setSubscription(data)
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await getSubscription()
      setSubscription(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return { subscription, loading, refresh }
}
