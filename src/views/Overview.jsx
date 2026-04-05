import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import StatCard from '../components/StatCard'
import { monthKeyToLabel, sortedMonthKeys } from '../utils/store'
import { CHART_PALETTE } from '../utils/colors'
import { formatShort, formatShortTick } from '../utils/csvParser'

function getMonthSummary(data) {
  const gt = data?.grandTotal
  return {
    totalAUM:      gt?.netAUM    ?? null,
    totalNetInflow:gt?.netInflow ?? null,
    totalFolios:   gt?.folios    ?? null,
    totalInflow:   gt?.inflow    ?? null,
    totalOutflow:  gt?.outflow   ?? null,
  }
}

function pctChange(curr, prev) {
  if (curr == null || prev == null || prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function shortMonth(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleString('en-IN', { month: 'short' }) + " '" + year.slice(2)
}

const TREND_METRICS = [
  { key: 'totalAUM',       label: 'Net AUM',             currency: true  },
  { key: 'totalInflow',    label: 'Total Invested',       currency: true  },
  { key: 'totalOutflow',   label: 'Redemption',           currency: true  },
  { key: 'totalNetInflow', label: 'Net Inflow / Outflow', currency: true  },
  { key: 'totalFolios',    label: 'No. of Folios',        currency: false },
]

function TrendChart({ data, metricKey, color, currency }) {
  const values = data.map(d => d[metricKey]).filter(v => v != null)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const pad  = (maxV - minV) * 0.08 || Math.abs(maxV) * 0.05 || 1

  return (
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          padding={{ left: 16, right: 16 }}
        />
        <YAxis
          domain={[minV - pad, maxV + pad]}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatShortTick}
          width={42}
        />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="bg-white border border-slate-200 rounded-lg p-2 text-xs shadow-lg">
                <p className="text-slate-500 mb-0.5">{label}</p>
                <p className="text-slate-900 font-semibold">
                  {formatShort(payload[0].value, currency)}
                </p>
              </div>
            ) : null
          }
        />
        <Line
          type="monotone"
          dataKey={metricKey}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function Overview({ allMonths, selectedMonth }) {
  const keys = sortedMonthKeys(allMonths)

  if (!keys.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No data loaded. Upload a CSV to get started.
      </div>
    )
  }

  const current     = allMonths[selectedMonth]
  const prevKey     = keys[keys.indexOf(selectedMonth) - 1]
  const prev        = prevKey ? allMonths[prevKey] : null
  const curr        = getMonthSummary(current)
  const prevSummary = prev ? getMonthSummary(prev) : null

  const chartData = keys.map((k) => ({
    month: shortMonth(k),
    ...Object.fromEntries(TREND_METRICS.map(m => [m.key, getMonthSummary(allMonths[k])[m.key]])),
  }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-slate-900 text-xl font-semibold">
        Industry Overview — {monthKeyToLabel(selectedMonth)}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Industry AUM"
          value={curr.totalAUM}
          change={pctChange(curr.totalAUM, prevSummary?.totalAUM)}
          currency
          highlight
        />
        <StatCard
          label="Net Inflow / Outflow"
          value={curr.totalNetInflow}
          change={pctChange(curr.totalNetInflow, prevSummary?.totalNetInflow)}
          currency
        />
        <StatCard
          label="Total Folios"
          value={curr.totalFolios}
          change={pctChange(curr.totalFolios, prevSummary?.totalFolios)}
        />
      </div>

      {/* Grand Total Trends — 2 per row */}
      <div>
        <h2 className="text-slate-700 font-semibold text-sm mb-3 uppercase tracking-wider">
          Grand Total Trends
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {TREND_METRICS.map((metric, i) => (
            <div
              key={metric.key}
              className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${
                i === TREND_METRICS.length - 1 && TREND_METRICS.length % 2 !== 0 ? 'col-span-2' : ''
              }`}
            >
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">{metric.label}</p>
              {keys.length > 1 ? (
                <TrendChart
                  data={chartData}
                  metricKey={metric.key}
                  color={CHART_PALETTE[i]}
                  currency={metric.currency}
                />
              ) : (
                <div className="h-[130px] flex items-center justify-center text-slate-400 text-xs">
                  Upload more months to see trend
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
