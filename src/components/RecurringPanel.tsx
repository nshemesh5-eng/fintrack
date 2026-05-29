import { useState } from 'react'
import { RecurringTransaction, CategoryItem, getCategoryLabel, getCategoryColor } from '../types'
import './RecurringPanel.css'

interface Props {
  recurring: RecurringTransaction[]
  categories: CategoryItem[]
  onAdd: (r: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at'>) => Promise<any>
  onUpdate: (id: string, changes: Partial<RecurringTransaction>) => Promise<any>
  onRemove: (id: string) => Promise<void>
}

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

export default function RecurringPanel({ recurring, categories, onAdd, onUpdate, onRemove }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('food')
  const [day, setDay] = useState(1)
  const [saving, setSaving] = useState(false)

  const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL')

  const expenseCats = categories.filter(c => c.type === 'expense' || c.type === 'both')
  const incomeCats = categories.filter(c => c.type === 'income' || c.type === 'both')
  const cats = type === 'income' ? incomeCats : expenseCats

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setSaving(true)
    await onAdd({ type, amount: parseFloat(amount), description, category, day_of_month: day, active: true })
    setSaving(false)
    setShowForm(false)
    setAmount(''); setDescription('')
  }

  const totalMonthly = recurring.filter(r => r.active && r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const totalIncome = recurring.filter(r => r.active && r.type === 'income').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="recurring-wrap">
      <div className="recurring-header">
        <div>
          <h2>הוראות קבע</h2>
          <p className="recurring-subtitle">תשלומים ותקבולים חוזרים — נכנסים אוטומטית כל חודש</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ הוסף הוראת קבע</button>
      </div>

      <div className="recurring-summary">
        <div className="recurring-stat">
          <span className="recurring-stat-label">הוצאות חוזרות / חודש</span>
          <span className="recurring-stat-value red">{fmt(totalMonthly)}</span>
        </div>
        <div className="recurring-stat">
          <span className="recurring-stat-label">הכנסות חוזרות / חודש</span>
          <span className="recurring-stat-value green">{fmt(totalIncome)}</span>
        </div>
        <div className="recurring-stat">
          <span className="recurring-stat-label">מאזן חוזר / חודש</span>
          <span className={`recurring-stat-value ${totalIncome - totalMonthly >= 0 ? 'green' : 'red'}`}>
            {fmt(totalIncome - totalMonthly)}
          </span>
        </div>
      </div>

      {showForm && (
        <div className="recurring-form card">
          <h3>הוראת קבע חדשה</h3>
          <form onSubmit={handleAdd}>
            <div className="recurring-type-toggle">
              <button type="button" className={type === 'expense' ? 'active-exp' : ''} onClick={() => { setType('expense'); setCategory('food') }}>הוצאה</button>
              <button type="button" className={type === 'income' ? 'active-inc' : ''} onClick={() => { setType('income'); setCategory('salary') }}>הכנסה</button>
            </div>
            <div className="recurring-form-grid">
              <div className="field">
                <label>תיאור</label>
                <input className="form-input" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="למשל: שכר דירה, נטפליקס, משכורת" required />
              </div>
              <div className="field">
                <label>סכום ₪</label>
                <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required />
              </div>
              <div className="field">
                <label>קטגוריה</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>יום בחודש</label>
                <select className="form-input" value={day} onChange={e => setDay(parseInt(e.target.value))}>
                  {DAYS.map(d => <option key={d} value={d}>{d} לחודש</option>)}
                </select>
              </div>
            </div>
            <div className="recurring-form-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>ביטול</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'שומר...' : 'הוסף'}</button>
            </div>
          </form>
        </div>
      )}

      {recurring.length === 0 && !showForm && (
        <div className="recurring-empty">
          <div className="recurring-empty-icon">🔄</div>
          <p>אין הוראות קבע עדיין</p>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>הוסף שכר דירה, משכורת, מנויים וכל תשלום חוזר</p>
          <button className="btn-ghost" onClick={() => setShowForm(true)}>הוסף הוראה ראשונה</button>
        </div>
      )}

      <div className="recurring-list">
        {recurring.map(r => {
          const cat = categories.find(c => c.id === r.category)
          return (
            <div key={r.id} className={`recurring-card card ${!r.active ? 'inactive' : ''}`}>
              <div className="recurring-card-left">
                <div className="recurring-emoji">{cat?.emoji || '📦'}</div>
                <div>
                  <div className="recurring-desc">{r.description}</div>
                  <div className="recurring-meta">
                    <span className="recurring-cat-badge" style={{ background: (cat?.color || '#5A6080') + '22', color: cat?.color || '#5A6080' }}>
                      {cat?.label || r.category}
                    </span>
                    <span className="recurring-day">יום {r.day_of_month} לחודש</span>
                  </div>
                </div>
              </div>
              <div className="recurring-card-right">
                <span className={`recurring-amount ${r.type === 'income' ? 'pos' : 'neg'}`}>
                  {r.type === 'income' ? '+' : '-'}₪{Math.round(r.amount).toLocaleString('he-IL')}
                </span>
                <div className="recurring-actions">
                  <button
                    className={`recurring-toggle ${r.active ? 'active' : ''}`}
                    onClick={() => onUpdate(r.id, { active: !r.active })}
                    title={r.active ? 'השהה' : 'הפעל'}
                  >
                    {r.active ? '⏸' : '▶️'}
                  </button>
                  <button className="recurring-del" onClick={() => onRemove(r.id)} title="מחק">✕</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
