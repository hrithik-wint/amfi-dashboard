export const CATEGORY_COLORS = {
  equity: '#3b82f6',   // blue
  hybrid: '#14b8a6',   // teal
  debt: '#a855f7',     // purple
  others: '#f97316',   // orange
}

export const CHART_PALETTE = [
  '#3b82f6', '#14b8a6', '#a855f7', '#f97316',
  '#ec4899', '#eab308', '#10b981', '#6366f1',
]

export function flowColor(value) {
  if (value === null || value === undefined) return 'text-slate-400'
  return value >= 0 ? 'text-emerald-400' : 'text-red-400'
}

export function flowColorHex(value) {
  if (value === null || value === undefined) return '#94a3b8'
  return value >= 0 ? '#34d399' : '#f87171'
}
