import Papa from 'papaparse'

// Col mapping (0-indexed):
//   0: Sr  |  1: Scheme Name  |  2: Schemes  |  3: Folios
//   4: Inflow  |  5: Outflow  |  6: Net Inflow  |  7: Net AUM  |  8: Avg AUM

const CATEGORY_MAP = [
  { key: 'debt',     pattern: /income|debt/i },
  { key: 'equity',   pattern: /growth|equity/i },
  { key: 'hybrid',   pattern: /hybrid/i },
  { key: 'solution', pattern: /solution/i },
  { key: 'others',   pattern: /other scheme/i },
]

const UPPERCASE_ROMAN = /^(I{1,3}|IV|VI{0,3}|IX|XI{0,3}|XIV|XV|XVI|V)$/
const LOWERCASE_ROMAN = /^(i{1,3}|iv|vi{0,3}|ix|xi{0,3}|xiv|xv|xvi|v)$/
const SECTION_HEADER  = /^[A-C]$/

export function parseIndianNumber(val) {
  if (val === null || val === undefined) return null
  const str = String(val).replace(/,/g, '').trim()
  if (str === '' || str === '-' || str === 'NA' || str === '##') return null
  const n = parseFloat(str)
  return isNaN(n) ? null : n
}

// Short Indian notation: ≥1L → L | ≥1K → K | <1K → 0.XXK (for currency always K minimum)
// currency=true adds ₹ prefix and " Cr" suffix (values are already in crore)
export function formatShort(num, currency = false) {
  if (num === null || num === undefined || isNaN(num)) return '—'
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  const pre  = currency ? '₹' : ''
  const suf  = currency ? ' Cr' : ''

  if (abs >= 100000) {
    return sign + pre + (abs / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L' + suf
  }
  // Currency amounts always use K (so 650 Cr → 0.65K Cr)
  if (currency || abs >= 1000) {
    return sign + pre + (abs / 1000).toFixed(2).replace(/\.?0+$/, '') + 'K' + suf
  }
  return sign + pre + abs.toFixed(0) + suf
}

// Compact tick label for Y-axis (no ₹ / Cr, just the magnitude)
export function formatShortTick(num) {
  if (num === null || num === undefined || isNaN(num)) return ''
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 100000) return sign + (abs / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  if (abs >= 1000)   return sign + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return sign + abs.toFixed(0)
}

// Legacy full Indian format (still used in table cells)
export function formatIndianNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '—'
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  const fixed = abs.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  let result = intPart
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3)
    const rest  = intPart.slice(0, -3)
    const groups = []
    for (let i = rest.length; i > 0; i -= 2) groups.unshift(rest.slice(Math.max(0, i - 2), i))
    result = groups.join(',') + ',' + last3
  }
  return sign + result + (decPart !== undefined ? '.' + decPart : '')
}

function parseRowData(row, category) {
  return {
    label:     String(row[1] ?? '').trim(),
    category,
    schemes:   parseIndianNumber(row[2]),
    folios:    parseIndianNumber(row[3]),
    inflow:    parseIndianNumber(row[4]),
    outflow:   parseIndianNumber(row[5]),
    netInflow: parseIndianNumber(row[6]),
    netAUM:    parseIndianNumber(row[7]),
    avgAUM:    parseIndianNumber(row[8]),
  }
}

export function parseAmfiCsv(csvText) {
  const { data: rawRows } = Papa.parse(csvText, {
    skipEmptyLines: false,
    header: false,
  })

  const subcategories = []
  const subtotals     = {}
  let grandTotal      = null
  let currentCategory = null
  let inSectionA      = false  // only process open-ended (section A)

  for (const row of rawRows) {
    const sr   = String(row[0] ?? '').trim()
    const name = String(row[1] ?? '').trim()

    if (!sr && !name) continue

    // Section header: A = open-ended (process), B/C = skip
    if (SECTION_HEADER.test(sr)) {
      inSectionA = (sr === 'A')
      continue
    }

    // Once we leave section A, only collect grand total
    if (!inSectionA) {
      if (/grand.?total/i.test(name)) {
        grandTotal = parseRowData(row, 'total')
      }
      continue
    }

    // Total A summary row — skip
    if (/^total\s+[A-C]/i.test(name)) continue

    // Category header: uppercase Roman numeral, no numeric data
    if (UPPERCASE_ROMAN.test(sr) && !String(row[2] ?? '').trim()) {
      const match = CATEGORY_MAP.find(({ pattern }) => pattern.test(name))
      if (match) currentCategory = match.key
      continue
    }

    // Subtotal row
    if (!sr && /sub.?total/i.test(name) && currentCategory) {
      subtotals[currentCategory] = parseRowData(row, currentCategory)
      continue
    }

    // Data row: lowercase Roman numeral
    if (LOWERCASE_ROMAN.test(sr) && currentCategory) {
      const parsed = parseRowData(row, currentCategory)
      if (parsed.label) subcategories.push(parsed)
    }
  }

  return { subcategories, subtotals, grandTotal }
}
