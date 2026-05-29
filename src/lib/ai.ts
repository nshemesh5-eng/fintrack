import { Transaction, Budget, Goal, AIInsight, CATEGORY_LABELS } from '../types'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function getAIInsights(
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[]
): Promise<AIInsight[]> {
  if (!GEMINI_API_KEY || transactions.length === 0) {
    return getFallbackInsights(transactions, budgets)
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const thisMonthTx = transactions.filter(tx =>
    isWithinInterval(new Date(tx.date), { start: monthStart, end: monthEnd })
  )

  const totalIncome = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const expenseByCategory: Record<string, number> = {}
  thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
  })

  const budgetSummary = budgets.map(b => ({
    category: CATEGORY_LABELS[b.category],
    limit: b.monthly_limit,
    spent: expenseByCategory[b.category] || 0,
    percent: Math.round(((expenseByCategory[b.category] || 0) / b.monthly_limit) * 100)
  }))

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const monthProgress = daysPassed / daysInMonth

  const prompt = `אתה יועץ פיננסי ישראלי. נתח את הנתונים הבאים ותן 3-4 תובנות קצרות ומעשיות בעברית.

חודש נוכחי (${format(now, 'MMMM yyyy')}):
- עברו ${daysPassed} מתוך ${daysInMonth} ימים (${Math.round(monthProgress * 100)}% מהחודש)
- הכנסות: ₪${totalIncome.toLocaleString()}
- הוצאות: ₪${totalExpenses.toLocaleString()}
- מאזן: ₪${(totalIncome - totalExpenses).toLocaleString()}

הוצאות לפי קטגוריה:
${Object.entries(expenseByCategory).map(([cat, amt]) => `- ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}: ₪${amt.toLocaleString()}`).join('\n')}

${budgetSummary.length > 0 ? `תקציבים:\n${budgetSummary.map(b => `- ${b.category}: ₪${b.spent.toLocaleString()} מתוך ₪${b.limit.toLocaleString()} (${b.percent}%)`).join('\n')}` : ''}

${goals.length > 0 ? `יעדים:\n${goals.map(g => `- ${g.name}: ₪${g.current_amount.toLocaleString()} מתוך ₪${g.target_amount.toLocaleString()}`).join('\n')}` : ''}

היסטוריה: ${transactions.length} עסקאות סך הכל.

החזר JSON בפורמט הבא בלבד (ללא טקסט נוסף, ללא backticks):
{"insights":[{"type":"warning|tip|forecast|achievement","title":"כותרת קצרה","message":"הסבר קצר עד 2 משפטים","category":"קטגוריה אופציונלית"}]}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
      }
    )

    if (!response.ok) throw new Error('Gemini API error')

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return parsed.insights as AIInsight[]
  } catch (e) {
    console.error('AI insights failed:', e)
    return getFallbackInsights(transactions, budgets)
  }
}

function getFallbackInsights(transactions: Transaction[], budgets: Budget[]): AIInsight[] {
  const insights: AIInsight[] = []
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const thisMonth = transactions.filter(tx =>
    isWithinInterval(new Date(tx.date), { start: monthStart, end: monthEnd })
  )

  const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  if (income > 0 && expenses > income * 0.9) {
    insights.push({
      type: 'warning',
      title: 'הוצאות גבוהות החודש',
      message: `ההוצאות שלך (₪${expenses.toLocaleString()}) מגיעות ל-${Math.round(expenses/income*100)}% מההכנסות. כדאי לבדוק אילו קטגוריות אפשר לצמצם.`
    })
  }

  budgets.forEach(b => {
    const spent = thisMonth.filter(t => t.category === b.category && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const pct = spent / b.monthly_limit
    if (pct > 0.8) {
      insights.push({
        type: pct > 1 ? 'warning' : 'tip',
        title: `${CATEGORY_LABELS[b.category]} – ${pct > 1 ? 'חריגה מהתקציב' : 'קרוב לתקציב'}`,
        message: `השתמשת ב-${Math.round(pct*100)}% מהתקציב החודשי שלך לקטגוריה זו.`,
        category: b.category
      })
    }
  })

  if (insights.length === 0 && transactions.length > 0) {
    insights.push({
      type: 'tip',
      title: 'הכל נראה תקין!',
      message: 'המשך להזין עסקאות והוסף תקציבים חודשיים כדי לקבל ניתוח מפורט יותר.'
    })
  }

  return insights
}
