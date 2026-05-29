import { useState } from 'react'
import { format } from 'date-fns'
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_LABELS, Category } from '../types'
import './AddTransaction.css'

interface Props {
  onAdd: (tx: { type: TransactionType; amount: number; description: string; category: Category; date: string }) => Promise<void>
  onClose: () => void
}

export default function AddTransaction({ onAdd, onClose }: Props) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) { setError('הכנס סכום תקין'); return }
    setLoading(true)
    await onAdd({ type, amount: parseFloat(amount), description, category, date })
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card card">
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>הוסף עסקה</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="type-toggle">
          <button
            className={`type-btn ${type === 'expense' ? 'active-exp' : ''}`}
            onClick={() => { setType('expense'); setCategory('food') }}
          >הוצאה</button>
          <button
            className={`type-btn ${type === 'income' ? 'active-inc' : ''}`}
            onClick={() => { setType('income'); setCategory('salary') }}
          >הכנסה</button>
        </div>

        <form onSubmit={handleSubmit} className="add-form">
          <div className="field">
            <label>סכום (₪)</label>
            <input
              className="form-input"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="field">
            <label>תיאור</label>
            <input
              className="form-input"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="למשל: סופרמרקט, משכורת..."
              required
            />
          </div>
          <div className="field">
            <label>קטגוריה</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value as Category)}>
              {cats.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="field">
            <label>תאריך</label>
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>ביטול</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'שומר...' : 'הוסף'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
