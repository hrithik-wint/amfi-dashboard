import { supabase } from './supabase'

// Returns { [monthKey]: parsedData }
export async function loadAllMonths() {
  const { data, error } = await supabase
    .from('amfi_months')
    .select('month_key, data')
    .order('month_key', { ascending: true })

  if (error) {
    console.error('[store] loadAllMonths failed:', error)
    return {}
  }

  return Object.fromEntries(data.map(row => [row.month_key, row.data]))
}

// Upsert a single month (insert or overwrite if same key)
export async function saveMonth(monthKey, parsedData) {
  const { error } = await supabase
    .from('amfi_months')
    .upsert({ month_key: monthKey, data: parsedData, updated_at: new Date().toISOString() })

  if (error) throw error
}

// monthKey format: "YYYY-MM"
export function monthKeyToLabel(key) {
  if (!key) return ''
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

export function sortedMonthKeys(obj) {
  return Object.keys(obj).sort()
}
