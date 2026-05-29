import { useState } from 'react'
import { Goal } from '../types'
import { format } from 'date-fns'
import './GoalsPanel.css'

interface Props {
  goals: Goal[]
  onAdd: (g: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: any } | undefined>
  onUpdate: (id: string, amount: number) => Promise<{ error: any } | undefined>
  onRemove: (id: string) => Promise<void>
}

export default function GoalsPanel({ goals, onAdd, onUpdate, onRemove }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [updateGoalId, setUpdateGoalId] = useState<string | null>(null)
  const [updateAmount, setUpdateAmount] = useState('')

  const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onAdd({ name, target_amount: parseFloat(target), current_amount: 0, deadline })
    setSaving(false)
    setShowForm(false)
    setName(''); setTarget(''); setDeadline('')
  }

  const handleUpdate = async (id: string) => {
    const val = parseFloat(updateAmount)
    if (!val) return
    await onUpdate(id, val)
    setUpdateGoalId(null)
    setUpdateAmount('')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>יעדים פיננסיים</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ יעד חדש</button>
      </div>

      {goals.length === 0 && !showForm && (
        <div className="goals-empty card">
          <p>🎯</p>
          <p>עדיין אין יעדים. הוסף יעד כדי לעקוב אחרי ההתקדמות שלך.</p>
          <button className="btn-ghost" onClick={() => setShowForm(true)}>הוסף יעד ראשון</button>
        </div>
      )}

      {showForm && (
        <div className="goal-form card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>יעד חדש</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>שם היעד</label>
              <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="למשל: קרן חירום, נסיעה לאירופה" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>סכום יעד (₪)</label>
                <input className="form-input" type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0" required />
              </div>
              <div className="field">
                <label>תאריך יעד</label>
                <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>ביטול</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? '...' : 'שמור'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="goals-grid">
        {goals.map(goal => {
          const pct = Math.min(goal.current_amount / goal.target_amount * 100, 100)
          const done = goal.current_amount >= goal.target_amount
          const isUpdating = updateGoalId === goal.id
          return (
            <div key={goal.id} className={`goal-card card ${done ? 'done' : ''}`}>
              <div className="goal-header">
                <div className="goal-name">{goal.name}</div>
                <button className="goal-del" onClick={() => onRemove(goal.id)}>✕</button>
              </div>
              <div className="goal-amounts">
                <span className="goal-current">{fmt(goal.current_amount)}</span>
                <span className="goal-sep"> / </span>
                <span className="goal-target">{fmt(goal.target_amount)}</span>
              </div>
              <div className="goal-bar-bg">
                <div className={`goal-bar-fill ${done ? 'done' : ''}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="goal-footer">
                <span className="goal-pct">{Math.round(pct)}% הושג</span>
                <span className="goal-deadline">יעד: {format(new Date(goal.deadline), 'dd/MM/yyyy')}</span>
              </div>
              {done ? (
                <div className="goal-badge">🎉 יעד הושג!</div>
              ) : isUpdating ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input
                    className="form-input"
                    type="number"
                    value={updateAmount}
                    onChange={e => setUpdateAmount(e.target.value)}
                    placeholder="סכום נוכחי"
                    style={{ flex: 1, height: 34 }}
                    autoFocus
                  />
                  <button className="btn-primary" style={{ height: 34, padding: '0 10px', fontSize: 12 }} onClick={() => handleUpdate(goal.id)}>עדכן</button>
                  <button className="btn-ghost" style={{ height: 34 }} onClick={() => setUpdateGoalId(null)}>ביטול</button>
                </div>
              ) : (
                <button className="btn-ghost" style={{ marginTop: 10, width: '100%' }}
                  onClick={() => { setUpdateGoalId(goal.id); setUpdateAmount(goal.current_amount.toString()) }}>
                  עדכן התקדמות
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
