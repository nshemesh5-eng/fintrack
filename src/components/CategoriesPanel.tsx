import { useState } from 'react'
import { CategoryItem, DEFAULT_CATEGORIES } from '../types'
import './CategoriesPanel.css'

const COLORS = ['#00D68F','#5B8EFF','#9F7AFF','#FF5C7A','#FFB547','#FF8C5A','#5DCAA5','#7F77DD','#FF6B9D','#4ECDC4','#45B7D1','#96CEB4']
const EMOJIS = ['🍔','🚗','🏠','🎬','💊','👕','📚','📱','💰','💻','📈','✈️','🎮','🐾','🎵','☕','🏋️','💄','🛒','🎁','📦','🔄','💡','🏦']

interface Props {
  categories: CategoryItem[]
  onAdd: (cat: Omit<CategoryItem, 'id' | 'custom'>) => CategoryItem
  onUpdate: (id: string, changes: Partial<CategoryItem>) => void
  onRemove: (id: string) => void
}

export default function CategoriesPanel({ categories, onAdd, onUpdate, onRemove }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense')
  const [color, setColor] = useState(COLORS[0])
  const [emoji, setEmoji] = useState('📦')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label) return
    if (editId) {
      onUpdate(editId, { label, type, color, emoji })
      setEditId(null)
    } else {
      onAdd({ label, type, color, emoji })
    }
    setShowForm(false)
    setLabel(''); setType('expense'); setColor(COLORS[0]); setEmoji('📦')
  }

  const startEdit = (cat: CategoryItem) => {
    setEditId(cat.id)
    setLabel(cat.label)
    setType(cat.type)
    setColor(cat.color)
    setEmoji(cat.emoji)
    setShowForm(true)
  }

  const defaults = DEFAULT_CATEGORIES
  const custom = categories.filter(c => c.custom)

  return (
    <div className="cats-wrap">
      <div className="cats-header">
        <div>
          <h2>קטגוריות</h2>
          <p className="cats-subtitle">ניהול קטגוריות — ערוך קיימות או הוסף חדשות</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null) }}>+ קטגוריה חדשה</button>
      </div>

      {showForm && (
        <div className="cats-form card">
          <h3>{editId ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</h3>
          <form onSubmit={handleAdd}>
            <div className="cats-form-grid">
              <div className="field">
                <label>שם</label>
                <input className="form-input" type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="שם הקטגוריה" required />
              </div>
              <div className="field">
                <label>סוג</label>
                <select className="form-input" value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="expense">הוצאה</option>
                  <option value="income">הכנסה</option>
                  <option value="both">שניהם</option>
                </select>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label>אמוג'י</label>
              <div className="emoji-picker">
                {EMOJIS.map(e => (
                  <button key={e} type="button" className={`emoji-btn ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label>צבע</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button key={c} type="button" className={`color-btn ${color === c ? 'selected' : ''}`}
                    style={{ background: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setEditId(null) }}>ביטול</button>
              <button type="submit" className="btn-primary">{editId ? 'שמור שינויים' : 'הוסף'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="cats-section">
        <div className="cats-section-title">קטגוריות ברירת מחדל</div>
        <div className="cats-grid">
          {defaults.map(cat => (
            <div key={cat.id} className="cat-card card">
              <div className="cat-card-left">
                <span className="cat-emoji" style={{ background: cat.color + '22' }}>{cat.emoji}</span>
                <div>
                  <div className="cat-label">{cat.label}</div>
                  <div className="cat-type">{cat.type === 'income' ? 'הכנסה' : cat.type === 'expense' ? 'הוצאה' : 'שניהם'}</div>
                </div>
              </div>
              <div className="cat-color-dot" style={{ background: cat.color }} />
            </div>
          ))}
        </div>
      </div>

      {custom.length > 0 && (
        <div className="cats-section">
          <div className="cats-section-title">קטגוריות מותאמות אישית</div>
          <div className="cats-grid">
            {custom.map(cat => (
              <div key={cat.id} className="cat-card card">
                <div className="cat-card-left">
                  <span className="cat-emoji" style={{ background: cat.color + '22' }}>{cat.emoji}</span>
                  <div>
                    <div className="cat-label">{cat.label}</div>
                    <div className="cat-type">{cat.type === 'income' ? 'הכנסה' : cat.type === 'expense' ? 'הוצאה' : 'שניהם'}</div>
                  </div>
                </div>
                <div className="cat-actions">
                  <div className="cat-color-dot" style={{ background: cat.color }} />
                  <button className="cat-edit" onClick={() => startEdit(cat)}>✏️</button>
                  <button className="cat-del" onClick={() => onRemove(cat.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
