import { useEffect, useRef, useState } from 'react'
import { UploadCloud, X, FileSpreadsheet, AlertCircle, Trash2 } from 'lucide-react'
import { parseCsv } from '../../utils/csv'
import * as XLSX from 'xlsx'

const fileId = () => `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// Read a file into a raw table (array of arrays).
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

// Turn a raw table into a { columns, rows } sheet payload.
function tableToSheet(table) {
  const clean = (table || [])
    .map((r) => (Array.isArray(r) ? r : []))
    .filter((r) => r.some((v) => String(v ?? '').trim()))
  if (clean.length < 2) return null
  const columns = clean[0].map((h) => String(h ?? '').trim()).filter(Boolean)
  if (!columns.length) return null
  const rows = clean.slice(1).map((cells) => {
    const row = {}
    columns.forEach((col, i) => {
      row[col] = String(cells[i] ?? '').trim()
    })
    return row
  })
  return { columns, rows }
}

// Build an SOP subsheet object from a file's base name + parsed table.
function buildSheet(name, parsed) {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sheet'
  return {
    key,
    name,
    groups: [{ group: name, columns: parsed.columns }],
    rows: parsed.rows,
  }
}

export default function MerchantImportModal({ merchant, onClose, onImport }) {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const addFiles = async (list) => {
    const incoming = Array.from(list || []).filter(Boolean)
    if (!incoming.length) return
    const next = await Promise.all(
      incoming.map(async (file) => {
        const base = (file.name || 'sheet').replace(/\.[^.]+$/, '')
        const entry = { id: fileId(), name: file.name || 'sheet.csv', sheetName: base, size: file.size || 0, error: '', parsed: null }
        try {
          const table = await readTable(file)
          const parsed = tableToSheet(table)
          if (!parsed) return { ...entry, error: 'Need a header row and at least one data row.' }
          return { ...entry, parsed }
        } catch {
          return { ...entry, error: 'Could not read that file.' }
        }
      })
    )
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...next.filter((f) => !names.has(f.name))]
    })
  }

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const validFiles = files.filter((f) => !f.error && f.parsed)
  const canApply = validFiles.length > 0

  const submit = (e) => {
    e.preventDefault()
    if (!canApply) return
    const sheets = validFiles.map((f) => buildSheet(f.sheetName, f.parsed))
    onImport(sheets)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Import SOP Data</h2>
              <p className="text-xs text-body">
                Upload sheet(s) for {merchant.name}. Each file becomes an SOP tab.
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

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              addFiles(e.dataTransfer.files)
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 bg-grey-light/60'
            }`}
          >
            <FileSpreadsheet className="mb-2 h-8 w-8 text-primary" />
            <p className="text-sm font-semibold text-heading">
              {files.length ? 'Drop more sheets here' : 'Drop CSV or Excel sheets here'}
            </p>
            <p className="mt-0.5 text-xs text-body">.csv, .xlsx — one file per SOP tab</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {files.length ? 'Add files' : 'Choose files'}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="divide-y divide-gray-50 rounded-lg border border-gray-200">
              {files.map((file) => (
                <li key={file.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      file.error ? 'bg-red-50 text-red-600' : 'bg-primary/5 text-primary'
                    }`}
                  >
                    {file.error ? <AlertCircle className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-heading">{file.sheetName}</p>
                    <p className="text-xs text-body">
                      {file.error || `${file.parsed.columns.length} columns · ${file.parsed.rows.length} rows`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-body transition hover:bg-red-50 hover:text-red-600"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
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
            type="submit"
            disabled={!canApply}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            Import {validFiles.length > 0 ? `${validFiles.length} sheet${validFiles.length === 1 ? '' : 's'}` : 'Data'}
          </button>
        </div>
      </form>
    </div>
  )
}
