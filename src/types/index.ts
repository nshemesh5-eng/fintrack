export type TransactionType = 'income' | 'expense'

export type Category = string // Now dynamic - stored as string

// Default categories
export const DEFAULT_CATEGORIES = [
  { id: 'salary', label: 'משכורת', type: 'income', color: '#00D68F', emoji: '💰' },
  { id: 'freelance', label: 'פרילנס', type: 'income', color: '#5DCAA5', emoji: '💻' },
  { id: 'investment', label: 'השקעות', type: 'income', color: '#9F7AFF', emoji: '📈' },
  { id: 'food', label: 'אוכל', type: 'expense', color: '#FFB547', emoji: '🍔' },
  { id: 'transport', label: 'תחבורה', type: 'expense', color: '#5B8EFF', emoji: '🚗' },
  { id: 'housing', label: 'דיור', type: 'expense', color: '#7F77DD', emoji: '🏠' },
  { id: 'entertainment', label: 'בידור', type: 'expense', color: '#FF5C7A', emoji: '🎬' },
  { id: 'health', label: 'בריאות', type: 'expense', color: '#00D68F', emoji: '💊' },
  { id: 'clothing', label: 'ביגוד', type: 'expense', color: '#FF8C5A', emoji: '👕' },
  { id: 'education', label: 'חינוך', type: 'expense', color: '#5B8EFF', emoji: '📚' },
  { id: 'subscriptions', label: 'מנויים', type: 'expense', color: '#9F7AFF', emoji: '📱' },
  { id: 'other', label: 'אחר', type: 'both', color: '#5A6080', emoji: '📦' },
]

export interface CategoryItem {
  id: string
  label: string
  type: 'income' | 'expense' | 'both'
  color: string
  emoji: string
  custom?: boolean
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string
  category: Category
  date: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: Category
  monthly_limit: number
  month: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string
  created_at: string
}

export interface RecurringTransaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string
  category: Category
  day_of_month: number // 1-31
  active: boolean
  created_at: string
}

export interface AIInsight {
  type: 'warning' | 'tip' | 'forecast' | 'achievement'
  title: string
  message: string
  category?: Category
}

// Helper functions that work with dynamic categories
export function getCategoryLabel(id: string, customCats: CategoryItem[] = []): string {
  const all = [...DEFAULT_CATEGORIES, ...customCats]
  return all.find(c => c.id === id)?.label || id
}

export function getCategoryColor(id: string, customCats: CategoryItem[] = []): string {
  const all = [...DEFAULT_CATEGORIES, ...customCats]
  return all.find(c => c.id === id)?.color || '#5A6080'
}

export function getCategoryEmoji(id: string, customCats: CategoryItem[] = []): string {
  const all = [...DEFAULT_CATEGORIES, ...customCats]
  return all.find(c => c.id === id)?.emoji || '📦'
}

// Legacy compat
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map(c => [c.id, c.label])
)
export const EXPENSE_CATEGORIES = DEFAULT_CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both').map(c => c.id)
export const INCOME_CATEGORIES = DEFAULT_CATEGORIES.filter(c => c.type === 'income' || c.type === 'both').map(c => c.id)
export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map(c => [c.id, c.color])
)
