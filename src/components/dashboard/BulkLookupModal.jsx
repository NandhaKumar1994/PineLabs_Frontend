import { useEffect, useRef, useState } from 'react'
import { X, FileSpreadsheet, AlertCircle, Download, Search } from 'lucide-react'
import { parseCsv, serializeCsv, downloadCsv } from '../../utils/csv'
import { binSeries } from '../../data/binSeries'
import * as XLSX from 'xlsx'

async function readTable(file) {
  const name = file?.name || ''
  if (/\.xlsx?$/i.test(name) || /sheet|excel/i.test(file?.type || '')) {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array', cellDates: false })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return []
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
  }
  const text = await file.text()
  return parseCsv(text)
}

const norm = (v) => String(v ?? '').trim().toLowerCase()

// Resolve a single raw card value → issuer match using the 9-digit rule.
function resolve(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  const bin = digits.slice(0, 6)
  const prefix = digits.slice(6, 9)
  const input = digits.length > 6 ? `${bin} ${prefix}` : bin
  if (digits.length < 6) {
    return { input: String(raw ?? '').trim(), bin, prefix, issuer: '', program: '', binSeriesNo: '' }
  }
  const candidates = binSeries.filter((r) => r.binIin === bin)
  let hit = null
  if (candidates.length) {
    if (prefix.length === 3) hit = candidates.find((r) => r.merchantPrefix === prefix) || null
    else if (candidates.length === 1) hit = candidates[0]
  }
  return {
    input,
    bin,
    prefix,
    issuer: hit?.issuer || '',
    program: hit?.cardProgramGroupName || '',
    binSeriesNo: hit ? `${hit.binIin}${hit.merchantPrefix}` : '',
  }
}

// Pull card-number-like values from an arbitrary uploaded table.
function extractCards(table) {
  const clean = (table || [])
    .map((r) => (Array.isArray(r) ? r : []))
    .filter((r) => r.some((v) => String(v ?? '').trim()))
  if (!clean.length) return []

  // Find a "card" column if the first row looks like a header.
  const first = clean[0].map((c) => norm(c))
  const cardIdx = first.findIndex((h) => h.includes('card') || h.includes('number') || h.includes('bin'))
  const hasHeader = cardIdx !== -1 || first.some((h) => h && !/\d/.test(h))
  const body = hasHeader ? clean.slice(1) : clean

  const values = []
  body.forEach((cells) => {
    // Prefer the detected card column; otherwise take the first cell with 6+ digits.
    let val = cardIdx !== -1 ? cells[cardIdx] : ''
    if (!String(val ?? '').replace(/\D/g, '')) {
      val = cells.find((c) => String(c ?? '').replace(/\D/g, '').length >= 6) ?? cells[0]
    }
    if (String(val ?? '').trim()) values.push(String(val).trim())
  })
  return values
}

export default function BulkLookupModal({ onClose }) {
  const [file, setFile] = useState(null)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleFile = async (f) => {
    if (!f) return
    setFile({ name: f.name, size: f.size })
    setError('')
    try {
      const table = await readTable(f)
      const cards = extractCards(table)
      if (!cards.length) {
        setError('No card numbers found in the file.')
        setResults([])
        return
      }
      setResults(cards.map(resolve))
    } catch {
      setError('Could not read that file.')
      setResults([])
    }
  }

  const downloadSample = () => {
    const cols = ['card']
    const labels = { card: 'Card Number' }
    const rows = [{ card: '401288001' }, { card: '552461004' }, { card: '340000002' }]
    downloadCsv('sample-card-numbers.csv', serializeCsv(cols, labels, rows))
  }

  const exportResults = () => {
    const cols = ['input', 'binSeriesNo', 'issuer', 'program']
    const labels = {
      input: 'Card Number',
      binSeriesNo: 'BIN Series Number',
      issuer: 'Issuer',
      program: 'Card Program',
    }
    downloadCsv('bin-lookup-results.csv', serializeCsv(cols, labels, results))
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Bulk Issuer Lookup</h2>
              <p className="text-xs text-body">
                Upload a sheet of card numbers to resolve their BIN Series &amp; Issuer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-body transition hover:bg-grey-light"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-grey-light/50 px-5 py-2.5">
          <p className="text-xs text-body">One column of card numbers. Need a template?</p>
          <button
            type="button"
            onClick={downloadSample}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
          >
            <Download className="h-3.5 w-3.5" />
            Download sample
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto nice-scroll p-5">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFile(e.dataTransfer.files?.[0])
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 bg-grey-light/60'
            }`}
          >
            <FileSpreadsheet className="mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-heading">
              {file ? file.name : 'Drop a CSV or Excel file'}
            </p>
            <p className="mt-0.5 text-xs text-body">Contains one or more card numbers</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {file ? 'Choose another' : 'Choose file'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          {results.length > 0 && !error && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-grey-light text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Card Number</th>
                    <th className="px-3 py-2 font-semibold">BIN Series Number</th>
                    <th className="px-3 py-2 font-semibold">Issuer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-3 py-2 font-semibold tracking-wide text-heading">{r.input || '—'}</td>
                      <td className="px-3 py-2 font-medium text-body">{r.binSeriesNo || '—'}</td>
                      <td className="px-3 py-2">
                        {r.issuer ? (
                          <span className="font-semibold text-heading">{r.issuer}</span>
                        ) : (
                          <span className="text-gray-400">No match</span>
                        )}
                        {r.program && <span className="block text-[11px] text-body">{r.program}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            Close
          </button>
          <button
            type="button"
            onClick={exportResults}
            disabled={!results.length}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export Results
          </button>
        </div>
      </div>
    </div>
  )
}
