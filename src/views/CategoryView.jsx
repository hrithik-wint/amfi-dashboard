import { useState, useEffect, useRef } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { ChevronDown, Check, LayoutList } from 'lucide-react'
import SortableTable from '../components/SortableTable'
import { monthKeyToLabel, sortedMonthKeys } from '../utils/store'
import { CHART_PALETTE } from '../utils/colors'
import { formatShort, formatFolios, formatShortTick } from '../utils/csvParser'

const METRICS = [
  { key: 'netAUM',    label: 'Net AUM',             currency: true,  folios: false },
  { key: 'inflow',    label: 'Total Invested',       currency: true,  folios: false },
  { key: 'outflow',   label: 'Redemption',           currency: true,  folios: false },
  { key: 'netInflow', label: 'Net Inflow / Outflow', currency: true,  folios: false },
  { key: 'folios',    label: 'No. of Folios',        currency: false, folios: true  },
  { key: 'avgAUM',    label: 'Avg AUM',              currency: true,  folios: false },
  { key: 'schemes',   label: 'No. of Schemes',       currency: false, folios: false },
]

// Sentinel value for "show category total"
const ALL_FUNDS = '__ALL__'

function shortMonth(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleString('en-IN', { month: 'short' }) + " '" + year.slice(2)
}

function categoryLabel(category) {
  const map = { equity: 'Equity', hybrid: 'Hybrid', debt: 'Debt', solution: 'Solution Oriented', others: 'Others' }
  return map[category] ?? category
}

// Multi-select dropdown for funds
function FundSelector({ allFunds, selected, onChange, colorMap, category }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isAllMode = selected.has(ALL_FUNDS)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(fund) {
    const next = new Set(selected)
    next.delete(ALL_FUNDS)
    next.has(fund) ? next.delete(fund) : next.add(fund)
    if (next.size === 0) next.add(ALL_FUNDS) // fallback
    onChange(next)
  }

  function selectAllFunds() {
    onChange(new Set([ALL_FUNDS]))
    setOpen(false)
  }

  const label = isAllMode
    ? `All ${categoryLabel(category)} (total)`
    : `${selected.size} fund${selected.size !== 1 ? 's' : ''} selected`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm bg-white border border-slate-200 hover:border-sky-400 rounded-lg px-3 py-2 text-slate-700 shadow-sm transition-colors min-w-[200px]"
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-72 max-h-80 overflow-y-auto">
          {/* All Funds option */}
          <button
            onClick={selectAllFunds}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 transition-colors ${
              isAllMode ? 'bg-sky-50' : 'hover:bg-sky-50'
            }`}
          >
            <LayoutList size={14} className="text-sky-500 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-sky-700 text-left">
              All {categoryLabel(category)} (total)
            </span>
            {isAllMode && <Check size={13} className="text-sky-500 flex-shrink-0" />}
          </button>

          {/* Individual funds */}
          <div className="py-1">
            {allFunds.map((fund) => (
              <button
                key={fund}
                onClick={() => toggle(fund)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sky-50 text-left transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: colorMap[fund] || '#94a3b8' }}
                />
                <span className="flex-1 text-sm text-slate-700 truncate" title={fund}>{fund}</span>
                {!isAllMode && selected.has(fund) && <Check size={13} className="text-sky-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, formatValue }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-xl max-w-xs">
      <p className="text-slate-500 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-700 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="truncate flex-1 text-xs" title={p.name}>
            {p.name === ALL_FUNDS ? 'Category Total' : p.name}
          </span>
          <span className="font-semibold text-slate-900 text-xs">
            {formatValue(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function CategoryView({
  category,
  allMonths,
  selectedMonth,
  highlightLabels = [],
}) {
  const keys = sortedMonthKeys(allMonths)

  const currentRows = allMonths[selectedMonth]?.subcategories?.filter(r => r.category === category) ?? []

  // All unique fund labels across all uploaded months for this category
  const allFundLabels = Array.from(
    new Set(
      keys.flatMap(k =>
        (allMonths[k]?.subcategories ?? [])
          .filter(r => r.category === category)
          .map(r => r.label)
      )
    )
  )

  const colorMap = Object.fromEntries(
    allFundLabels.map((f, i) => [f, CHART_PALETTE[i % CHART_PALETTE.length]])
  )

  const [selectedMetric, setSelectedMetric] = useState('netAUM')
  // Default: show all funds (category total)
  const [selectedFunds, setSelectedFunds] = useState(new Set([ALL_FUNDS]))

  // Reset when switching category tab
  useEffect(() => {
    setSelectedFunds(new Set([ALL_FUNDS]))
    setSelectedMetric('netAUM')
  }, [category])

  const metric     = METRICS.find(m => m.key === selectedMetric) ?? METRICS[0]
  const isAllMode  = selectedFunds.has(ALL_FUNDS)
  const TOTAL_LINE = `${categoryLabel(category)} Total`

  // Build chart data
  const chartData = keys.map(k => {
    const monthRows = allMonths[k]?.subcategories?.filter(r => r.category === category) ?? []
    const point = { month: shortMonth(k) }

    if (isAllMode) {
      const subtotal = allMonths[k]?.subtotals?.[category]
      point[ALL_FUNDS] = subtotal?.[selectedMetric] ?? null
    } else {
      for (const fund of allFundLabels) {
        if (selectedFunds.has(fund)) {
          const match = monthRows.find(r => r.label === fund)
          point[fund] = match?.[selectedMetric] ?? null
        }
      }
    }
    return point
  })

  // Y-axis auto domain
  const visibleValues = isAllMode
    ? chartData.map(d => d[ALL_FUNDS]).filter(v => v != null)
    : chartData.flatMap(d =>
        allFundLabels.filter(f => selectedFunds.has(f)).map(f => d[f]).filter(v => v != null)
      )

  const minV  = visibleValues.length ? Math.min(...visibleValues) : 0
  const maxV  = visibleValues.length ? Math.max(...visibleValues) : 1
  const pad   = (maxV - minV) * 0.08 || Math.abs(maxV) * 0.05 || 1
  const yDomain = [minV - pad, maxV + pad]

  const activeKeys = isAllMode ? [ALL_FUNDS] : allFundLabels.filter(f => selectedFunds.has(f))

  if (!keys.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No data loaded. Upload a CSV to get started.
      </div>
    )
  }

  const formatValue = metric.folios
    ? formatFolios
    : (v) => formatShort(v, metric.currency)

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-slate-900 text-lg sm:text-xl font-semibold">
          {categoryLabel(category)} Funds
          <span className="text-slate-400 font-normal text-sm sm:text-base ml-2">
            — {monthKeyToLabel(selectedMonth)}
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs text-slate-500 font-medium">Show:</span>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            className="text-xs sm:text-sm bg-white border border-slate-200 hover:border-sky-400 rounded-lg px-2 sm:px-3 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 transition-colors"
          >
            {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <FundSelector
            allFunds={allFundLabels}
            selected={selectedFunds}
            onChange={setSelectedFunds}
            colorMap={colorMap}
            category={category}
          />
        </div>
      </div>

      {/* Hero trend chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-4">
          {metric.label} — Monthly Trend
          {metric.currency && <span className="ml-1 normal-case text-slate-400">(₹ Crore)</span>}
        </p>
        {activeKeys.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Select at least one fund to view the trend
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatShortTick}
                width={48}
              />
              <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                formatter={(value) => {
                  const display = value === ALL_FUNDS ? TOTAL_LINE : value
                  return (
                    <span className="text-slate-600" title={display}>
                      {display.length > 35 ? display.slice(0, 35) + '…' : display}
                    </span>
                  )
                }}
              />
              {activeKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key === ALL_FUNDS ? TOTAL_LINE : key}
                  stroke={key === ALL_FUNDS ? '#0ea5e9' : colorMap[key]}
                  strokeWidth={key === ALL_FUNDS ? 2.5 : 2}
                  dot={{ r: 3, fill: key === ALL_FUNDS ? '#0ea5e9' : colorMap[key], strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table for selected month */}
      <div>
        <h2 className="text-slate-700 font-semibold text-sm mb-3 uppercase tracking-wider">
          {monthKeyToLabel(selectedMonth)} — All Sub-Categories
        </h2>
        <SortableTable rows={currentRows} highlightLabels={highlightLabels} />
      </div>
    </div>
  )
}
