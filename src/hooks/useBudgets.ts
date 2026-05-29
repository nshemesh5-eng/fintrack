import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Budget } from '../types'
import { format } from 'date-fns'

export function useBudgets(userId: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const currentMonth = format(new Date(), 'yyyy-MM')

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
    setBudgets(data || [])
    setLoading(false)
  }, [userId, currentMonth])

  useEffect(() => { fetch() }, [fetch])

  const upsert = async (category: string, monthly_limit: number) => {
    if (!userId) return
    const existing = budgets.find(b => b.category === category)
    if (existing) {
      const { data, error } = await supabase
        .from('budgets')
        .update({ monthly_limit })
        .eq('id', existing.id)
        .select().single()
      if (!error && data) setBudgets(prev => prev.map(b => b.id === existing.id ? data : b))
    } else {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ user_id: userId, category, monthly_limit, month: currentMonth })
        .select().single()
      if (!error && data) setBudgets(prev => [...prev, data])
    }
  }

  return { budgets, loading, upsert, refresh: fetch }
}
