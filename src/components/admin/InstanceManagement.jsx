import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Layers,
  Building2,
  Download,
  Power,
  PowerOff,
  Upload,
  AlertCircle,
} from 'lucide-react'
import { Columns3, Trash2 } from 'lucide-react'
import { instanceService, instanceColumnService } from '../../services'
import { splitDateTime } from '../../data/users'
import { useDebounce } from '../../hooks/useDebounce'
import Pagination from '../common/Pagination'
import EditableCell from '../common/EditableCell'
import EditableHeader from '../common/EditableHeader'
import Select from '../common/Select'
import RowActionsMenu from '../dashboard/RowActionsMenu'
import { useRole } from '../../theme/RoleContext'
import InstanceFormModal from './InstanceFormModal'
import DeleteInstanceModal from './DeleteInstanceModal'
import InstanceColumnModal from './InstanceColumnModal'
import DeleteColumnModal from './DeleteColumnModal'
import BrandLoader from '../common/BrandLoader'
import InstanceImportModal from './InstanceImportModal'
import TicketCaptureModal from '../common/TicketCaptureModal'
import StatusConfirmModal from '../sop/StatusConfirmModal'

const statusTint = {
  Active: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-gray-100 text-gray-500',
}

const FIELD_LABELS = { name: 'Instance', ticketNumber: 'Ticket Number' }
const PAGE_SIZE = 12

// The "Instance" column is pinned as the permanent FIRST column: it is
// frozen to the left edge on horizontal scroll and cannot be dragged or
// have another column dropped before it. Every other column (the rest of
// the built-ins + all custom columns) is freely reorderable in the middle;
// the trailing actions column is pinned to the right, outside `layout`.
const PINNED_FIRST_KEY = 'name'

// Fixed per-column width so adding custom columns never shrinks the
// existing ones — the table grows wider and scrolls horizontally instead.
const COL_WIDTH = 'w-48 min-w-48'
const FIRST_COL_WIDTH = 'w-56 min-w-56'

// Fixed built-in headers, in order. NOT renameable — the import/export
// contract keys off these exact names. Custom columns (fetched from the
// backend) are inserted before the "Updated By" + actions columns.
const FIXED_LEADING = ['Instance', 'Ticket Number', 'Issuers', 'Status']

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function InstanceManagement() {
  const { perms } = useRole()

  const [data, setData] = useState([])
  const [stats, setStats] = useState({ totalInstances: 0, activeInstances: 0, issuersGrouped: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  // Inline cell edit awaiting a ticket number.
  const [pendingCell, setPendingCell] = useState(null)
  // Instance pending an activate / deactivate confirmation.
  const [statusTarget, setStatusTarget] = useState(null)
  // Surfaced while a write is in flight (create/update/delete). NOT used
  // for write actions (create/update/delete). The multi-file import has
  // its OWN self-contained error surface inside InstanceImportModal (it
  // owns the job lifecycle), so no import-specific state lives here now.
  const [actionError, setActionError] = useState('')
  // True while a CSV export is being generated/downloaded — drives a
  // full-screen branded loader (export is a toolbar action, not a modal).
  const [exporting, setExporting] = useState(false)
  // Custom column DEFINITIONS (for the create/edit modals + Add Column's
  // existing-labels check). The TABLE order comes from `layout` below.
  const [columns, setColumns] = useState([])
  // The full merged, ordered table layout (built-ins + custom
  // interleaved) from GET /instances/columns/layout. Each entry:
  // { key, label, builtin, id?, type?, required?, options? }.
  const [layout, setLayout] = useState([])
  const [showAddColumn, setShowAddColumn] = useState(false)
  // Custom column pending a delete confirmation (styled modal, not a
  // native window.confirm).
  const [deleteColumnTarget, setDeleteColumnTarget] = useState(null)
  // Column actions awaiting a ticket-number capture (option B: captured
  // in the UI, not yet persisted). pendingColumnAdd holds the create
  // payload; pendingColumnRename holds { columnId, label, before }.
  const [pendingColumnAdd, setPendingColumnAdd] = useState(null)
  const [pendingColumnRename, setPendingColumnRename] = useState(null)

  const debounced = useDebounce(query, 200)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await instanceService.list({
        page,
        pageSize: PAGE_SIZE,
        search: debounced.trim() || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
      })
      setData(res.items)
      setTotal(res.total)
    } catch (err) {
      setError(err?.message || 'Could not load instances.')
    } finally {
      setLoading(false)
    }
  }, [page, debounced, statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      setStats(await instanceService.getStats())
    } catch {
      // Stats cards are a nice-to-have; a failure here shouldn't block the table.
    }
  }, [])

  // One round-trip fetches BOTH the custom column definitions (for the
  // create form, required markers, import/export mapping) and the full
  // merged, ordered table layout (built-ins + custom interleaved) the
  // table renders from — see instanceColumnService.get().
  const fetchColumns = useCallback(async () => {
    try {
      const { definitions, layout } = await instanceColumnService.get()
      setColumns(definitions)
      setLayout(layout)
    } catch {
      // Custom columns are additive; a failure here shouldn't blank the
      // table — the row cells still render off whatever layout we had.
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchColumns()
  }, [fetchColumns])

  // Search/status changes should land back on page 1, same UX as the
  // previous client-side filtering.
  useEffect(() => {
    setPage(1)
  }, [debounced, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, total)

  const names = useMemo(() => data.map((i) => i.name), [data])

  const refreshAfterWrite = () => {
    fetchList()
    fetchStats()
  }

  // Returns true on success, false on failure — callers use this to
  // decide whether to close their modal. A failed write (including a
  // rejected import) must LEAVE the modal open with the error visible,
  // not silently close as if it had succeeded.
  const runAction = async (fn) => {
    setActionError('')
    try {
      await fn()
      refreshAfterWrite()
      return true
    } catch (err) {
      // Import failures carry a per-row breakdown in err.details.errors
      // (see PineLabs_Backend's ValidationError / instance_service.import_instances).
      const rowErrors = err?.details?.errors
      setActionError(rowErrors ? `${err.message}\n${rowErrors.join('\n')}` : err?.message || 'Something went wrong.')
      return false
    }
  }

  // Returns the ok boolean so the modal can await it, show its branded
  // loader while the request is in flight, and only close on success.
  const addInstance = async ({ ticket, name, status, customFields }) => {
    // Create does NOT capture Revised By / Reviewer.
    const ok = await runAction(() =>
      instanceService.create({ name, status, ticketNumber: ticket, customFields })
    )
    if (ok) setShowCreate(false)
    return ok
  }

  const saveEdit = async ({ name, status, ticket, revisedBy, reviewer, customFields }) => {
    if (!editTarget) return false
    const ok = await runAction(() =>
      instanceService.update(editTarget.id, {
        name,
        status,
        ticketNumber: ticket,
        revisedBy,
        reviewer,
        customFields,
      })
    )
    if (ok) setEditTarget(null)
    return ok
  }

  // Inline edits are staged until the ticket-capture modal confirms.
  // We stash the instance's name + existing ticket so the modal can show
  // the right read-only context (see the TicketCaptureModal usage below).
  const saveField = (id, field, value) => {
    const target = data.find((i) => i.id === id)
    if (!target) return
    const before = String(target[field] ?? '')
    if (before === String(value)) return
    setPendingCell({
      id,
      field,
      value,
      before,
      label: FIELD_LABELS[field] || field,
      instanceName: target.name,
      existingTicket: target.ticketNumber || '',
      revisedBy: target.revisedBy || '',
      reviewer: target.reviewer || '',
    })
  }

  // Inline edit of a CUSTOM column cell — same ticket-captured flow, but
  // the commit writes customFields[key] instead of a built-in field.
  const saveCustomField = (inst, col, value) => {
    const before = String(inst.customFields?.[col.key] ?? '')
    if (before === String(value)) return
    setPendingCell({
      id: inst.id,
      customKey: col.key,
      value,
      before,
      label: col.label,
      instanceName: inst.name,
      existingTicket: inst.ticketNumber || '',
      revisedBy: inst.revisedBy || '',
      reviewer: inst.reviewer || '',
    })
  }

  // Commit the staged inline edit once the ticket is supplied. Handles
  // both built-in fields (field) and custom columns (customKey).
  //
  // On failure this THROWS so the TicketCaptureModal shows the error
  // INLINE (e.g. a datatype mismatch like "'Total Count' must be a
  // number") and stays open — rather than closing and dropping the error
  // into the page-level banner behind it. On success we refresh and close
  // the modal.
  const commitCell = async (ticketRef, reviewers = {}) => {
    if (!pendingCell) return
    const { id, field, customKey, value } = pendingCell
    const { revisedBy, reviewer } = reviewers
    const audit = { ticketNumber: ticketRef, revisedBy, reviewer }
    const body = customKey
      ? { customFields: { [customKey]: value }, ...audit }
      : { [field]: value, ...audit }
    setActionError('')
    await instanceService.update(id, body) // throws on failure -> caught by the modal
    refreshAfterWrite()
    setPendingCell(null)
  }

  const toggleStatus = (inst) => setStatusTarget(inst)

  const confirmStatus = async (ticketRef, reviewers = {}) => {
    if (!statusTarget) return
    const next = (statusTarget.status || 'Active') === 'Active' ? 'Inactive' : 'Active'
    const ok = await runAction(() =>
      instanceService.update(statusTarget.id, {
        status: next,
        ticketNumber: ticketRef,
        revisedBy: reviewers.revisedBy,
        reviewer: reviewers.reviewer,
      })
    )
    if (ok) setStatusTarget(null)
  }

  // Multi-file background import (InstanceImportModal). The modal owns the
  // submit -> poll -> errors lifecycle; these three thin handlers just
  // bridge to instanceService. submitImportJob returns { jobId, status,
  // totalFiles } immediately (the import runs server-side in the
  // background); the modal polls getImportJob(jobId) for the live
  // files->sheets progress tree and getImportJobErrors(jobId) for the
  // structured {file, sheet, row, messages[]} failures. onFinished fires
  // once the job reaches a terminal state so the table/stats refresh to
  // reflect whatever committed (per-file atomic: good files land even if
  // another file failed).
  const submitImportJob = (files) => instanceService.submitImportJob(files)
  const pollImportJob = (jobId) => instanceService.getImportJob(jobId)
  const fetchImportErrors = (jobId) => instanceService.getImportJobErrors(jobId)

  const confirmDelete = async (ticket, reviewers = {}) => {
    if (!deleteTarget) return
    // ticket + revised by + reviewer persist server-side in the
    // instance_deletions audit table.
    const ok = await runAction(() =>
      instanceService.remove(deleteTarget.id, {
        ticketNumber: ticket,
        revisedBy: reviewers.revisedBy,
        reviewer: reviewers.reviewer,
      })
    )
    if (ok) setDeleteTarget(null)
  }

  const exportCsv = async () => {
    setActionError('')
    setExporting(true)
    try {
      const blob = await instanceService.export({
        search: debounced.trim() || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
      })
      downloadBlob(blob, 'instances.csv')
    } catch (err) {
      setActionError(err?.message || 'Could not export instances.')
    } finally {
      setExporting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      downloadBlob(await instanceService.getImportTemplate(), 'instances_import_template.csv')
    } catch {
      // best-effort; the modal also has its own client-side template fallback
    }
  }

  // --- Custom column management -------------------------------------
  // Column actions (add / rename) capture a ticket number first, the same
  // way instance edits do. For now the ticket is captured in the UI only
  // and NOT sent to the backend (the column endpoints don't record it
  // yet — that's a later step); the capture still gates the action so the
  // flow matches the rest of the screen.
  //
  // addColumn (called by the Add Column modal on submit) stages the
  // create payload and opens the ticket modal instead of creating
  // immediately. The Add Column modal closes; performColumnAdd runs once
  // the ticket is confirmed.
  const addColumn = async (payload) => {
    setPendingColumnAdd(payload)
    setShowAddColumn(false)
  }

  const performColumnAdd = async (ticketRef, reviewers = {}) => {
    if (!pendingColumnAdd) return
    setActionError('')
    // Throw on failure so the ticket modal shows the error inline and
    // stays open; refresh + close only on success. The audit trail
    // (ticket + revised by + reviewer) is persisted on the column row.
    await instanceColumnService.create({
      ...pendingColumnAdd,
      ticketNumber: ticketRef,
      revisedBy: reviewers.revisedBy,
      reviewer: reviewers.reviewer,
    })
    await fetchColumns()
    await fetchList()
    setPendingColumnAdd(null)
  }

  // Rename (from the inline header editor) also captures a ticket first.
  const renameColumn = (columnId, nextLabel) => {
    const col = columns.find((c) => c.id === columnId)
    setPendingColumnRename({ columnId, label: nextLabel, before: col?.label || '' })
  }

  const performColumnRename = async (ticketRef, reviewers = {}) => {
    if (!pendingColumnRename) return
    setActionError('')
    // Throw on failure so the ticket modal shows the error inline and
    // stays open; refresh + close only on success. The audit trail is
    // persisted on the column row alongside the new label.
    await instanceColumnService.update(pendingColumnRename.columnId, {
      label: pendingColumnRename.label,
      ticketNumber: ticketRef,
      revisedBy: reviewers.revisedBy,
      reviewer: reviewers.reviewer,
    })
    await fetchColumns()
    setPendingColumnRename(null)
  }

  const validateColumnHeader = (columnId, nextLabel) => {
    const norm = (v) => String(v ?? '').trim().toLowerCase()
    // Block a rename that collides with another custom column or a
    // built-in header (the built-ins are reserved import/export names).
    const clashesCustom = columns.some((c) => c.id !== columnId && norm(c.label) === norm(nextLabel))
    const clashesBuiltin = [...FIXED_LEADING, 'Updated By'].some((h) => norm(h) === norm(nextLabel))
    return clashesCustom || clashesBuiltin ? 'Another column already uses this name.' : null
  }

  // Opens the styled confirmation modal; the actual delete runs in
  // confirmDeleteColumn once the user confirms.
  const deleteColumn = (column) => setDeleteColumnTarget(column)

  const confirmDeleteColumn = async (ticketRef, reviewers = {}) => {
    if (!deleteColumnTarget) return
    setActionError('')
    // Throw on failure so the delete modal shows the error inline and
    // stays open; refresh + close only on success. The audit trail
    // (ticket + revised by + reviewer) is persisted server-side in the
    // instance_column_deletions table.
    await instanceColumnService.remove(deleteColumnTarget.id, {
      ticketNumber: ticketRef,
      revisedBy: reviewers.revisedBy,
      reviewer: reviewers.reviewer,
    })
    await fetchColumns()
    await fetchList()
    setDeleteColumnTarget(null)
  }

  // --- Column drag-and-drop reorder ---------------------------------
  // Free reordering of ANY header (built-in or custom) to ANY position.
  // We track the key being dragged and the key currently hovered so we
  // can show a drop indicator, then on drop we reorder the `layout` array
  // optimistically and persist the new key order to the backend (which
  // re-anchors every column and returns the canonical layout).
  const [dragKey, setDragKey] = useState(null)
  const [dragOverKey, setDragOverKey] = useState(null)

  const onColumnDrop = async (targetKey) => {
    const sourceKey = dragKey
    setDragKey(null)
    setDragOverKey(null)
    if (!sourceKey || sourceKey === targetKey) return
    // The pinned Instance column never moves and nothing can be dropped
    // onto it (which would try to place a column before it).
    if (sourceKey === PINNED_FIRST_KEY || targetKey === PINNED_FIRST_KEY) return

    const from = layout.findIndex((c) => c.key === sourceKey)
    const to = layout.findIndex((c) => c.key === targetKey)
    if (from === -1 || to === -1) return

    // Reorder a copy: pull the dragged column out, then re-insert it
    // relative to the target based on drag DIRECTION so the drop always
    // lands where the cursor is:
    //   - dragging RIGHT (from < to)  -> drop AFTER the target
    //   - dragging LEFT  (from > to)  -> drop BEFORE the target
    // (Inserting "before the target" both ways made a rightward move onto
    // the immediate neighbour a no-op, since after removal the target had
    // already shifted into the dragged column's old slot.)
    const next = [...layout]
    next.splice(from, 1)
    const targetIndex = next.findIndex((c) => c.key === targetKey)
    const insertAt = from < to ? targetIndex + 1 : targetIndex
    next.splice(insertAt, 0, layout[from])

    const prevLayout = layout
    setLayout(next) // optimistic
    setActionError('')
    try {
      const fresh = await instanceColumnService.reorder(next.map((c) => c.key))
      setLayout(fresh)
    } catch (err) {
      setLayout(prevLayout) // revert on failure
      setActionError(err?.message || 'Could not reorder columns.')
    }
  }

  // Drag-and-drop handlers for a whole header cell keyed by `key`. The
  // entire <th> is both the drag source and the drop zone — no separate
  // handle. A drag that STARTS on an interactive child (the inline rename
  // input, the rename pencil, or the delete button) is ignored so those
  // controls keep working; only a drag begun on the header label itself
  // reorders the column.
  const headerDragProps = (key) => {
    // The pinned Instance column is not a drag source or a drop target.
    const pinned = key === PINNED_FIRST_KEY
    return {
    draggable: perms.canEdit && !pinned,
    onDragStart: (e) => {
      // Don't hijack a drag that began inside an input/button (rename,
      // delete). Reorder only when grabbing the header text/background.
      if (pinned || e.target.closest('input, button')) {
        e.preventDefault()
        return
      }
      setDragKey(key)
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: () => {
      setDragKey(null)
      setDragOverKey(null)
    },
    onDragOver: (e) => {
      if (!dragKey || dragKey === key || pinned) return
      e.preventDefault() // allow drop
      e.dataTransfer.dropEffect = 'move'
      if (dragOverKey !== key) setDragOverKey(key)
    },
    onDragLeave: () => {
      if (dragOverKey === key) setDragOverKey(null)
    },
    onDrop: (e) => {
      e.preventDefault()
      onColumnDrop(key)
    },
    }
  }

  // Visual classes for a header being dragged / hovered as a drop target.
  // The pinned Instance column shows no grab cursor / drag affordance.
  const headerDragCls = (key) => {
    const pinned = key === PINNED_FIRST_KEY
    return [
      perms.canEdit && !pinned ? 'cursor-grab active:cursor-grabbing' : '',
      dragKey === key ? 'opacity-40' : '',
      dragOverKey === key && dragKey !== key ? 'border-l-2 border-primary bg-primary/5' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  // Total column count for placeholder colSpans: every layout column
  // (built-ins + custom, interleaved) plus the pinned actions column.
  const colCount = layout.length + 1

  // --- Frozen columns + fixed widths --------------------------------
  // The Instance column sticks to the LEFT edge and the actions column to
  // the RIGHT edge, so both stay visible while the middle columns scroll
  // horizontally. Sticky cells need an opaque background (so scrolled
  // content doesn't show through) and a z-index HIGHER than the body's
  // frozen cells.
  //
  // Z-INDEX HIERARCHY (must stay ordered, else a frozen column's header
  // gets painted over by the first body row on VERTICAL scroll — which is
  // exactly the bug this layering prevents):
  //   thead                 -> z-30 (whole header row, wins over all body)
  //   frozen HEADER corners  -> z-40 (top-left / top-right, win over both
  //                             the header row AND the frozen body column)
  //   frozen BODY cells      -> z-10 (below the header row, above the
  //                             normal middle cells)
  // A `position:sticky` cell with its OWN z-index escapes the row's
  // stacking, so a frozen body cell at the same z as the thead would
  // (being later in the DOM) paint over the header — hence the strict
  // ordering above.
  const stickyLeftHeadCls = 'sticky left-0 z-40 bg-white'
  const stickyRightHeadCls = 'sticky right-0 z-40 bg-white'
  // Body sticky cells MUST stay fully opaque so the middle columns don't
  // bleed through them while scrolling. The row hover uses a translucent
  // primary tint; a translucent hover on the sticky cell would let the
  // scrolled content show through. So we keep a solid white base ALWAYS
  // and, on hover, paint the same tint as a gradient LAYER on top of that
  // white (background-image over background-color) — opaque overall, but
  // visually identical to the row's hover tint.
  // The tint references the theme's --c-primary CSS variable (set in
  // index.css and swapped per theme) so it always matches the row hover,
  // whatever the active theme.
  const stickyHoverTint =
    'group-hover:bg-[linear-gradient(rgb(var(--c-primary)/0.03),rgb(var(--c-primary)/0.03))]'
  const stickyLeftBodyCls = `sticky left-0 z-10 bg-white ${stickyHoverTint}`
  const stickyRightBodyCls = `sticky right-0 z-10 bg-white ${stickyHoverTint}`

  // Width class for a layout column: the pinned Instance column is a touch
  // wider (it holds an icon + name); every other column is uniform so
  // adding a column never resizes the others.
  const colWidthCls = (key) => (key === PINNED_FIRST_KEY ? FIRST_COL_WIDTH : COL_WIDTH)

  // Renders a single body cell for the given instance + layout column.
  // Dispatches by col.key: the five built-ins get their bespoke cells,
  // everything else is a custom column value (inst.customFields[key]).
  const renderCell = (inst, col, status) => {
    // Shared per-cell classes: fixed width (so columns never shrink) plus
    // the left-frozen treatment for the pinned Instance column.
    const isPinned = col.key === PINNED_FIRST_KEY
    const tdCls = [
      'px-5 py-2.5 align-middle',
      colWidthCls(col.key),
      isPinned ? stickyLeftBodyCls : '',
    ]
      .filter(Boolean)
      .join(' ')

    const inner = (() => {
      switch (col.key) {
        case 'name':
          return (
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary">
                <Layers className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 font-semibold text-heading">
                <EditableCell
                  value={inst.name}
                  canEdit={perms.canEdit}
                  onSave={(v) => saveField(inst.id, 'name', v)}
                  inputWidth="w-full"
                  truncate={false}
                />
              </span>
            </div>
          )
        case 'ticketNumber':
          // READ-ONLY: the ticket number originates from the mail/ticket
          // system, so it is displayed but not hand-editable here.
          return inst.ticketNumber ? (
            <span className="font-medium text-heading">{inst.ticketNumber}</span>
          ) : (
            <span className="text-gray-300">—</span>
          )
        case 'issuerCount':
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-grey-light px-2 py-0.5 text-xs font-semibold text-body">
              <Building2 className="h-3 w-3" />
              {inst.issuerCount || 0}
            </span>
          )
        case 'status':
          return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTint[status]}`}>
              {status}
            </span>
          )
        case 'updatedBy':
          return (
            <div className="text-xs text-body">
              <p className="font-medium text-heading">{inst.updatedBy || '—'}</p>
              {inst.updatedAt &&
                (() => {
                  const { date, time } = splitDateTime(inst.updatedAt)
                  return (
                    <p>
                      {date}
                      {time && <span className="text-gray-400"> · {time}</span>}
                    </p>
                  )
                })()}
            </div>
          )
        default: {
          // Custom column value — stored in inst.customFields keyed by the
          // column key; edits go through the same ticket-captured flow.
          const cellValue = inst.customFields?.[col.key]
          const display = cellValue === undefined || cellValue === null ? '' : String(cellValue)
          return (
            <EditableCell
              value={display}
              canEdit={perms.canEdit}
              onSave={(v) => saveCustomField(inst, col, v)}
              inputWidth="w-full"
              render={(v) =>
                v ? <span className="text-heading">{v}</span> : <span className="text-gray-300">—</span>
              }
            />
          )
        }
      }
    })()

    return (
      <td key={col.key} className={`${tdCls} ${col.key === 'name' ? '' : 'whitespace-nowrap'}`}>
        {inner}
      </td>
    )
  }

  // Import/export expected columns = the fixed ones + each custom label.
  const importColumnKeys = ['name', 'ticket', ...columns.map((c) => c.key)]
  const importColumnLabels = {
    name: 'Instance',
    ticket: 'Ticket Number',
    ...Object.fromEntries(columns.map((c) => [c.key, c.label])),
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Full-screen branded loader while a CSV export is generated
          (export is a toolbar action with no modal of its own). */}
      {exporting && (
        <div className="fixed inset-0 z-[90]">
          <BrandLoader label="Preparing export…" />
        </div>
      )}

      {/* summary */}
      <div className="grid shrink-0 grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {[
          { icon: Layers, label: 'Total Instances', value: stats.totalInstances },
          { icon: Power, label: 'Active', value: stats.activeInstances },
          { icon: Building2, label: 'Issuers Grouped', value: stats.issuersGrouped.toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none text-heading">{value}</p>
              <p className="mt-0.5 truncate text-xs text-body">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {actionError && (
        <div className="flex shrink-0 items-start gap-2 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{actionError}</span>
        </div>
      )}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* toolbar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-64 sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search instance or ticket number"
                className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'All', label: 'All statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
                ariaLabel="Filter by status"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {perms.canCreate && (
              <button
                onClick={() => setShowAddColumn(true)}
                title="Add Column"
                aria-label="Add Column"
                className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 text-body transition hover:bg-grey-light"
              >
                <Columns3 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {perms.canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </button>
            )}
            {perms.canUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import Data</span>
              </button>
            )}
          </div>
        </div>

        {/* table — fixed column widths so adding a column never shrinks
            the others; the whole table scrolls horizontally instead, with
            the Instance column frozen left and the actions column frozen
            right. */}
        <div className="nice-scroll min-h-0 flex-1 overflow-auto">
          <table className="w-max min-w-full text-left text-sm">
            <thead className="sticky top-0 z-30 bg-white">
              <tr className="border-b border-gray-100 bg-white">
                {/* One header cell per layout column, in the backend's
                    canonical order. The Instance header is frozen left and
                    not draggable; other built-ins render a plain label;
                    custom columns are renameable + deletable. Actions
                    column is frozen right, below. */}
                {layout.map((col) => {
                  const isPinned = col.key === PINNED_FIRST_KEY
                  const thCls = `whitespace-nowrap px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 transition ${colWidthCls(
                    col.key
                  )} ${isPinned ? stickyLeftHeadCls : 'bg-white'} ${headerDragCls(col.key)}`
                  return col.builtin ? (
                    <th
                      key={col.key}
                      {...headerDragProps(col.key)}
                      title={perms.canEdit && !isPinned ? 'Drag to reorder' : undefined}
                      className={thCls}
                    >
                      {col.label}
                    </th>
                  ) : (
                    <th
                      key={col.key}
                      {...headerDragProps(col.key)}
                      title={perms.canEdit ? 'Drag to reorder' : undefined}
                      className={thCls}
                    >
                      <span className="inline-flex items-center gap-1">
                        <EditableHeader
                          value={col.label}
                          canEdit={perms.canEdit}
                          validate={(next) => validateColumnHeader(col.id, next)}
                          onSave={(next) => renameColumn(col.id, next)}
                        >
                          {perms.canDelete && (
                            <button
                              type="button"
                              onClick={() => deleteColumn({ id: col.id, label: col.label })}
                              title={`Delete column "${col.label}"`}
                              className="grid h-5 w-5 shrink-0 place-items-center rounded text-gray-300 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </EditableHeader>
                      </span>
                    </th>
                  )
                })}
                <th className={`w-16 min-w-16 px-5 py-2 ${stickyRightHeadCls}`} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-16 text-center text-sm text-body">
                    <BrandLoader inline label="Loading instances…" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-16 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : (
                data.map((inst) => {
                  const status = inst.status || 'Active'
                  return (
                    <tr key={inst.id} className="group transition hover:bg-primary/[0.03]">
                      {/* One cell per layout column, dispatched by key. The
                          Instance cell is frozen left; the actions cell is
                          frozen right. */}
                      {layout.map((col) => renderCell(inst, col, status))}
                      <td className={`px-5 py-2.5 text-right ${stickyRightBodyCls}`}>
                        <div className="flex items-center justify-end gap-1">
                          {perms.canEdit && (
                            <button
                              type="button"
                              onClick={() => toggleStatus(inst)}
                              title={status === 'Active' ? 'Deactivate' : 'Activate'}
                              className={`grid h-7 w-7 place-items-center rounded-md transition hover:bg-grey-light ${
                                status === 'Active'
                                  ? 'text-emerald-500 hover:text-amber-600'
                                  : 'text-gray-400 hover:text-emerald-600'
                              }`}
                            >
                              {status === 'Active' ? (
                                <Power className="h-3.5 w-3.5" />
                              ) : (
                                <PowerOff className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          {(perms.canEdit || perms.canDelete) && (
                            <RowActionsMenu
                              onEdit={perms.canEdit ? () => setEditTarget(inst) : undefined}
                              onDelete={perms.canDelete ? () => setDeleteTarget(inst) : undefined}
                              // An instance can only be deleted when it has
                              // NO issuers grouped under it. If it still has
                              // issuers, Delete is shown disabled and only
                              // Activate/Deactivate (the Power button) is
                              // usable.
                              deleteDisabled={(inst.issuerCount || 0) > 0}
                              deleteDisabledReason="This instance still has issuers. Reassign or remove them before deleting; you can deactivate it instead."
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
              {!loading && !error && data.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="px-5 py-16 text-center text-sm text-body">
                    No instance found{query.trim() ? ` for “${query}”` : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            start={rangeStart}
            end={rangeEnd}
            total={total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onGoto={setPage}
            label="instances"
          />
        </div>
      </section>

      {showCreate && (
        <InstanceFormModal
          existingNames={names}
          columns={columns}
          onClose={() => setShowCreate(false)}
          onSubmit={addInstance}
        />
      )}
      {showAddColumn && (
        <InstanceColumnModal
          existingLabels={columns.map((c) => c.label)}
          layout={layout}
          instanceCount={stats.totalInstances}
          onClose={() => setShowAddColumn(false)}
          onAdd={addColumn}
        />
      )}
      {deleteColumnTarget && (
        <DeleteColumnModal
          column={deleteColumnTarget}
          instanceCount={stats.totalInstances}
          onClose={() => setDeleteColumnTarget(null)}
          onConfirm={confirmDeleteColumn}
        />
      )}
      {/* Ticket capture before ADDING a column. The user types the ticket
          (it comes from the mail/ticket system). Captured in the UI only
          for now — not persisted (option B). Cancelling reopens the Add
          Column modal so the entered column isn't lost. */}
      {pendingColumnAdd && (
        <TicketCaptureModal
          title="Add Column"
          subtitle="Enter the ticket this change relates to"
          field="New column"
          after={pendingColumnAdd.label}
          requireReviewers
          onClose={() => {
            setPendingColumnAdd(null)
            setShowAddColumn(true)
          }}
          onConfirm={performColumnAdd}
        />
      )}
      {/* Ticket capture before RENAMING a column header. */}
      {pendingColumnRename && (
        <TicketCaptureModal
          title="Rename Column"
          subtitle="Enter the ticket this change relates to"
          field="Column name"
          before={pendingColumnRename.before}
          after={pendingColumnRename.label}
          requireReviewers
          onClose={() => setPendingColumnRename(null)}
          onConfirm={performColumnRename}
        />
      )}
      {showUpload && (
        <InstanceImportModal
          onSubmit={submitImportJob}
          onPoll={pollImportJob}
          onFetchErrors={fetchImportErrors}
          onDownloadTemplate={downloadTemplate}
          onFinished={refreshAfterWrite}
          onClose={() => setShowUpload(false)}
        />
      )}
      {editTarget && (
        <InstanceFormModal
          initial={{ ...editTarget, ticket: editTarget.ticketNumber }}
          existingNames={names}
          columns={columns}
          onClose={() => setEditTarget(null)}
          onSubmit={saveEdit}
        />
      )}
      {deleteTarget && (
        <DeleteInstanceModal
          instance={{ ...deleteTarget, issuerIds: new Array(deleteTarget.issuerCount || 0) }}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
      {/* Editing any field (Instance Name / Status / a custom column):
          the user TYPES the ticket this change relates to — it is NOT
          auto-populated or read-only (the ticket comes from the mail, so
          it must be entered each time). */}
      {pendingCell && (
        <TicketCaptureModal
          title="Save Change"
          subtitle="Enter the ticket this change relates to"
          field={pendingCell.label}
          before={pendingCell.before}
          after={pendingCell.value}
          requireReviewers
          onClose={() => setPendingCell(null)}
          onConfirm={commitCell}
        />
      )}
      {statusTarget && (
        <StatusConfirmModal
          entityLabel="Instance"
          name={statusTarget.name}
          deactivating={(statusTarget.status || 'Active') === 'Active'}
          activeHint="Its issuers become available in the SOP Dashboard again."
          inactiveHint="It moves to the Inactive list. Linked issuers are retained but the instance is no longer selectable."
          requireReviewers
          onClose={() => setStatusTarget(null)}
          onConfirm={confirmStatus}
        />
      )}
    </div>
  )
}
