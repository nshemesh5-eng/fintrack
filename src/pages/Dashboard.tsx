import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'
import { he } from 'date-fns/locale'
import { useTransactions } from '../hooks/useTransactions'
import { useBudgets } from '../hooks/useBudgets'
import { useGoals } from '../hooks/useGoals'
import { getAIInsights } from '../lib/ai'
import { AIInsight, CATEGORY_LABELS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS, Category } from '../types'
import AddTransaction from '../components/AddTransaction'
import TransactionList from '../components/TransactionList'
import BudgetPanel from '../components/BudgetPanel'
import GoalsPanel from '../components/GoalsPanel'
import InsightCard from '../components/InsightCard'
import MonthlyChart from '../components/MonthlyChart'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

type Tab = 'overview' | 'transactions' | 'budgets' | 'goals'

export default function Dashboard({ user }: { user: User }) {
  const { transactions, loading: txLoading, add: addTx, remove: removeTx } = useTransactions(user.id)
  const { budgets, upsert: upsertBudget } = useBudgets(user.id)
  const { goals, add: addGoal, update: updateGoal, remove: removeGoal } = useGoals(user.id)
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

  const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'סקירה' },
    { id: 'transactions', label: 'עסקאות' },
    { id: 'budgets', label: 'תקציבים' },
    { id: 'goals', label: 'יעדים' },
  ]

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="page-container">
          <div className="dash-header-inner">
            <div className="dash-logo">
              <span className="dash-logo-icon">₪</span>
              <span>FinTrack</span>
            </div>
            <div className="dash-header-right">
              <span className="dash-user">{user.email}</span>
              <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>יציאה</button>
            </div>
          </div>
        </div>
      </header>

      <div className="page-container">
        <div className="dash-month">
          <span>{format(now, 'MMMM yyyy', { locale: he })}</span>
        </div>

        <div className="metrics-grid">
          <div className="metric-card card">
            <div className="metric-label">הכנסות החודש</div>
            <div className="metric-value green">{fmt(totalIncome)}</div>
          </div>
          <div className="metric-card card">
            <div className="metric-label">הוצאות החודש</div>
            <div className="metric-value red">{fmt(totalExpenses)}</div>
          </div>
          <div className="metric-card card">
            <div className="metric-label">מאזן</div>
            <div className={`metric-value ${balance >= 0 ? 'green' : 'red'}`}>{fmt(balance)}</div>
          </div>
          <div className="metric-card card" style={{ cursor: 'pointer' }} onClick={() => setShowAdd(true)}>
            <div className="metric-label">הוסף עסקה</div>
            <div className="metric-value" style={{ fontSize: 28, color: 'var(--text3)' }}>+</div>
          </div>
        </div>

        <div className="dash-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`dash-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="overview-grid">
            <div className="overview-main">
              <MonthlyChart transactions={transactions} />
              <div className="section-title" style={{ marginTop: 24 }}>עסקאות אחרונות</div>
              <TransactionList
                transactions={thisMonthTx.slice(0, 8)}
                onDelete={removeTx}
                compact
              />
            </div>
            <div className="overview-side">
              <div className="section-title">
                ניתוח AI
                <button className="btn-ghost" style={{ fontSize: 12, height: 28, marginRight: 8 }} onClick={refreshInsights}>
                  {insightsLoading ? '...' : '↻ רענן'}
                </button>
              </div>
              {insightsLoading && <div className="loading-text">מנתח נתונים...</div>}
              {!insightsLoading && insights.length === 0 && (
                <div className="empty-state">הוסף עסקאות כדי לקבל ניתוח AI</div>
              )}
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div>
            <div className="section-header">
              <div className="section-title">כל העסקאות</div>
              <button className="btn-primary" onClick={() => setShowAdd(true)}>+ הוסף עסקה</button>
            </div>
            <TransactionList transactions={transactions} onDelete={removeTx} />
          </div>
        )}

        {tab === 'budgets' && (
          <BudgetPanel
            budgets={budgets}
            transactions={thisMonthTx}
            onUpsert={upsertBudget}
          />
        )}

        {tab === 'goals' && (
          <GoalsPanel
            goals={goals}
            onAdd={addGoal}
            onUpdate={updateGoal}
            onRemove={removeGoal}
          />
        )}
      </div>

      {showAdd && (
        <AddTransaction
          onAdd={async (tx) => {
            await addTx(tx)
            setShowAdd(false)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
