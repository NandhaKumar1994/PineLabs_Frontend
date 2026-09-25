import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  Download,
  ShieldAlert,
  Archive,
} from 'lucide-react'
import { readSheetFile, serializeCsv, downloadCsv } from '../../utils/csv'

import { REVISION_COLUMNS, REVISION_LABELS } from '../../data/revisions'

const COLUMNS = REVISION_COLUMNS
const LABELS = REVISION_LABELS

// One-time migration of the historical change log from the previous
// SharePoint / Excel process. Imported rows are flagged as migrated so they
// stay distinguishable from entries this application generated itself.
export default function ImportHistoryModal({ onClose, onImport }) {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = useMemo(() => files.flatMap((f) => f.rows), [files])
  // A usable row needs at least the issuer it relates to and what changed.
  const validRows = useMemo(
    () => rows.filter((r) => String(r.issuer || '').trim() && String(r.description || '').trim()),
    [rows]
  )
  const skipped = rows.length - validRows.length

  const addFiles = async (list) => {
    const incoming = Array.from(list || []).filter(Boolean)
    if (!incoming.length) return

    const parsed = await Promise.all(
      incoming.map(async (file) => {
        const entry = { id: `${file.name}-${Date.now()}`, name: file.name, size: file.size, rows: [], error: '' }
        try {
          const { rows: parsedRows, error } = await readSheetFile(file, COLUMNS, LABELS)
          if (error) return { ...entry, error }
          if (!parsedRows.length) return { ...entry, error: 'No data rows found in the file.' }
          return { ...entry, rows: parsedRows }
        } catch {
          return { ...entry, error: 'Could not read that file.' }
        }
      })
    )

    setFiles((prev) => {
      const merged = [...prev]
      parsed.forEach((f) => {
        const idx = merged.findIndex((x) => x.name === f.name)
        if (idx >= 0) merged[idx] = f
        else merged.push(f)
      })
      return merged
    })
  }

  const downloadTemplate = () => {
    const sample = [
      {
        instance: 'North Zone',
        issuer: 'Aurora Retail',
        version: '1',
        date: '24/09/2026',
        revisedBy: 'Girish',
        description: 'Initial SOP baseline published for the issuer.',
        reviewer: 'Chandru',
        ticket: 'HD-123456',
      },
      {
        instance: 'North Zone',
        issuer: 'Aurora Retail',
        version: '1.1',
        date: '24/09/2026',
        revisedBy: 'Girish',
        description: 'Added reason code FRD-01 to the Block sheet.',
        reviewer: 'Chandru',
        ticket: 'PL-123456',
      },
    ]
    downloadCsv('revision-history-template.csv', serializeCsv(COLUMNS, LABELS, sample))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validRows.length || !acknowledged) return
    onImport(
      validRows.map((r, i) => ({
        id: `mig-${Date.now()}-${i}`,
        instance: String(r.instance || '').trim(),
        issuer: String(r.issuer).trim(),
        version: String(r.version || '1').trim(),
        date: String(r.date || '').trim(),
        revisedBy: String(r.revisedBy || '').trim(),
        description: String(r.description).trim(),
        reviewer: String(r.reviewer || '').trim(),
        ticket: String(r.ticket || '').trim(),
        migrated: true,
      }))
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Archive className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Import Historical Log</h2>
              <p className="text-xs text-body">
                One-time migration of the change log from the previous process
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
          <p className="min-w-0 truncate text-xs text-body">
            Expected columns: {COLUMNS.map((c) => LABELS[c]).join(', ')}.
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
          >
            <Download className="h-3.5 w-3.5" />
            Template
          </button>
        </div>

        <div className="nice-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Imported rows are marked <span className="font-semibold">Migrated</span> in the log so
              they remain distinguishable from entries recorded by this application. They cannot be
              edited afterwards.
            </span>
          </p>

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
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 bg-grey-light/60'
            }`}
          >
            <FileSpreadsheet className="mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-heading">
              {files.length ? 'Drop more files here' : 'Drop the historical log file here'}
            </p>
            <p className="mt-0.5 text-xs text-body">.csv, .xlsx — multiple files allowed</p>
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
              accept=".csv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
              {files.map((f) => (
                <li key={f.id} className="flex items-start gap-3 px-3 py-2.5">
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      f.error ? 'bg-red-50 text-red-600' : 'bg-primary/5 text-primary'
                    }`}
                  >
                    {f.error ? <AlertCircle className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-heading">{f.name}</p>
                    <p className="text-xs text-body">
                      {f.error || `${f.rows.length} row${f.rows.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-body transition hover:bg-red-50 hover:text-red-600"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {validRows.length > 0 && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {validRows.length} entr{validRows.length === 1 ? 'y' : 'ies'} ready to import.
              {skipped > 0 && (
                <span className="text-amber-700">
                  {' '}
                  {skipped} row{skipped === 1 ? '' : 's'} skipped (missing Issuer or Description of
                  Changes).
                </span>
              )}
            </div>
          )}

          {validRows.length > 0 && (
            <button
              type="button"
              onClick={() => setAcknowledged((v) => !v)}
              className="flex w-full items-start gap-2.5 rounded-lg border border-gray-200 bg-grey-light/60 px-3 py-2.5 text-left transition hover:bg-grey-light"
            >
              <span
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                  acknowledged ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                }`}
              >
                {acknowledged && <span className="text-[10px] font-bold leading-none">✓</span>}
              </span>
              <span className="text-xs text-body">
                I confirm these entries come from the organisation’s existing records and are being
                migrated for reference only.
              </span>
            </button>
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
            disabled={!validRows.length || !acknowledged}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Import {validRows.length || ''} Entr{validRows.length === 1 ? 'y' : 'ies'}
          </button>
        </div>
      </form>
    </div>
  )
}
