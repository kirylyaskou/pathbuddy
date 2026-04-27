import { useEffect, useState } from 'react'
import { searchAllEntities } from '@/shared/api/global-search'
import type { GlobalSearchResult } from '@/shared/api/global-search'

export function useGlobalSearch(query: string): { results: GlobalSearchResult[]; loading: boolean } {
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const data = await searchAllEntities(query)
        if (!cancelled) {
          setResults(data)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return { results, loading }
}
