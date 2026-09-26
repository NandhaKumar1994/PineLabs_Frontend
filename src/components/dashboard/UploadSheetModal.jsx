import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, X, FileSpreadsheet, AlertCircle, Eye, Trash2, Download } from 'lucide-react'
import { identityValue, readSheetFile, serializeCsv, downloadCsv } from '../../utils/csv'

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileId = () => `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export default function UploadSheetModal({
  columns,
  labels,
  existingRows,
  identityField = 'issuer',
  entityLabel = 'issuer',
  existingHint,
  newHint,
  sampleName,
  onClose,
  onUpdateExisting,
  onAddNew,
}) {
  const [tab, setTab] = useState('existing')
  const [files, setFiles] = useState([])
  const [showFiles, setShowFiles] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (showFiles) {
        e.stopPropagation()
        setShowFiles(false)
        return
      }
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, showFiles])

  const existingKeys = useMemo(() => {
    const set = new Set()
    existingRows.forEach((row) => {
      const key = identityValue(row, identityField)
      if (key) set.add(key)
    })
    return set
  }, [existingRows, identityField])

  const allRows = useMemo(() => files.flatMap((f) => f.rows), [files])

  const filledRows = useMemo(
    () => allRows.filter((row) => columns.some((col) => String(row[col] || '').trim())),
    [allRows, columns]
  )

  const updateRows = filledRows.filter((row) => identityValue(row, identityField))
  const existingUpdateCount = updateRows.filter((row) =>
    existingKeys.has(identityValue(row, identityField))
  ).length

  const validFiles = files.filter((f) => !f.error && f.rows.length > 0)
  const canApply =
    validFiles.length > 0 &&
    (tab === 'existing'
      ? existingUpdateCount > 0
      : filledRows.length > 0 &&
        filledRows.every((r) => columns.every((c) => String(r[c] || '').trim())))

  const addFiles = async (list) => {
    const incoming = Array.from(list || []).filter(Boolean)
    if (!incoming.length) return

    const next = await Promise.all(
      incoming.map(async (file) => {
        const entry = {
          id: fileId(),
          name: file.name || 'sheet.csv',
          size: file.size || 0,
          rows: [],
          error: '',
        }
        try {
          const { rows: parsed, error: parseError } = await readSheetFile(file, columns, labels)
          if (parseError) return { ...entry, error: parseError }
          if (!parsed.length) return { ...entry, error: 'No data rows found in the file.' }
          return { ...entry, rows: parsed }
        } catch {
          return { ...entry, error: 'Could not read that file.' }
        }
      })
    )

    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      const merged = [...prev]
      next.forEach((file) => {
        const idx = merged.findIndex((f) => f.name === file.name)
        if (idx >= 0) merged[idx] = { ...file, id: merged[idx].id }
        else if (!names.has(file.name)) merged.push(file)
      })
      return merged
    })
  }

  const removeFile = (id) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id)
      if (!next.length) setShowFiles(false)
      return next
    })
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!canApply) return
    if (tab === 'existing') onUpdateExisting(updateRows)
    else onAddNew(filledRows.map((r) => Object.fromEntries(columns.map((c) => [c, String(r[c]).trim()]))))
    onClose()
  }

  // Template carrying the exact header row this sheet expects, plus one
  // example row taken from existing data so the format is unambiguous.
  const downloadTemplate = () => {
    const example = existingRows?.[0]
    const rows = [
      Object.fromEntries(
        columns.map((c) => [c, example ? String(example[c] ?? '') : ''])
      ),
    ]
    downloadCsv(sampleName || 'sample-upload.csv', serializeCsv(columns, labels, rows))
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
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Import Data</h2>
              <p className="text-xs text-body">
                Import one or more files to update existing {entityLabel}s or add new records
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
            Expected columns: {columns.map((c) => labels[c] || c).join(', ')}
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

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="flex rounded-lg bg-grey-light p-1">
            {[
              { id: 'existing', label: 'Update Existing' },
              { id: 'new', label: 'Add New' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  tab === t.id ? 'bg-white text-heading shadow-sm' : 'text-body hover:text-heading'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-body">
            {tab === 'existing'
              ? existingHint ||
                `Existing records are identified by ${entityLabel} name and updated in place.`
              : newHint || 'These rows are inserted at the top of the page.'}
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 bg-grey-light/60'
            }`}
          >
            <FileSpreadsheet className="mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-heading">
              {files.length ? 'Drop more sheets here' : 'Drop CSV or Excel sheets here'}
            </p>
            <p className="mt-0.5 text-xs text-body">.csv, .xlsx — you can select multiple files</p>
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
            <button
              type="button"
              onClick={() => setShowFiles(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-grey-light"
            >
              <Eye className="h-4 w-4 text-body" />
              Review Files
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {files.length}
              </span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-3">
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
            <Upload className="h-4 w-4" />
            {tab === 'existing' ? 'Update Records' : 'Import New Records'}
          </button>
        </div>
      </form>

      {showFiles && (
        <FilesPopup
          files={files}
          entityLabel={entityLabel}
          tab={tab}
          existingKeys={existingKeys}
          identityField={identityField}
          onRemove={removeFile}
          onClose={() => setShowFiles(false)}
        />
      )}
    </div>
  )
}

function FilesPopup({ files, entityLabel, tab, existingKeys, identityField, onRemove, onClose }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-bold text-heading">Selected Files</h3>
            <p className="text-xs text-body">
              {files.length} file{files.length === 1 ? '' : 's'} selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-body transition hover:bg-grey-light"
            aria-label="Close file list"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-gray-50 overflow-auto">
          {files.map((file) => {
            const matchCount = file.rows.filter((row) =>
              existingKeys.has(identityValue(row, identityField))
            ).length
            const detail = file.error
              ? file.error
              : tab === 'existing'
                ? `${matchCount} existing ${entityLabel}${matchCount === 1 ? '' : 's'}`
                : `${file.rows.length} row${file.rows.length === 1 ? '' : 's'}`

            return (
              <li key={file.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    file.error ? 'bg-red-50 text-red-600' : 'bg-primary/5 text-primary'
                  }`}
                >
                  {file.error ? <AlertCircle className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading">{file.name}</p>
                  <p className="text-xs text-body">
                    {formatSize(file.size)} · {detail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-body transition hover:bg-red-50 hover:text-red-600"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
