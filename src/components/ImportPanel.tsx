import { useState, useRef } from 'react'
import { Category, CATEGORY_LABELS, EXPENSE_CATEGORIES } from '../types'
import './ImportPanel.css'

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: Category
  selected: boolean
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

interface Props {
  onImport: (transactions: Array<{
    type: 'income' | 'expense'
    amount: number
    description: string
    category: Category
    date: string
  }>) => Promise<void>
}

export default function ImportPanel({ onImport }: Props) {
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<ParsedTransaction[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fmt = (n: number) => '₪' + Math.abs(n).toLocaleString('he-IL')

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For PDF or text-based files
      if (file.type === 'application/pdf') {
        const reader = new FileReader()
        reader.onload = () => {
          // Send as base64 to Gemini with vision
          const base64 = (reader.result as string).split(',')[1]
          resolve('__PDF__' + base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      } else {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(file, 'utf-8')
      }
    })
  }

  const parseWithAI = async (content: string, fileName: string): Promise<ParsedTransaction[]> => {
    if (!GEMINI_API_KEY) throw new Error('חסר מפתח Gemini API')

    const isPDF = content.startsWith('__PDF__')
    const base64PDF = isPDF ? content.slice(7) : null

    const prompt = `אתה מנתח דוחות כרטיס אשראי ישראלי. ${isPDF ? 'נתח את ה-PDF של פירוט כרטיס האשראי.' : `הנה תוכן הקובץ:\n${content.substring(0, 8000)}`}

הוצא את כל העסקאות ממנו. לכל עסקה זהה:
- תאריך (פורמט YYYY-MM-DD)
- תיאור/שם עסק
- סכום (מספר חיובי)
- סוג: expense (הוצאה) או income (הכנסה/זיכוי)
- קטגוריה מהרשימה: food, transport, housing, entertainment, health, clothing, education, subscriptions, salary, other

כללים:
- רוב הפעולות בדוח אשראי הן expense
- זיכויים, החזרים, הפקדות = income
- סכומים שליליים בדוח = expense (קח ערך מוחלט)
- תאריך: אם רק חודש/שנה, קח יום 1

החזר JSON בלבד (ללא backticks, ללא הסבר):
{"transactions":[{"date":"YYYY-MM-DD","description":"שם העסק","amount":123.45,"type":"expense","category":"food"}]}`

    let response
    if (isPDF) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: 'application/pdf', data: base64PDF } },
                { text: prompt }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
          })
        }
      )
    } else {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
          })
        }
      )
    }

    if (!response.ok) throw new Error('שגיאה בניתוח AI')
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return (parsed.transactions || []).map((t: any) => ({
      date: t.date,
      description: t.description || 'עסקה לא ידועה',
      amount: Math.abs(parseFloat(t.amount) || 0),
      type: t.type === 'income' ? 'income' : 'expense',
      category: (EXPENSE_CATEGORIES.includes(t.category) || ['salary','freelance','investment'].includes(t.category))
        ? t.category : 'other',
      selected: true
    }))
  }

  const handleFile = async (file: File) => {
    if (!file) return
    setError('')
    setParsing(true)

    try {
      const content = await readFile(file)
      const transactions = await parseWithAI(content, file.name)
      if (transactions.length === 0) throw new Error('לא נמצאו עסקאות בקובץ')
      setParsed(transactions)
      setStep('review')
    } catch (e: any) {
      setError(e.message || 'שגיאה בניתוח הקובץ')
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const toggleAll = (val: boolean) => {
    setParsed(prev => prev.map(t => ({ ...t, selected: val })))
  }

  const handleSave = async () => {
    const selected = parsed.filter(t => t.selected)
    if (selected.length === 0) return
    setSaving(true)
    try {
      await onImport(selected.map(({ selected: _, ...t }) => t))
      setStep('done')
    } catch (e) {
      setError('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'done') {
    const count = parsed.filter(t => t.selected).length
    return (
      <div className="import-done">
        <div className="import-done-icon">✅</div>
        <h3>יובאו {count} עסקאות בהצלחה!</h3>
        <p>העסקאות נוספו לרשימה שלך.</p>
        <button className="btn-primary" onClick={() => { setStep('upload'); setParsed([]); }}>
          ייבוא קובץ נוסף
        </button>
      </div>
    )
  }

  if (step === 'review') {
    const selectedCount = parsed.filter(t => t.selected).length
    const totalAmount = parsed.filter(t => t.selected && t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    return (
      <div className="import-review">
        <div className="import-review-header">
          <div>
            <h3>סקירה לפני ייבוא</h3>
            <p className="import-subtitle">נמצאו {parsed.length} עסקאות — בדוק ואשר</p>
          </div>
          <div className="import-review-actions">
            <button className="btn-ghost" onClick={() => toggleAll(true)}>בחר הכל</button>
            <button className="btn-ghost" onClick={() => toggleAll(false)}>בטל הכל</button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
            >
              {saving ? 'שומר...' : `ייבא ${selectedCount} עסקאות`}
            </button>
          </div>
        </div>

        <div className="import-summary-bar">
          <span>{selectedCount} נבחרו</span>
          <span>סה"כ הוצאות: {fmt(totalAmount)}</span>
          <button className="import-back" onClick={() => setStep('upload')}>← חזור</button>
        </div>

        <div className="import-table">
          <div className="import-table-header">
            <span></span>
            <span>תאריך</span>
            <span>תיאור</span>
            <span>קטגוריה</span>
            <span style={{ textAlign: 'left' }}>סכום</span>
          </div>
          {parsed.map((tx, i) => (
            <div key={i} className={`import-row ${!tx.selected ? 'dimmed' : ''}`}>
              <input
                type="checkbox"
                checked={tx.selected}
                onChange={e => setParsed(prev => prev.map((t, j) => j === i ? { ...t, selected: e.target.checked } : t))}
              />
              <span className="import-date">{tx.date}</span>
              <span className="import-desc">{tx.description}</span>
              <span>
                <select
                  className="import-cat-select"
                  value={tx.category}
                  onChange={e => setParsed(prev => prev.map((t, j) => j === i ? { ...t, category: e.target.value as Category } : t))}
                >
                  {[...EXPENSE_CATEGORIES, 'salary', 'freelance', 'investment'].map(c => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c as Category]}</option>
                  ))}
                </select>
              </span>
              <span className={`import-amount ${tx.type === 'income' ? 'pos' : 'neg'}`}>
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
              </span>
            </div>
          ))}
        </div>

        {error && <div className="import-error">{error}</div>}
      </div>
    )
  }

  return (
    <div className="import-upload">
      <h3>ייבוא מדוח אשראי</h3>
      <p className="import-subtitle">העלה פירוט מכרטיס האשראי שלך — ה-AI יזהה ויסווג את כל העסקאות אוטומטית</p>

      <div
        className={`import-dropzone ${dragOver ? 'drag-over' : ''} ${parsing ? 'loading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !parsing && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls,.txt"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {parsing ? (
          <div className="import-parsing">
            <div className="import-spinner" />
            <p>מנתח עסקאות עם AI...</p>
          </div>
        ) : (
          <>
            <div className="import-icon">📄</div>
            <p className="import-drop-text">גרור קובץ לכאן או לחץ לבחירה</p>
            <p className="import-formats">PDF • Excel • CSV • TXT</p>
          </>
        )}
      </div>

      <div className="import-banks">
        <p>תואם לפירוטי:</p>
        <div className="import-bank-list">
          {['מקס', 'ישראכארט', 'כאל', 'לאומי קארד', 'ויזה CAL', 'ביט'].map(b => (
            <span key={b} className="import-bank-badge">{b}</span>
          ))}
        </div>
      </div>

      {error && <div className="import-error">{error}</div>}
    </div>
  )
}
