import { AIInsight } from '../types'
import './InsightCard.css'

const icons: Record<AIInsight['type'], string> = {
  warning: '⚠️',
  tip: '💡',
  forecast: '📈',
  achievement: '🎯',
}

const colors: Record<AIInsight['type'], string> = {
  warning: 'amber',
  tip: 'blue',
  forecast: 'green',
  achievement: 'green',
}

export default function InsightCard({ insight }: { insight: AIInsight }) {
  const color = colors[insight.type]
  return (
    <div className={`insight-card insight-${color}`}>
      <div className="insight-icon">{icons[insight.type]}</div>
      <div className="insight-body">
        <div className="insight-title">{insight.title}</div>
        <div className="insight-msg">{insight.message}</div>
      </div>
    </div>
  )
}
