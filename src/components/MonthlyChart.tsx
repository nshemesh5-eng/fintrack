import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Transaction } from '../types'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { he } from 'date-fns/locale'
import './MonthlyChart.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function MonthlyChart({ transactions }: { transactions: Transaction[] }) {
  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      const txs = transactions.filter(t => isWithinInterval(new Date(t.date), { start, end }))
      return {
        label: format(d, 'MMM', { locale: he }),
        income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions])

  const data = {
    labels: months.map(m => m.label),
    datasets: [
      {
        label: 'הכנסות',
        data: months.map(m => m.income),
        backgroundColor: '#1D9E7566',
        borderColor: '#1D9E75',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'הוצאות',
        data: months.map(m => m.expense),
        backgroundColor: '#E24B4A55',
        borderColor: '#E24B4A',
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  }

  return (
    <div className="chart-wrap card">
      <div className="chart-header">
        <span className="chart-title">6 חודשים אחרונים</span>
        <div className="chart-legend">
          <span><span className="dot green"></span>הכנסות</span>
          <span><span className="dot red"></span>הוצאות</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 200 }}>
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { rtl: true } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { family: 'Heebo', size: 12 } } },
              y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                  font: { family: 'Heebo', size: 11 },
                  callback: (v) => '₪' + Number(v).toLocaleString('he-IL')
                }
              }
            }
          }}
        />
      </div>
    </div>
  )
}
