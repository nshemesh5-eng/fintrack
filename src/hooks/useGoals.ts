import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Goal } from '../types'

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase.from('goals').select('*').eq('user_id', userId)
    setGoals(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const add = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('goals').insert({ ...goal, user_id: userId }).select().single()
    if (!error && data) setGoals(prev => [...prev, data])
    return { error }
  }

  const update = async (id: string, current_amount: number) => {
    const { data, error } = await supabase
      .from('goals').update({ current_amount }).eq('id', id).select().single()
    if (!error && data) setGoals(prev => prev.map(g => g.id === id ? data : g))
    return { error }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (!error) setGoals(prev => prev.filter(g => g.id !== id))
  }

  return { goals, loading, add, update, remove, refresh: fetch }
}
