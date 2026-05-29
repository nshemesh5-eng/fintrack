import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { RecurringTransaction } from '../types'
import { format } from 'date-fns'

export function useRecurring(userId: string | undefined) {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setRecurring(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const add = async (item: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({ ...item, user_id: userId })
      .select().single()
    if (!error && data) setRecurring(prev => [data, ...prev])
    return { error }
  }

  const update = async (id: string, changes: Partial<RecurringTransaction>) => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(changes)
      .eq('id', id)
      .select().single()
    if (!error && data) setRecurring(prev => prev.map(r => r.id === id ? data : r))
    return { error }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
    if (!error) setRecurring(prev => prev.filter(r => r.id !== id))
  }

  // Apply recurring transactions for current month if not already done
  const applyCurrentMonth = useCallback(async (addTransaction: Function) => {
    if (!userId || recurring.length === 0) return

    const now = new Date()
    const currentMonth = format(now, 'yyyy-MM')
    const today = now.getDate()

    for (const rec of recurring) {
      if (!rec.active) continue
      if (rec.day_of_month > today) continue // Not yet this month

      // Check if already applied this month
      const dateStr = `${currentMonth}-${String(rec.day_of_month).padStart(2, '0')}`
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('description', rec.description)
        .eq('date', dateStr)
        .eq('amount', rec.amount)
        .limit(1)

      if (!existing || existing.length === 0) {
        await addTransaction({
          type: rec.type,
          amount: rec.amount,
          description: rec.description,
          category: rec.category,
          date: dateStr
        })
      }
    }
  }, [userId, recurring])

  return { recurring, loading, add, update, remove, applyCurrentMonth, refresh: fetch }
}
