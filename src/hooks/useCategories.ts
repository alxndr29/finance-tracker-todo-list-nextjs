'use client'

import { useState, useEffect, useCallback } from 'react'
import { CategoryItem } from '@/lib/utils'

// Module-level cache so categories are fetched once per session
let _cache: CategoryItem[] | null = null
let _listeners: Array<() => void> = []

function notifyListeners() {
  _listeners.forEach((fn) => fn())
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(_cache || [])
  const [loading, setLoading] = useState(!_cache)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = document.cookie.match(/token=([^;]*)/)?.[1] || ''
      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      _cache = data.categories || []
      setCategories(_cache!)
      notifyListeners()
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (_cache) {
      setCategories(_cache)
      setLoading(false)
      return
    }
    load()
  }, [load])

  // Re-render when other components call refresh()
  useEffect(() => {
    const handler = () => setCategories([..._cache!])
    _listeners.push(handler)
    return () => {
      _listeners = _listeners.filter((fn) => fn !== handler)
    }
  }, [])

  const refresh = useCallback(() => {
    _cache = null
    load()
  }, [load])

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')
  const incomeCategories = categories.filter((c) => c.type === 'INCOME')

  return { categories, expenseCategories, incomeCategories, loading, refresh }
}
