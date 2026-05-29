export type TransactionType = 'income' | 'expense'

export type Category =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'food'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'health'
  | 'clothing'
  | 'education'
  | 'subscriptions'
  | 'other'

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
  month: string // YYYY-MM
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

export interface AIInsight {
  type: 'warning' | 'tip' | 'forecast' | 'achievement'
  title: string
  message: string
  category?: Category
}

export const CATEGORY_LABELS: Record<Category, string> = {
  salary: 'משכורת',
  freelance: 'פרילנס',
  investment: 'השקעות',
  food: 'אוכל',
  transport: 'תחבורה',
  housing: 'דיור',
  entertainment: 'בידור',
  health: 'בריאות',
  clothing: 'ביגוד',
  education: 'חינוך',
  subscriptions: 'מנויים',
  other: 'אחר',
}

export const EXPENSE_CATEGORIES: Category[] = [
  'food', 'transport', 'housing', 'entertainment',
  'health', 'clothing', 'education', 'subscriptions', 'other'
]

export const INCOME_CATEGORIES: Category[] = [
  'salary', 'freelance', 'investment', 'other'
]

export const CATEGORY_COLORS: Record<Category, string> = {
  salary: '#1D9E75',
  freelance: '#5DCAA5',
  investment: '#9FE1CB',
  food: '#BA7517',
  transport: '#378ADD',
  housing: '#7F77DD',
  entertainment: '#D4537E',
  health: '#639922',
  clothing: '#D85A30',
  education: '#185FA5',
  subscriptions: '#993556',
  other: '#888780',
}
