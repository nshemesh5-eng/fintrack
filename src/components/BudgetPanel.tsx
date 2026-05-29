import { useState } from 'react'
import { Budget, Transaction, EXPENSE_CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, Category } from '../types'
import './BudgetPanel.css'

interface Props {
  budgets: Budget[]
  transactions: Transaction[]
  onUpsert: (category: string, limit: number) => Promise<void>
}

export default function BudgetPanel({ budgets, transactions, onUpsert }: Props) {
  const [editing, setEditing] = useState<Category | null>(null)
  const [limitVal, setLimitVal] = useState('')
  const [saving, setSaving] = useState(false)

  const spentByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {} as Record<string, number>)

  const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL')

  const handleSave = async (cat: Category) => {
    const val = parseFloat(limitVal)
    if (!val || val <= 0) return
    setSaving(true)
    await onUpsert(cat, val)
    setSaving(false)
    setEditing(null)
    setLimitVal('')
  }

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>תקציבים חודשיים</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>לחץ על קטגוריה לעריכת תקציב</p>
      </div>
      <div className="budgets-grid">
        {EXPENSE_CATEGORIES.map(cat => {
          const budget = budgets.find(b => b.category === cat)
          const spent = spentByCategory[cat] || 0
          const limit = budget?.monthly_limit || 0
          const pct = limit > 0 ? Math.min(spent / limit * 100, 100) : 0
          const over = limit > 0 && spent > limit
          const isEditing = editing === cat

          return (
            <div key={cat} className={`budget-card card ${over ? 'over' : ''}`}>
              <div className="budget-top">
                <div className="budget-cat" style={{ color: CATEGORY_COLORS[cat] }}>
                  {CATEGORY_LABELS[cat]}
                </div>
                <button
                  className="budget-edit"
                  onClick={() => { setEditing(cat); setLimitVal(limit.toString()) }}
                >✏️</button>
              </div>

              {isEditing ? (
                <div className="budget-edit-row">
                  <input
                    className="form-input"
                    type="number"
                    value={limitVal}
                    onChange={e => setLimitVal(e.target.value)}
                    placeholder="תקציב ₪"
                    autoFocus
                    style={{ flex: 1, height: 34 }}
                  />
                  <button className="btn-primary" style={{ height: 34, padding: '0 12px', fontSize: 13 }} onClick={() => handleSave(cat)} disabled={saving}>
                    {saving ? '...' : 'שמור'}
                  </button>
                  <button className="btn-ghost" style={{ height: 34 }} onClick={() => setEditing(null)}>ביטול</button>
                </div>
              ) : (
                <>
                  <div className="budget-amounts">
                    <span className={over ? 'amount-over' : ''}>{fmt(spent)}</span>
                    <span style={{ color: 'var(--text3)' }}> / {limit > 0 ? fmt(limit) : 'לא הוגדר'}</span>
                  </div>
                  {limit > 0 && (
                    <div className="budget-bar-bg">
                      <div
                        className={`budget-bar-fill ${over ? 'over' : pct > 80 ? 'warn' : 'ok'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  {limit > 0 && (
                    <div className="budget-pct" style={{ color: over ? 'var(--red)' : 'var(--text2)' }}>
                      {over ? `חריגה של ${fmt(spent - limit)}` : `${Math.round(pct)}% בשימוש`}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
