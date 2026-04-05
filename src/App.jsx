import { useState, useCallback, useEffect } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import Navbar from './components/Navbar'
import UploadModal from './components/UploadModal'
import Overview from './views/Overview'
import CategoryView from './views/CategoryView'
import { loadAllMonths, sortedMonthKeys } from './utils/store'
import { CATEGORY_COLORS } from './utils/colors'
import './index.css'

const EQUITY_HIGHLIGHT   = ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap']
const HYBRID_HIGHLIGHT   = ['Balanced Advantage', 'Arbitrage', 'Aggressive Hybrid']
const DEBT_HIGHLIGHT     = ['Liquid Fund', 'Short Duration']
const OTHERS_HIGHLIGHT   = ['Index Fund', 'Gold ETF']
const SOLUTION_HIGHLIGHT = ['Retirement', 'Children']

function useMonthData() {
  const [allMonths, setAllMonths]       = useState({})
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    loadAllMonths()
      .then(months => {
        setAllMonths(months)
        const keys = sortedMonthKeys(months)
        setSelectedMonth(keys[keys.length - 1] ?? null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const refresh = useCallback(async (newMonthKey) => {
    const updated = await loadAllMonths()
    setAllMonths(updated)
    setSelectedMonth(newMonthKey ?? sortedMonthKeys(updated).slice(-1)[0] ?? null)
  }, [])

  return { allMonths, selectedMonth, setSelectedMonth, refresh, loading, error }
}

export default function App() {
  const [activeTab, setActiveTab]   = useState('overview')
  const [showUpload, setShowUpload] = useState(false)
  const { allMonths, selectedMonth, setSelectedMonth, refresh, loading, error } = useMonthData()

  const hasData = Object.keys(allMonths).length > 0

  function renderView() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96 gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading data…</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">Failed to load data: {error}</p>
        </div>
      )
    }

    if (!hasData || !selectedMonth) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-slate-400 text-lg">No data loaded yet.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Upload size={16} /> Upload AMFI CSV
          </button>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return <Overview allMonths={allMonths} selectedMonth={selectedMonth} />
      case 'equity':
        return (
          <CategoryView
            category="equity"
            allMonths={allMonths}
            selectedMonth={selectedMonth}
            highlightLabels={EQUITY_HIGHLIGHT}
            color={CATEGORY_COLORS.equity}
          />
        )
      case 'hybrid':
        return (
          <CategoryView
            category="hybrid"
            allMonths={allMonths}
            selectedMonth={selectedMonth}
            highlightLabels={HYBRID_HIGHLIGHT}
            color={CATEGORY_COLORS.hybrid}
          />
        )
      case 'debt':
        return (
          <CategoryView
            category="debt"
            allMonths={allMonths}
            selectedMonth={selectedMonth}
            highlightLabels={DEBT_HIGHLIGHT}
            color={CATEGORY_COLORS.debt}
          />
        )
      case 'others':
        return (
          <CategoryView
            category="others"
            allMonths={allMonths}
            selectedMonth={selectedMonth}
            highlightLabels={OTHERS_HIGHLIGHT}
            color={CATEGORY_COLORS.others}
          />
        )
      case 'solution':
        return (
          <CategoryView
            category="solution"
            allMonths={allMonths}
            selectedMonth={selectedMonth}
            highlightLabels={SOLUTION_HIGHLIGHT}
            color="#f59e0b"
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        allMonths={allMonths}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onAddMonth={() => setShowUpload(true)}
      />

      <main className="max-w-screen-xl mx-auto">{renderView()}</main>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDataLoaded={(key) => refresh(key)}
        />
      )}
    </div>
  )
}
