import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { formatShort, formatFolios } from '../utils/csvParser'

const COLUMNS = [
  { key: 'label',    label: 'Sub-Category',          numeric: false },
  { key: 'schemes',  label: 'Schemes',                numeric: true  },
  { key: 'folios',   label: 'Folios',                 numeric: true  },
  { key: 'inflow',   label: 'Total Invested',         numeric: true, currency: true },
  { key: 'outflow',  label: 'Redemption',             numeric: true, currency: true },
  { key: 'netInflow',label: 'Net Inflow',             numeric: true, currency: true, colored: true },
  { key: 'netAUM',   label: 'Net AUM',                numeric: true, currency: true },
  { key: 'avgAUM',   label: 'Avg AUM',                numeric: true, currency: true },
]

function SortIcon({ active, dir }) {
  if (!active) return <ChevronDown size={12} className="opacity-20" />
  return dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

export default function SortableTable({ rows, highlightLabels = [] }) {
  const [sortKey, setSortKey] = useState('netAUM')
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortKey] ?? (sortKey === 'label' ? '' : -Infinity)
    const vb = b[sortKey] ?? (sortKey === 'label' ? '' : -Infinity)
    if (sortKey === 'label') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return sortDir === 'asc' ? va - vb : vb - va
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-4 py-3 font-medium cursor-pointer select-none text-slate-500 hover:text-sky-600 transition-colors ${
                  col.numeric ? 'text-right' : 'text-left'
                }`}
              >
                <span className={`inline-flex items-center gap-1 ${col.numeric ? 'flex-row-reverse w-full justify-start' : ''}`}>
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const isHighlighted = highlightLabels.some(h =>
              row.label.toLowerCase().includes(h.toLowerCase())
            )
            return (
              <tr
                key={i}
                className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors"
              >
                {COLUMNS.map((col) => {
                  const val = row[col.key]
                  let content

                  if (col.key === 'label') {
                    content = (
                      <span className="text-slate-800">{val}</span>
                    )
                  } else if (col.key === 'folios') {
                    content = <span className="text-slate-700">{formatFolios(val)}</span>
                  } else if (!col.currency) {
                    content = <span className="text-slate-700">{formatShort(val)}</span>
                  } else if (col.colored) {
                    const isPos = val >= 0
                    content = (
                      <span className={isPos ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                        {isPos ? '+' : ''}{formatShort(val, true)}
                      </span>
                    )
                  } else {
                    content = <span className="text-slate-700">{formatShort(val, true)}</span>
                  }

                  return (
                    <td key={col.key} className={`px-4 py-2.5 ${col.numeric ? 'text-right' : ''}`}>
                      {content}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
