import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'
import { he } from 'date-fns/locale'
import { useTransactions } from '../hooks/useTransactions'
import { useBudgets } from '../hooks/useBudgets'
import { useGoals } from '../hooks/useGoals'
import { useRecurring } from '../hooks/useRecurring'
import { useCategories } from '../hooks/useCategories'
import { getAIInsights } from '../lib/ai'
import { AIInsight, getCategoryColor, getCategoryLabel, getCategoryEmoji } from '../types'
import AddTransaction from '../components/AddTransaction'
import TransactionList from '../components/TransactionList'
import BudgetPanel from '../components/BudgetPanel'
import GoalsPanel from '../components/GoalsPanel'
import InsightCard from '../components/InsightCard'
import MonthlyChart from '../components/MonthlyChart'
import ImportPanel from '../components/ImportPanel'
import RecurringPanel from '../components/RecurringPanel'
import CategoriesPanel from '../components/CategoriesPanel'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

type Tab = 'overview' | 'transactions' | 'budgets' | 'goals' | 'recurring' | 'import' | 'categories'

export default function Dashboard({ user }: { user: User }) {
  const { transactions, loading: txLoading, add: addTx, remove: removeTxRaw } = useTransactions(user.id)
  const removeTx = async (id: string): Promise<void> => { await removeTxRaw(id) }
  const { budgets, upsert: upsertBudget } = useBudgets(user.id)
  const { goals, add: addGoal, update: updateGoal, remove: removeGoal } = useGoals(user.id)
  const { recurring, add: addRecurring, update: updateRecurring, remove: removeRecurring, applyCurrentMonth } = useRecurring(user.id)
  const { all: categories, add: addCat, update: updateCat, remove: removeCat } = useCategories()
  const [tab, setTab] = useState<Tab>('overview')
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const thisMonthTx = transactions.filter(tx =>
    isWithinInterval(new Date(tx.date), { start: monthStart, end: monthEnd })
  )

  const totalIncome = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses

  // Savings rate
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0

  // Top expense category
  const expByCat: Record<string, number> = {}
  thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
    expByCat[t.category] = (expByCat[t.category] || 0) + t.amount
  })
  const topCat = Object.entries(expByCat).sort((a, b) => b[1] - a[1])[0]

  // Apply recurring on load
  useEffect(() => {
    if (!txLoading && recurring.length > 0) {
      applyCurrentMonth(addTx)
    }
  }, [txLoading, recurring.length])

  const refreshInsights = async () => {
    if (transactions.length === 0) return
    setInsightsLoading(true)
    const result = await getAIInsights(transactions, budgets, goals)
    setInsights(result)
    setInsightsLoading(false)
  }

  useEffect(() => {
    if (!txLoading && transactions.length > 0) refreshInsights()
  }, [txLoading, transactions.length])

  const fmt = (n: number) => '₪' + Math.round(Math.abs(n)).toLocaleString('he-IL')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'סקירה', icon: '◉' },
    { id: 'transactions', label: 'עסקאות', icon: '↕' },
    { id: 'recurring', label: 'הוראות קבע', icon: '🔄' },
    { id: 'budgets', label: 'תקציבים', icon: '◎' },
    { id: 'goals', label: 'יעדים', icon: '🎯' },
    { id: 'import', label: 'ייבוא', icon: '📥' },
    { id: 'categories', label: 'קטגוריות', icon: '🏷' },
  ]

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="page-container">
          <div className="dash-header-inner">
            <div className="dash-logo">
              <div className="dash-logo-icon">
                <span>☀</span>
              </div>
              <div className="dash-logo-text">
                <span className="dash-logo-sun">Sun</span><span className="dash-logo-track">Track</span>
              </div>
            </div>
            <div className="dash-header-right">
              <span className="dash-user">{user.email}</span>
              <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>יציאה</button>
            </div>
          </div>
        </div>
      </header>

      <div className="page-container">
        <div className="dash-month-bar">
          <span className="dash-month-label">{format(now, 'MMMM yyyy', { locale: he })}</span>
          <button className="btn-primary dash-add-btn" onClick={() => setShowAdd(true)}>+ הוסף עסקה</button>
        </div>

        {/* Hero metrics */}
        <div className="metrics-hero">
          <div className="metric-hero-main">
            <div className="metric-hero-label">מאזן חודשי</div>
            <div className={`metric-hero-value ${balance >= 0 ? 'pos' : 'neg'}`}>
              {balance >= 0 ? '+' : '-'}{fmt(balance)}
            </div>
            <div className="metric-hero-sub">
              {savingsRate >= 0
                ? `חסכת ${savingsRate}% מהכנסות החודש`
                : `הוצאת ${Math.abs(savingsRate)}% יותר מההכנסות`}
            </div>
          </div>

          <div className="metrics-side">
            <div className="metric-card-sm card">
              <div className="metric-sm-label">הכנסות</div>
              <div className="metric-sm-value green">{fmt(totalIncome)}</div>
              <div className="metric-sm-bar">
                <div className="metric-sm-fill green" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="metric-card-sm card">
              <div className="metric-sm-label">הוצאות</div>
              <div className="metric-sm-value red">{fmt(totalExpenses)}</div>
              <div className="metric-sm-bar">
                <div className="metric-sm-fill red"
                  style={{ width: totalIncome > 0 ? `${Math.min(100, (totalExpenses / totalIncome) * 100)}%` : '0%' }} />
              </div>
            </div>
            <div className="metric-card-sm card">
              <div className="metric-sm-label">עסקאות החודש</div>
              <div className="metric-sm-value blue">{thisMonthTx.length}</div>
              <div className="metric-sm-bar">
                <div className="metric-sm-fill blue" style={{ width: `${Math.min(100, thisMonthTx.length * 3)}%` }} />
              </div>
            </div>
            {topCat && (
              <div className="metric-card-sm card">
                <div className="metric-sm-label">הוצאה מובילה</div>
                <div className="metric-sm-value" style={{ color: getCategoryColor(topCat[0], categories), fontSize: 14 }}>
                  {getCategoryEmoji(topCat[0], categories)} {getCategoryLabel(topCat[0], categories)}
                </div>
                <div className="metric-sm-sub">{fmt(topCat[1])}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`dash-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="dash-tab-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="overview-grid">
            <div className="overview-main">
              <MonthlyChart transactions={transactions} />
              <div className="section-header" style={{ marginTop: 24 }}>
                <div className="section-title">עסקאות אחרונות</div>
                <button className="btn-ghost" style={{ fontSize: 12, height: 30 }} onClick={() => setTab('transactions')}>
                  הכל →
                </button>
              </div>
              <TransactionList transactions={thisMonthTx.slice(0, 8)} onDelete={removeTx} compact />
            </div>
            <div className="overview-side">
              <div className="section-header">
                <div className="section-title">ניתוח AI</div>
                <button className="btn-ghost" style={{ fontSize: 12, height: 28 }} onClick={refreshInsights}>
                  {insightsLoading ? '...' : '↻'}
                </button>
              </div>
              {insightsLoading && <div className="loading-text">מנתח...</div>}
              {!insightsLoading && insights.length === 0 && (
                <div className="empty-state">הוסף עסקאות לקבלת ניתוח AI</div>
              )}
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}

              {recurring.filter(r => r.active).length > 0 && (
                <div className="recurring-widget card">
                  <div className="recurring-widget-title">🔄 הוראות קבע פעילות</div>
                  {recurring.filter(r => r.active).slice(0, 4).map(r => (
                    <div key={r.id} className="recurring-widget-row">
                      <span>{getCategoryEmoji(r.category, categories)} {r.description}</span>
                      <span className={r.type === 'income' ? 'pos' : 'neg'}>
                        {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                      </span>
                    </div>
                  ))}
                  {recurring.filter(r => r.active).length > 4 && (
                    <button className="btn-ghost" style={{ width: '100%', marginTop: 8, fontSize: 12 }} onClick={() => setTab('recurring')}>
                      עוד {recurring.filter(r => r.active).length - 4} הוראות
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div>
            <div className="section-header">
              <div className="section-title">כל העסקאות</div>
              <button className="btn-primary" onClick={() => setShowAdd(true)}>+ הוסף</button>
            </div>
            <TransactionList transactions={transactions} onDelete={removeTx} />
          </div>
        )}

        {tab === 'recurring' && (
          <RecurringPanel
            recurring={recurring}
            categories={categories}
            onAdd={addRecurring}
            onUpdate={updateRecurring}
            onRemove={removeRecurring}
          />
        )}

        {tab === 'budgets' && (
          <BudgetPanel budgets={budgets} transactions={thisMonthTx} onUpsert={upsertBudget} />
        )}

        {tab === 'goals' && (
          <GoalsPanel goals={goals} onAdd={addGoal} onUpdate={updateGoal} onRemove={removeGoal} />
        )}

        {tab === 'import' && (
          <ImportPanel
            onImport={async (txs) => {
              for (const tx of txs) await addTx(tx)
            }}
          />
        )}

        {tab === 'categories' && (
          <CategoriesPanel
            categories={categories}
            onAdd={addCat}
            onUpdate={updateCat}
            onRemove={removeCat}
          />
        )}
      </div>

      {showAdd && (
        <AddTransaction
          onAdd={async (tx) => { await addTx(tx); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
