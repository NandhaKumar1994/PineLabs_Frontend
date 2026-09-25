import { useEffect, useRef, useState } from 'react'
import { X, FileSpreadsheet, AlertCircle, Download, Search } from 'lucide-react'
import { parseCsv, serializeCsv, downloadCsv } from '../../utils/csv'
import { binSeries, BIN_TYPES, BIN_TYPE_LIST } from '../../data/binSeries'
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

// The upload sheet carries a single column: "Bin+Merchant Prefix", a 9-digit
// value made of the 6-digit BIN followed by the 3-digit Merchant Prefix.
const UPLOAD_COLUMN = 'Bin+Merchant Prefix'
const PREFIX_LENGTH = 9

// Resolve one 9-digit Bin+Merchant Prefix value against both BIN types.
function resolve(raw) {
  const original = String(raw ?? '').trim()
  const digits = original.replace(/\D/g, '')
  const bin = digits.slice(0, 6)
  const prefix = digits.slice(6, 9)

  const base = {
    input: original,
    digits,
    binIin: bin,
    merchantPrefix: prefix,
    matched: false,
    typeKey: '',
    binType: '',
    note: '',
  }

  // Must be exactly 9 digits: 6 (BIN) + 3 (Merchant Prefix).
  if (digits.length !== PREFIX_LENGTH) {
    return {
      ...base,
      note:
        digits.length < PREFIX_LENGTH
          ? `Expected ${PREFIX_LENGTH} digits, got ${digits.length}`
          : `Expected ${PREFIX_LENGTH} digits, got ${digits.length}`,
    }
  }

  const hit = binSeries.find((r) => r.binIin === bin && r.merchantPrefix === prefix)
  if (!hit) return { ...base, note: 'No matching BIN series' }

  // Carry the whole matched record so the results table can show the same
  // columns as the BIN Series landing page.
  return {
    ...base,
    ...hit,
    matched: true,
    typeKey: hit.binType,
    binType: BIN_TYPES[hit.binType]?.label || '',
  }
}

// Read the Bin+Merchant Prefix values out of the uploaded sheet.
// The header row is optional; any cell holding 9 digits is accepted.
function extractPrefixes(table) {
  const clean = (table || [])
    .map((r) => (Array.isArray(r) ? r : []))
    .filter((r) => r.some((v) => String(v ?? '').trim()))
  if (!clean.length) return []

  // Detect the target column from the header, if one is present.
  const first = clean[0].map((c) => norm(c))
  let colIdx = first.findIndex(
    (h) => h.includes('bin') || h.includes('prefix') || h.includes('card')
  )
  // A row whose cells contain no digits is treated as a header row.
  const headerRow = clean[0].every((c) => !/\d/.test(String(c ?? '')))
  const body = colIdx !== -1 || headerRow ? clean.slice(1) : clean
  if (colIdx === -1) colIdx = 0

  const values = []
  body.forEach((cells) => {
    let val = cells[colIdx]
    // Fall back to the first cell that looks like a 9-digit prefix.
    if (String(val ?? '').replace(/\D/g, '').length !== PREFIX_LENGTH) {
      const alt = cells.find((c) => String(c ?? '').replace(/\D/g, '').length === PREFIX_LENGTH)
      if (alt !== undefined) val = alt
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
      const prefixes = extractPrefixes(table)
      if (!prefixes.length) {
        setError(`No values found. The sheet needs a single “${UPLOAD_COLUMN}” column.`)
        setResults([])
        return
      }
      setResults(prefixes.map(resolve))
    } catch {
      setError('Could not read that file.')
      setResults([])
    }
  }

  const matchedCount = results.filter((r) => r.matched).length
  const unresolved = results.filter((r) => !r.matched)

  const downloadSample = () => {
    const cols = ['prefix']
    const labels = { prefix: UPLOAD_COLUMN }
    // 6-digit BIN + 3-digit Merchant Prefix = 9 digits.
    const rows = [
      { prefix: '401288001' },
      { prefix: '552461004' },
      { prefix: '621501101' },
    ]
    downloadCsv('sample-bin-merchant-prefix.csv', serializeCsv(cols, labels, rows))
  }

  // Export uses the union of both types' landing-page columns so a mixed
  // upload produces a single sheet without losing any field.
  const exportResults = () => {
    const union = []
    BIN_TYPE_LIST.forEach((t) => t.columns.forEach((c) => union.includes(c) || union.push(c)))
    const cols = ['input', 'binType', ...union, 'updatedBy', 'note']
    const labels = {
      input: UPLOAD_COLUMN,
      binType: 'BIN Type',
      updatedBy: 'Updated By',
      note: 'Remarks',
    }
    BIN_TYPE_LIST.forEach((t) => Object.assign(labels, t.labels))
    downloadCsv('bin-lookup-results.csv', serializeCsv(cols, labels, results))
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-[96rem] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Bulk Issuer Lookup</h2>
              <p className="text-xs text-body">
                Upload a sheet of Bin+Merchant Prefix values to resolve each Issuer
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
          <p className="text-xs text-body">
            Single column <span className="font-semibold text-heading">{UPLOAD_COLUMN}</span> — 9
            digits (6-digit BIN + 3-digit Merchant Prefix).
          </p>
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
            <p className="mt-0.5 text-xs text-body">
              One or more {UPLOAD_COLUMN} values
            </p>
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
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-md bg-grey-light px-2.5 py-1 text-body">
                {results.length} row{results.length === 1 ? '' : 's'}
              </span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {matchedCount} resolved
              </span>
              {unresolved.length > 0 && (
                <span className="rounded-md bg-red-50 px-2.5 py-1 text-red-600">
                  {unresolved.length} unresolved
                </span>
              )}
            </div>
          )}

          {/* One table per BIN type, using that type's landing-page columns */}
          {!error &&
            BIN_TYPE_LIST.map((t) => {
              const rows = results.filter((r) => r.matched && r.typeKey === t.key)
              if (!rows.length) return null
              const cols = [...t.columns, 'updatedBy']
              const labels = { ...t.labels, updatedBy: 'Updated By' }
              return (
                <div key={t.key} className="space-y-1.5">
                  <p className="flex items-center gap-2 text-xs font-bold text-heading">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {t.label}
                    </span>
                    <span className="font-normal text-body">
                      {rows.length} record{rows.length === 1 ? '' : 's'}
                    </span>
                  </p>
                  <div className="nice-scroll overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-grey-light text-[11px] uppercase tracking-wide text-gray-500">
                        <tr>
                          {cols.map((c) => (
                            <th key={c} className="whitespace-nowrap px-3 py-2 font-semibold">
                              {labels[c]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rows.map((r, i) => (
                          <tr key={i}>
                            {cols.map((c) => (
                              <td
                                key={c}
                                className={`whitespace-nowrap px-3 py-2 ${
                                  c === 'issuer'
                                    ? 'font-semibold text-heading'
                                    : 'text-body'
                                }`}
                              >
                                {String(r[c] ?? '') || <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

          {/* Rows that could not be resolved */}
          {!error && unresolved.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-xs font-bold text-heading">
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  Unresolved
                </span>
                <span className="font-normal text-body">
                  {unresolved.length} row{unresolved.length === 1 ? '' : 's'}
                </span>
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-grey-light text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Uploaded Value</th>
                      <th className="px-3 py-2 font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {unresolved.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-semibold text-heading">{r.input || '—'}</td>
                        <td className="px-3 py-2 text-xs font-medium text-red-500">
                          {r.note || 'No match'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
