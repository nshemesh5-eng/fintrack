import { useState, useCallback } from 'react'
import { CategoryItem, DEFAULT_CATEGORIES } from '../types'

const STORAGE_KEY = 'suntrack_categories'

function loadCustomCategories(): CategoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveCustomCategories(cats: CategoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

export function useCategories() {
  const [custom, setCustom] = useState<CategoryItem[]>(loadCustomCategories)

  const all = [...DEFAULT_CATEGORIES, ...custom]

  const add = useCallback((cat: Omit<CategoryItem, 'id' | 'custom'>) => {
    const newCat: CategoryItem = {
      ...cat,
      id: 'custom_' + Date.now(),
      custom: true
    }
    setCustom(prev => {
      const updated = [...prev, newCat]
      saveCustomCategories(updated)
      return updated
    })
    return newCat
  }, [])

  const update = useCallback((id: string, changes: Partial<CategoryItem>) => {
    setCustom(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...changes } : c)
      saveCustomCategories(updated)
      return updated
    })
  }, [])

  const remove = useCallback((id: string) => {
    setCustom(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveCustomCategories(updated)
      return updated
    })
  }, [])

  const getById = useCallback((id: string) => {
    return all.find(c => c.id === id)
  }, [all])

  return { all, custom, add, update, remove, getById }
}
