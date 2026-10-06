import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, X, FileSpreadsheet, AlertCircle, Eye, Trash2, Download } from 'lucide-react'
import { identityValue, readSheetFile, serializeCsv, downloadCsv } from '../../utils/csv'
import BrandLoader from '../common/BrandLoader'

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
  // --- Server-validated variant (optional) ---------------------------
  // When provided, this is a SINGLE unified upsert-by-name import: the
  // modal still parses the file client-side for the preview/row-count
  // feedback below, but on submit it hands the ORIGINAL File object to
  // this ONE callback instead of calling onUpdateExisting/onAddNew with
  // pre-parsed rows — the backend decides per-row whether each name is
  // an update or a new record (see PineLabs_Backend's
  // instance_service.import_instances), so there is no tab to choose a
  // mode from. Only the first file is sent when multiple are selected
  // (the backend import endpoint accepts one file per call).
  onImportFile,
  onDownloadTemplate,
  // When false, only ONE file may be selected/dropped — the file input
  // drops the `multiple` attribute and any extra dragged/selected files
  // are ignored (the first is kept). Defaults to true to preserve the
  // legacy multi-file behavior for other screens; the Instance import
  // sets this false since the server endpoint takes exactly one file.
  multiple = true,
  // Server-validated path: the caller (e.g. InstanceManagement.jsx) owns
  // the async import call and its result, so it passes the outcome back
  // in here rather than this modal guessing at it:
  //   submitError    - the backend's error message to show INSIDE this
  //                    modal (its own error banner in the parent screen
  //                    sits BEHIND this modal's fixed overlay and is
  //                    invisible while the modal is open).
  //   submitting     - true while the import request is in flight, to
  //                    disable the button and avoid a double-submit.
  submitError,
  submitting,
}) {
  const useServerImport = Boolean(onImportFile)
  // The Update Existing / Add New tab choice only applies to the legacy
  // client-side flow (onUpdateExisting/onAddNew) — the server-validated
  // single-import flow has no tabs at all, so `tab` stays fixed.
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
  // Server-validated path: the backend is the single source of truth for
  // row-level validation (required columns, blank/NA cells, duplicates,
  // existing-vs-new name checks) — see PineLabs_Backend's
  // instance_service.import_instances. The frontend must NOT silently
  // gate submission on those same rules ahead of time, since doing so
  // just disables the button with no explanation. The only client-side
  // requirement here is "at least one file was selected and parsed
  // without a read error" (a corrupt/unreadable file); everything else
  // is left for the backend's error response to explain.
  const canApply = useServerImport
    ? validFiles.length > 0
    : validFiles.length > 0 &&
      (tab === 'existing'
        ? existingUpdateCount > 0
        : filledRows.length > 0 &&
          filledRows.every((r) => columns.every((c) => String(r[c] || '').trim())))

  const addFiles = async (list) => {
    let incoming = Array.from(list || []).filter(Boolean)
    if (!incoming.length) return
    // Single-file mode: keep only the first file dropped/selected and
    // discard the rest, so the selection can never exceed one file.
    if (!multiple) incoming = incoming.slice(0, 1)

    const next = await Promise.all(
      incoming.map(async (file) => {
        const entry = {
          id: fileId(),
          name: file.name || 'sheet.csv',
          size: file.size || 0,
          rows: [],
          error: '',
          file,
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
      // Single-file mode: a new file REPLACES whatever was selected.
      if (!multiple) return next.slice(0, 1)
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
    if (useServerImport) {
      // Server-validated path: hand the ORIGINAL file to the backend
      // import endpoint, which does its own authoritative parsing,
      // upsert-by-name logic, and all-or-nothing validation. Only the
      // first selected file is sent.
      const rawFile = validFiles[0]?.file
      if (!rawFile) return
      onImportFile(rawFile)
      // NOTE: onClose() is intentionally NOT called here — the caller
      // (e.g. InstanceManagement.jsx) closes the modal itself once the
      // async import call resolves, so a failed import leaves this
      // modal open with the files still selected.
      return
    }
    if (tab === 'existing') onUpdateExisting(updateRows)
    else onAddNew(filledRows.map((r) => Object.fromEntries(columns.map((c) => [c, String(r[c]).trim()]))))
    onClose()
  }

  // Template carrying ONLY the exact header row this sheet expects — no
  // example/data rows, so the downloaded file is a clean, empty template.
  // When a server-provided template is available (onDownloadTemplate),
  // that is preferred since it's the backend's authoritative format.
  const downloadTemplate = () => {
    if (onDownloadTemplate) {
      onDownloadTemplate()
      return
    }
    downloadCsv(sampleName || 'sample-upload.csv', serializeCsv(columns, labels, []))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* While an import is in flight, cover the modal with the branded
            circular loader so the user sees progress and can't re-submit
            or edit the selection mid-upload. */}
        {submitting && <BrandLoader label="Importing records…" />}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Import Data</h2>
              <p className="text-xs text-body">
                {useServerImport
                  ? `Existing ${entityLabel}s are updated by name; new names are added`
                  : `Import one or more files to update existing ${entityLabel}s or add new records`}
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

        {/* Error banner pinned to the TOP (shrink-0, above the scrollable
            body). `submitError` may be a plain string OR a structured
            { message, rows } — for the latter we show a compact summary
            line plus the per-row breakdown in its OWN scrollable, capped
            box so hundreds of row errors never blow out the modal. */}
        {submitError && (
          <div className="shrink-0 border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 font-semibold">
                {typeof submitError === 'string' ? submitError : submitError.message}
              </span>
            </div>
            {typeof submitError !== 'string' && submitError.rows?.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-red-100 bg-white/60">
                <ul className="divide-y divide-red-50">
                  {submitError.rows.map((row, i) => (
                    <li key={i} className="px-3 py-1.5 leading-snug text-red-600">
                      {row}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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
          {!useServerImport && (
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
          )}

          <p className="text-xs text-body">
            {useServerImport
              ? existingHint ||
                `Rows matching an existing ${entityLabel} by name are updated in place; rows with a new name are added.`
              : tab === 'existing'
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
              {multiple
                ? files.length
                  ? 'Drop more sheets here'
                  : 'Drop CSV or Excel sheets here'
                : files.length
                  ? 'Drop another file to replace'
                  : 'Drop a CSV or Excel file here'}
            </p>
            <p className="mt-0.5 text-xs text-body">
              {multiple ? '.csv, .xlsx — you can select multiple files' : '.csv, .xlsx — a single file'}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {multiple ? (files.length ? 'Add files' : 'Choose files') : files.length ? 'Replace file' : 'Choose file'}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
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
            disabled={!canApply || submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {submitting
              ? 'Importing…'
              : useServerImport
                ? 'Import Records'
                : tab === 'existing'
                  ? 'Update Records'
                  : 'Import New Records'}
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
          useServerImport={useServerImport}
          onRemove={removeFile}
          onClose={() => setShowFiles(false)}
        />
      )}
    </div>
  )
}

function FilesPopup({ files, entityLabel, tab, existingKeys, identityField, useServerImport, onRemove, onClose }) {
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
              : useServerImport
                ? `${file.rows.length} row${file.rows.length === 1 ? '' : 's'} (${matchCount} match existing)`
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
