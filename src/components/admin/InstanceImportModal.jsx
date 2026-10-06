import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

/**
 * Dedicated MULTI-FILE Instance import modal, backed by the background
 * job API (POST /instances/import/jobs -> poll GET .../{jobId} -> GET
 * .../{jobId}/errors). Two phases in one modal:
 *
 *   1. SELECT  — drop/choose many .csv/.xlsx files, review/remove the
 *      list, download the template, then submit. Files are NOT parsed
 *      client-side: the backend is the single source of truth for
 *      headers/rows/validation, so we only collect the raw File objects.
 *   2. RUNNING/DONE — a "Run status" panel (Run ID / Status / Stage +
 *      staged step rows + progress bar) polled ~every second, plus a
 *      per-file / per-sheet breakdown and the structured
 *      {file, sheet, row, messages[]} error list with a downloadable
 *      report. The modal STAYS OPEN on completion; the user closes it.
 *
 * ATOMICITY (surfaced in the UI): each SHEET is all-or-nothing. A sheet
 * with any error is skipped (nothing written for it) while the clean
 * sheets in the same file still import — see the per-sheet status chips.
 *
 * Props:
 *   onSubmit(files)      -> Promise<{ jobId, status, totalFiles }>
 *   onPoll(jobId)        -> Promise<progress>  (files/sheets tree + counters)
 *   onFetchErrors(jobId) -> Promise<{ errors: [...] }>
 *   onDownloadTemplate() (optional)
 *   onClose()
 *   onFinished()         (optional) fired once the job reaches a terminal
 *                        state so the parent can refresh its table.
 */

const TERMINAL = new Set(['completed', 'failed', 'completed_with_errors'])
const POLL_MS = 1000
const ACCEPT =
  '.csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Human duration from milliseconds: "820 ms", "3.4 s", "1 m 12 s".
const formatDuration = (ms) => {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms} ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)} s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return `${m} m ${rem} s`
}

const fileKey = () => `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const isSupported = (name = '') => /\.(csv|xlsx|xls|txt)$/i.test(name)

// Rows IMPORTED for a file/sheet node, as opposed to rows the backend
// merely READ/validated (its `processedRows`). Imports are atomic per
// sheet: a failed sheet writes NOTHING, so even though all its rows were
// read, 0 landed. Showing the raw `processedRows` (e.g. "500/500") next
// to a "Failed" chip reads as "all 500 imported", which is wrong — this
// returns 0 for a failed node so the UI can show "0/500".
//   failed                 -> 0 (nothing committed)
//   completed              -> all rows
//   processing / w-errors  -> backend's processedRows (best estimate)
const importedRows = (node = {}) => {
  if (node.status === 'failed') return 0
  if (node.status === 'completed') return node.totalRows ?? node.processedRows ?? 0
  return node.processedRows ?? 0
}

// Status -> chip styling + icon, reused at job/file/sheet levels. Colors
// come from the app theme tokens (primary + amber/emerald/red accents).
const STATUS_META = {
  queued: { label: 'Waiting', cls: 'bg-gray-100 text-gray-500', Icon: Clock },
  processing: { label: 'Processing', cls: 'bg-primary/10 text-primary', Icon: Loader2, spin: true },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
  failed: { label: 'Failed', cls: 'bg-red-50 text-red-600', Icon: AlertCircle },
  completed_with_errors: {
    label: 'Completed with errors',
    cls: 'bg-amber-50 text-amber-700',
    Icon: AlertCircle,
  },
}

// Human-readable STAGE label shown in the Run status header, derived from
// the job's current state (mirrors the "Analyzing template structure…"
// stage text in the reference UI, but for the import pipeline).
function stageLabel(progress) {
  if (!progress) return 'Preparing…'
  const s = progress.status
  if (s === 'queued') return 'Queued — waiting to start'
  if (s === 'completed') return 'All files imported successfully'
  if (s === 'failed') return 'Finished — no records imported'
  if (s === 'completed_with_errors') return 'Finished with some skipped sheets'
  // processing
  if ((progress.totalRows || 0) === 0) return 'Reading & validating files…'
  return `Validating & importing rows (${progress.processedRows}/${progress.totalRows})`
}

function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META.queued
  const { Icon } = meta
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}
    >
      <Icon className={`h-3 w-3 ${meta.spin ? 'animate-spin' : ''}`} />
      {meta.label}
    </span>
  )
}

const TONE_BAR = {
  error: 'bg-red-500',
  warn: 'bg-amber-500',
  done: 'bg-emerald-500',
  primary: 'bg-primary',
}
function ProgressBar({ value, tone = 'primary', className = '' }) {
  const pct = Math.max(0, Math.min(100, value || 0))
  const bar = TONE_BAR[tone] || TONE_BAR.primary
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-grey-light ${className}`}>
      <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// Format-Agent-style stage row: a soft tinted pill with a filled check
// circle (done), a spinner (active), or a dashed outline circle (pending).
// `state` is 'done' | 'active' | 'pending'.
function StageItem({ label, state }) {
  const pill =
    state === 'done'
      ? 'bg-primary/[0.05] text-primary'
      : state === 'active'
        ? 'bg-primary/[0.07] text-primary font-semibold'
        : 'text-gray-400'
  return (
    <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] ${pill}`}>
      {state === 'done' ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
      ) : state === 'active' ? (
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-primary" />
      ) : (
        <span className="grid h-4 w-4 shrink-0 place-items-center">
          <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-dashed border-gray-300" />
        </span>
      )}
      <span>{label}</span>
    </div>
  )
}

export default function InstanceImportModal({
  onSubmit,
  onPoll,
  onFetchErrors,
  onDownloadTemplate,
  onClose,
  onFinished,
}) {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [jobId, setJobId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(null)
  // Run-status card collapse (matches the Format Agent card UX).
  const [statusOpen, setStatusOpen] = useState(true)
  const [errors, setErrors] = useState([])
  const [errorsLoading, setErrorsLoading] = useState(false)
  const [expanded, setExpanded] = useState({})

  const inputRef = useRef(null)
  const pollRef = useRef(null)
  const finishedRef = useRef(false)
  const errorsFetchedRef = useRef(false)

  const phase = jobId ? 'running' : 'select'
  const status = progress?.status
  const isTerminal = status ? TERMINAL.has(status) : false

  // Esc closes — but never mid-flight while actively submitting the
  // upload (avoid abandoning an in-progress POST).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  // POLL loop — advances progress until the job is terminal. It does NOT
  // fetch errors itself; that's a separate effect below, so flipping
  // `isTerminal` (which cancels this effect) can never race with / drop
  // the error fetch — the bug that previously left errors invisible.
  useEffect(() => {
    if (!jobId || isTerminal) return
    let cancelled = false

    const tick = async () => {
      try {
        const p = await onPoll(jobId)
        if (!cancelled) setProgress(p)
      } catch {
        /* transient poll failure — retry next tick */
      }
      if (!cancelled) pollRef.current = setTimeout(tick, POLL_MS)
    }

    pollRef.current = setTimeout(tick, POLL_MS)
    return () => {
      cancelled = true
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [jobId, isTerminal, onPoll])

  // ERROR fetch — runs exactly once when the job first becomes terminal.
  // Independent of the poll effect so it can't be cancelled mid-flight.
  useEffect(() => {
    if (!jobId || !isTerminal || errorsFetchedRef.current) return
    errorsFetchedRef.current = true
    let cancelled = false
    setErrorsLoading(true)
    ;(async () => {
      try {
        const res = await onFetchErrors(jobId)
        if (!cancelled) setErrors(res?.errors || [])
      } catch {
        /* best-effort; counters already convey the failure */
      } finally {
        if (!cancelled) setErrorsLoading(false)
        if (!finishedRef.current) {
          finishedRef.current = true
          onFinished?.()
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [jobId, isTerminal, onFetchErrors, onFinished])

  const addFiles = (list) => {
    const incoming = Array.from(list || []).filter(Boolean)
    if (!incoming.length) return
    setSubmitError('')
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      const merged = [...prev]
      for (const file of incoming) {
        const name = file.name || 'sheet'
        const entry = { id: fileKey(), name, size: file.size || 0, file, unsupported: !isSupported(name) }
        const idx = merged.findIndex((f) => f.name === name)
        if (idx >= 0) merged[idx] = { ...entry, id: merged[idx].id }
        else if (!names.has(name)) merged.push(entry)
      }
      return merged
    })
  }

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const validFiles = useMemo(() => files.filter((f) => !f.unsupported), [files])
  const hasUnsupported = files.some((f) => f.unsupported)
  const canSubmit = validFiles.length > 0 && !hasUnsupported && !submitting

  const submit = async (e) => {
    e?.preventDefault?.()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await onSubmit(validFiles.map((f) => f.file))
      setJobId(res.jobId)
      setProgress({
        jobId: res.jobId,
        status: res.status || 'queued',
        progress: 0,
        totalFiles: res.totalFiles || validFiles.length,
        processedFiles: 0,
        totalSheets: 0,
        processedSheets: 0,
        totalRows: 0,
        processedRows: 0,
        createdRows: 0,
        updatedRows: 0,
        failedRows: 0,
        files: [],
      })
    } catch (err) {
      setSubmitError(err?.message || 'Could not start the import.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalErrorCount = useMemo(
    () => errors.reduce((n, e) => n + (e.messages?.length || 1), 0),
    [errors]
  )

  const downloadErrorReport = () => {
    const esc = (v) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = ['File', 'Sheet', 'Row', 'Error'].join(',')
    const lines = errors.flatMap((e) =>
      (e.messages || []).map((m) => [esc(e.file), esc(e.sheet ?? ''), esc(e.row ?? ''), esc(m)].join(','))
    )
    const csv = [header, ...lines].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-errors-job-${jobId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const overallTone = isTerminal
    ? status === 'completed'
      ? 'done'
      : status === 'failed'
        ? 'error'
        : 'warn'
    : 'primary'

  // The file currently being worked on — spotlighted in its own "Current
  // file" card (matching the reference layout). Prefer the one the worker
  // marked 'processing'; while queued/finishing fall back to the first
  // not-yet-finished file so the card never blinks empty mid-run.
  const currentFile = useMemo(() => {
    const fs = progress?.files || []
    return (
      fs.find((f) => f.status === 'processing') ||
      (isTerminal ? null : fs.find((f) => f.status === 'queued')) ||
      null
    )
  }, [progress, isTerminal])

  // Overall roll-ups shown in the counter tiles. The backend's
  // processedRows/processedSheets count what was READ, but imports are
  // atomic per sheet — a failed sheet lands NOTHING. So the "Rows" and
  // "Sheets" tiles report what actually IMPORTED, derived from the
  // per-sheet statuses, so a run with one failed 500-row sheet reads
  // "4500/5000 rows" and "29/30 sheets" instead of the misleading
  // "5000/5000" / "30/30".
  const rollup = useMemo(() => {
    const files = progress?.files || []
    const sheets = files.flatMap((f) => f.sheets || [])
    const hasSheetTree = sheets.length > 0
    const importedRowTotal = hasSheetTree
      ? sheets.reduce((n, s) => n + importedRows(s), 0)
      : files.reduce((n, f) => n + importedRows(f), 0)
    const importedSheetTotal = hasSheetTree
      ? sheets.filter((s) => s.status === 'completed').length
      : null
    return { importedRowTotal, importedSheetTotal, hasSheetTree }
  }, [progress])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={submitting ? undefined : onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Import Instances</h2>
              <p className="text-xs text-body">
                {phase === 'select'
                  ? 'Upload one or more .csv / .xlsx files — each sheet is imported independently'
                  : 'Existing instances update by name; new names are added. Clean sheets import even if others fail.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 place-items-center rounded-lg text-body transition hover:bg-grey-light disabled:opacity-40"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ============================ SELECT PHASE ============================ */}
        {phase === 'select' && (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-grey-light/50 px-5 py-2.5">
              <p className="min-w-0 truncate text-xs text-body">
                Each file may contain multiple sheets; every sheet is validated on its own.
              </p>
              {onDownloadTemplate && (
                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Template
                </button>
              )}
            </div>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {submitError && (
                  <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {submitError}
                  </p>
                )}

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
                  <FileSpreadsheet className="mb-2 h-7 w-7 text-primary" />
                  <p className="text-sm font-semibold text-heading">
                    {files.length ? 'Drop more files here' : 'Drop CSV or Excel files here'}
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
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </div>

                {files.length > 0 && (
                  <div className="rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
                      <p className="text-xs font-semibold text-heading">
                        {files.length} file{files.length === 1 ? '' : 's'} selected
                      </p>
                      {hasUnsupported && (
                        <span className="text-[11px] font-medium text-red-600">
                          Remove unsupported files to continue
                        </span>
                      )}
                    </div>
                    <ul className="max-h-56 divide-y divide-gray-50 overflow-auto">
                      {files.map((f) => (
                        <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                              f.unsupported ? 'bg-red-50 text-red-600' : 'bg-primary/5 text-primary'
                            }`}
                          >
                            {f.unsupported ? <AlertCircle className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-heading">{f.name}</p>
                            <p className="text-xs text-body">
                              {formatSize(f.size)}
                              {f.unsupported && ' · unsupported type (use .csv or .xlsx)'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(f.id)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-body transition hover:bg-red-50 hover:text-red-600"
                            title="Remove file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
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
                  disabled={!canSubmit}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {submitting ? 'Starting…' : `Import ${validFiles.length || ''} File${validFiles.length === 1 ? '' : 's'}`.trim()}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ============================ RUNNING / DONE PHASE ============================ */}
        {phase === 'running' && progress && (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {/* ---- Run status card (Format Agent-style collapsible) ---- */}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {/* Clickable header: icon + title + "{pct}% {stage}" + chevron */}
                <button
                  type="button"
                  onClick={() => setStatusOpen((v) => !v)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-grey-light/50"
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                      isTerminal
                        ? overallTone === 'done'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          : overallTone === 'error'
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-amber-200 bg-amber-50 text-amber-600'
                        : 'border-primary/20 bg-primary/5 text-primary'
                    }`}
                  >
                    {isTerminal ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-heading">Import status</span>
                      <StatusChip status={progress.status} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-body">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {isTerminal ? 'Total time' : 'Elapsed'} {formatDuration(progress.elapsedMs)}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {statusOpen && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3.5">
                    {/* Counter tiles — two rows of three so wide values
                        (e.g. 15000/15000) show in full without truncation */}
                    <div className="mb-3.5 grid grid-cols-3 overflow-hidden rounded-lg border border-gray-200 [&>*]:border-gray-100 [&>*:not(:nth-child(3n))]:border-r [&>*:nth-child(n+4)]:border-t">
                      {[
                        { label: 'Files', value: `${progress.processedFiles}/${progress.totalFiles}`, cls: 'text-heading' },
                        {
                          label: 'Sheets',
                          value: `${rollup.importedSheetTotal ?? progress.processedSheets}/${progress.totalSheets}`,
                          cls: 'text-heading',
                        },
                        {
                          label: 'Rows',
                          value: `${rollup.hasSheetTree ? rollup.importedRowTotal : progress.processedRows}/${progress.totalRows}`,
                          cls: 'text-heading',
                        },
                        { label: 'Created', value: progress.createdRows, cls: 'text-emerald-600' },
                        { label: 'Updated', value: progress.updatedRows, cls: 'text-primary' },
                        { label: 'Errors', value: progress.failedRows, cls: progress.failedRows > 0 ? 'text-red-600' : 'text-gray-400' },
                      ].map((t) => (
                        <div key={t.label} className="px-3 py-2.5 text-center">
                          <p className={`text-sm font-bold leading-tight tabular-nums ${t.cls}`}>
                            {t.value}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400">
                            {t.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar row */}
                    <div className="mb-3.5 flex items-center gap-2.5">
                      <span className="min-w-[60px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-gray-400">
                        Progress
                      </span>
                      <ProgressBar value={progress.progress} tone={overallTone} className="flex-1" />
                      <span className="min-w-[34px] text-right text-xs font-bold text-primary">
                        {progress.progress || 0}%
                      </span>
                    </div>

                    {/* Stage list */}
                    <div className="flex flex-col gap-1">
                      <StageItem label="Files uploaded" state="done" />
                      <StageItem
                        label={isTerminal ? 'Rows validated & imported' : 'Validating & importing rows'}
                        state={isTerminal ? 'done' : 'active'}
                      />
                      {isTerminal ? (
                        <StageItem label="Import complete" state="done" />
                      ) : (
                        <StageItem label="Awaiting completion…" state="pending" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ---- Current file spotlight (the file being processed) ---- */}
              {currentFile && (
                <div className="overflow-hidden rounded-xl border border-primary/30 bg-primary/[0.03]">
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileSpreadsheet className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                        Current file
                      </p>
                      <p className="truncate text-sm font-semibold text-heading">{currentFile.fileName}</p>
                    </div>
                    <StatusChip status={currentFile.status} />
                  </div>
                  <div className="px-4 pb-3">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-body">
                      <span>
                        Sheet {currentFile.processedSheets}
                        {currentFile.totalSheets ? ` / ${currentFile.totalSheets}` : ''}
                      </span>
                      <span className="font-bold text-primary">{currentFile.progress || 0}%</span>
                    </div>
                    <ProgressBar value={currentFile.progress} tone="primary" />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-body">
                      <span>
                        {importedRows(currentFile)} / {currentFile.totalRows} rows
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {formatDuration(currentFile.elapsedMs)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Per-file / per-sheet breakdown ---- */}
              {(progress.files || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Files</p>
                  {(progress.files || []).map((f) => {
                    const open = expanded[f.id]
                    const tone =
                      f.status === 'failed'
                        ? 'error'
                        : f.status === 'completed_with_errors'
                          ? 'warn'
                          : f.status === 'completed'
                            ? 'done'
                            : 'primary'
                    return (
                      <div key={f.id} className="rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [f.id]: !e[f.id] }))}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                        >
                          {(f.sheets || []).length > 0 ? (
                            open ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-body" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-body" />
                            )
                          ) : (
                            <span className="w-4 shrink-0" />
                          )}
                          <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-heading">{f.fileName}</p>
                              <StatusChip status={f.status} />
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex-1">
                                <ProgressBar value={f.progress} tone={tone} />
                              </div>
                              <span className="shrink-0 text-[11px] text-body">
                                {(f.sheets || []).length
                                  ? (f.sheets || []).reduce((n, s) => n + importedRows(s), 0)
                                  : importedRows(f)}
                                /{f.totalRows} rows
                              </span>
                              {f.elapsedMs != null && (
                                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-body">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  {formatDuration(f.elapsedMs)}
                                </span>
                              )}
                            </div>
                            {f.errorCount > 0 && (
                              <p className="mt-1 text-[11px] font-medium text-amber-600">
                                {f.errorCount} issue{f.errorCount === 1 ? '' : 's'} · sheets with errors were skipped
                              </p>
                            )}
                          </div>
                        </button>

                        {open && (f.sheets || []).length > 0 && (
                          <ul className="border-t border-gray-100 px-4 py-2">
                            {f.sheets.map((s) => (
                              <li key={s.id} className="flex items-center gap-2 py-1">
                                <span className="min-w-0 flex-1 truncate text-xs text-body">
                                  {s.sheetName || '(single sheet)'}
                                </span>
                                <span className="shrink-0 text-[11px] text-body">
                                  {importedRows(s)}/{s.totalRows}
                                </span>
                                {s.errorCount > 0 && (
                                  <span className="shrink-0 text-[11px] font-medium text-red-600">
                                    {s.errorCount} err
                                  </span>
                                )}
                                <StatusChip status={s.status} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ---- Structured error list ---- */}
              {errorsLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs text-body">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading error details…
                </div>
              )}

              {!errorsLoading && errors.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40">
                  <div className="flex items-center justify-between border-b border-amber-100 px-4 py-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      {totalErrorCount} issue{totalErrorCount === 1 ? '' : 's'} across{' '}
                      {errors.length} location{errors.length === 1 ? '' : 's'}
                    </p>
                    <button
                      type="button"
                      onClick={downloadErrorReport}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
                    >
                      <Download className="h-3 w-3" />
                      Download report
                    </button>
                  </div>
                  <ul className="max-h-56 divide-y divide-amber-100/70 overflow-auto">
                    {errors.map((e, i) => (
                      <li key={i} className="px-4 py-2 text-xs leading-snug">
                        <span className="font-semibold text-heading">
                          {e.file}
                          {e.sheet ? <span className="text-body"> › {e.sheet}</span> : ''}
                          {e.row != null ? <span className="text-body"> › row {e.row}</span> : ''}
                        </span>
                        <ul className="ml-3 mt-0.5 list-disc text-red-600">
                          {(e.messages || []).map((m, j) => (
                            <li key={j}>{m}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clean finish, no errors */}
              {isTerminal && !errorsLoading && errors.length === 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  All rows imported with no errors.
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-3">
              <p className="text-xs text-body">
                {isTerminal
                  ? 'Import finished. You can close this window.'
                  : 'Runs in the background — you can leave this open to watch progress.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90"
              >
                {isTerminal ? 'Done' : 'Close'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
