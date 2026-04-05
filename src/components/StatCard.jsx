import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatShort } from '../utils/csvParser'

export default function StatCard({ label, value, change, currency = false, highlight = false, formatter }) {
  const display = formatter ? formatter(value) : formatShort(value, currency)
  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <div className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm border ${
      highlight ? 'border-sky-300 ring-1 ring-sky-100' : 'border-slate-200'
    }`}>
      <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mb-2 ${
        currency && value < 0 ? 'text-red-500' : 'text-slate-900'
      }`}>
        {display}
      </p>
      {change !== null && change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400'
        }`}>
          {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : <Minus size={14} />}
          {isPositive ? '+' : ''}{change.toFixed(2)}%
          <span className="text-slate-400 font-normal ml-1 hidden sm:inline">vs last month</span>
        </div>
      )}
    </div>
  )
}
