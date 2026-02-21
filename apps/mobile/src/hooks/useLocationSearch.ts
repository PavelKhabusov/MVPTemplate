import { useState, useEffect, useRef } from 'react'

export interface LocationResult {
  name: string
  city?: string
  state?: string
  country?: string
  displayName: string
}

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<LocationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api?q=${encodeURIComponent(query)}&limit=5&lang=en`,
        )
        const data = await res.json()

        const mapped: LocationResult[] = (data.features ?? []).map(
          (f: any) => {
            const p = f.properties ?? {}
            const parts = [p.name, p.city, p.state, p.country].filter(Boolean)
            // deduplicate consecutive parts
            const unique = parts.filter((v: string, i: number) => i === 0 || v !== parts[i - 1])
            return {
              name: p.name ?? '',
              city: p.city,
              state: p.state,
              country: p.country,
              displayName: unique.join(', '),
            }
          },
        )

        setResults(mapped)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 400)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  return { results, isLoading }
}
