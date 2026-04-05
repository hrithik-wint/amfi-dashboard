import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { parseAmfiCsv } from '../utils/csvParser'
import { saveMonth } from '../utils/store'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function UploadModal({ onClose, onDataLoaded }) {
  const [file, setFile] = useState(null)
  const [month, setMonth] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  function handleFile(e) {
    setFile(e.target.files[0])
    setError('')
  }

  async function handleSubmit() {
    if (!file) return setError('Please select a CSV file.')
    if (!month) return setError('Please select a month.')
    if (!year || year < 2000 || year > 2100) return setError('Please enter a valid year.')

    setLoading(true)
    try {
      const text = await file.text()
      const parsed = parseAmfiCsv(text)

      if (!parsed.subcategories.length) {
        setError('No data rows found. Make sure this is a valid AMFI monthly CSV.')
        setLoading(false)
        return
      }

      const monthIndex = MONTHS.indexOf(month) + 1
      const monthKey = `${year}-${String(monthIndex).padStart(2, '0')}`
      await saveMonth(monthKey, parsed)

      console.log('[AMFI] Saved:', monthKey)
      onDataLoaded(monthKey)
      onClose()
    } catch (err) {
      setError('Failed to parse CSV: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-slate-900 font-semibold text-lg">Upload AMFI Monthly CSV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 bg-slate-50 hover:bg-sky-50"
        >
          <Upload className="mx-auto mb-2 text-slate-400" size={28} />
          {file ? (
            <p className="text-slate-900 text-sm font-medium">{file.name}</p>
          ) : (
            <p className="text-slate-400 text-sm">Click to select CSV file</p>
          )}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        <div className="flex gap-3 mb-5">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="flex-1 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          >
            <option value="">Select month</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            placeholder="Year"
            className="w-24 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors"
        >
          {loading ? 'Parsing...' : 'Upload & Parse'}
        </button>
      </div>
    </div>
  )
}
