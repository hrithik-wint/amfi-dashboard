import { Upload } from 'lucide-react'
import { monthKeyToLabel, sortedMonthKeys } from '../utils/store'

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'equity',    label: 'Equity' },
  { id: 'hybrid',    label: 'Hybrid' },
  { id: 'debt',      label: 'Debt' },
  { id: 'solution',  label: 'Solution' },
  { id: 'others',    label: 'Others' },
]

export default function Navbar({ activeTab, onTabChange, allMonths, selectedMonth, onMonthChange, onAddMonth }) {
  const monthKeys = sortedMonthKeys(allMonths)

  return (
    <nav className="bg-white border-b border-slate-200 px-6 flex items-center justify-between h-14 sticky top-0 z-50 shadow-sm">
      {/* Left: logo + tabs */}
      <div className="flex items-center gap-6">
        <span className="text-sky-600 font-bold text-lg tracking-tight whitespace-nowrap">
          AMFI Fund Tracker
        </span>
        <div className="flex gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: add month + loaded count + selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAddMonth}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Upload size={13} /> Add Month
        </button>
        {monthKeys.length > 0 && (
          <>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {monthKeys.length} month{monthKeys.length !== 1 ? 's' : ''} loaded
            </span>
            <select
              value={selectedMonth || ''}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 shadow-sm"
            >
              {monthKeys.map((k) => (
                <option key={k} value={k}>{monthKeyToLabel(k)}</option>
              ))}
            </select>
          </>
        )}
      </div>
    </nav>
  )
}
