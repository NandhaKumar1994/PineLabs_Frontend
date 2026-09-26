import { useEffect, useRef, useState } from 'react'
import { Upload, X, FileSpreadsheet, AlertCircle, Download } from 'lucide-react'
import { parseCsv, serializeCsv, downloadCsv } from '../../utils/csv'
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

// Upload values for a single column, matched to rows by a key column.
// Expects a 2-column file: [key, value]. Header row optional.
export default function ColumnUploadModal({
  column,
  keyLabel,
  sampleKeys = [],
  // Optional extra human-readable context column (e.g. Issuer) for the sample.
  contextLabel,
  sampleRows = [], // [{ context, key }]
  onClose,
  onApply,
}) {
  const [file, setFile] = useState(null)
  const [pairs, setPairs] = useState([]) // [{ key, value }]
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
      const clean = (table || [])
        .map((r) => (Array.isArray(r) ? r : []))
        .filter((r) => r.some((v) => String(v ?? '').trim()))
      if (clean.length < 1) {
        setError('The file is empty.')
        setPairs([])
        return
      }
      // Column layout: [context?, key, value]. With a context column the key
      // is at index 1 and value at index 2; otherwise key=0, value=1.
      const hasContext = !!contextLabel
      const keyIdx = hasContext ? 1 : 0
      const valIdx = hasContext ? 2 : 1

      // Detect + skip a header row (if any header cell matches known labels).
      const first = clean[0].map((c) => norm(c))
      const hasHeader =
        first.includes(norm(column)) ||
        first.includes(norm(keyLabel)) ||
        (hasContext && first.includes(norm(contextLabel)))
      const body = hasHeader ? clean.slice(1) : clean

      const parsed = body
        .map((cells) => ({
          key: String(cells[keyIdx] ?? '').trim(),
          value: String(cells[valIdx] ?? '').trim(),
        }))
        .filter((p) => p.key)
      if (!parsed.length) {
        setError(
          hasContext
            ? `Expected columns: ${contextLabel}, ${keyLabel}, then ${column}.`
            : `Expected two columns: ${keyLabel} (to match rows) and ${column}.`
        )
        setPairs([])
        return
      }
      setPairs(parsed)
    } catch {
      setError('Could not read that file.')
      setPairs([])
    }
  }

  const apply = () => {
    const map = new Map(pairs.map((p) => [norm(p.key), p.value]))
    onApply(map)
    onClose()
  }

  // Generic sample template. With a context column (e.g. Issuer) it produces
  // three columns: [context, key, value]; otherwise [key, value].
  const downloadSample = () => {
    const safe = String(column).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'column'
    if (contextLabel) {
      const src = sampleRows.length
        ? sampleRows.slice(0, 3)
        : [{ context: 'Example Issuer', key: 'KEY-1' }]
      const cols = ['context', 'key', 'value']
      const labels = { context: contextLabel, key: keyLabel, value: column }
      const rows = src.map((r) => ({ context: r.context, key: r.key, value: '' }))
      downloadCsv(`sample-${safe}.csv`, serializeCsv(cols, labels, rows))
      return
    }
    const keys = (sampleKeys.length ? sampleKeys : ['KEY-1', 'KEY-2', 'KEY-3']).slice(0, 3)
    const cols = ['key', 'value']
    const labels = { key: keyLabel, value: column }
    const rows = keys.map((k) => ({ key: k, value: '' }))
    downloadCsv(`sample-${safe}.csv`, serializeCsv(cols, labels, rows))
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Upload “{column}” values</h2>
              <p className="text-xs text-body">
                File columns:{' '}
                {contextLabel && (
                  <>
                    <span className="font-semibold text-heading">{contextLabel}</span>,{' '}
                  </>
                )}
                <span className="font-semibold text-heading">{keyLabel}</span> then{' '}
                <span className="font-semibold text-heading">{column}</span>
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
          <p className="text-xs text-body">Not sure of the format? Download a ready template.</p>
          <button
            type="button"
            onClick={downloadSample}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
          >
            <Download className="h-3.5 w-3.5" />
            Download sample
          </button>
        </div>

        <div className="space-y-3 p-5">
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
              Two columns: {keyLabel} to match rows, then the {column} value
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

          {pairs.length > 0 && !error && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {pairs.length} value{pairs.length === 1 ? '' : 's'} ready. Rows matched by{' '}
              {keyLabel} will be updated.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!pairs.length || !!error}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Apply Values
          </button>
        </div>
      </div>
    </div>
  )
}
