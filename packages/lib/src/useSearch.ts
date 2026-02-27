import { useState, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import { storage } from './storage'

const RECENT_SEARCHES_KEY = 'recent-searches'
const MAX_RECENT = 10

export function useSearch(searchFn: (query: string) => Promise<any[]>) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const searchQuery = useQuery({
    queryKey: ['search', deferredQuery],
    queryFn: () => searchFn(deferredQuery),
    enabled: deferredQuery.length >= 2,
  })

  const addRecentSearch = (term: string) => {
    const existing = getRecentSearches()
    const updated = [term, ...existing.filter((s) => s !== term)].slice(0, MAX_RECENT)
    storage.set(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }

  return {
    query,
    setQuery,
    results: searchQuery.data ?? [],
    isLoading: searchQuery.isLoading && deferredQuery.length >= 2,
    addRecentSearch,
  }
}

export function getRecentSearches(): string[] {
  try {
    const raw = storage.getString(RECENT_SEARCHES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearRecentSearches() {
  storage.delete(RECENT_SEARCHES_KEY)
}
