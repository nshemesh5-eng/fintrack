import { Transaction, CATEGORY_LABELS, CATEGORY_COLORS } from '../types'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import './TransactionList.css'

interface Props {
  transactions: Transaction[]
  onDelete: (id: string) => Promise<void>
  compact?: boolean
}

export default function TransactionList({ transactions, onDelete, compact }: Props) {
  const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL')

  if (transactions.length === 0) {
    return <div className="tx-empty">אין עסקאות עדיין</div>
  }

  return (
    <div className="tx-list card">
      <div className="tx-header">
        <span>תיאור</span>
        <span>קטגוריה</span>
        <span>תאריך</span>
        <span style={{ textAlign: 'left' }}>סכום</span>
        <span></span>
      </div>
      {transactions.slice(0, compact ? 8 : 1000).map(tx => (
        <div key={tx.id} className="tx-row">
          <span className="tx-desc">{tx.description}</span>
          <span>
            <span className="tx-cat" style={{
              background: CATEGORY_COLORS[tx.category] + '22',
              color: CATEGORY_COLORS[tx.category],
            }}>
              {CATEGORY_LABELS[tx.category]}
            </span>
          </span>
          <span className="tx-date">{format(new Date(tx.date), 'd MMM', { locale: he })}</span>
          <span className={`tx-amount ${tx.type === 'income' ? 'pos' : 'neg'}`}>
            {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
          </span>
          <button className="tx-del" onClick={() => onDelete(tx.id)} title="מחק">✕</button>
        </div>
      ))}
    </div>
  )
}
