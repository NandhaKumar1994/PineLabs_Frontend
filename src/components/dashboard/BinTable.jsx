import { useMemo, useState } from 'react'
import {
  Upload,
  Plus,
  Search,
  Download,
  Copy,
  Check,
  X,
  Columns3,
  History,
} from 'lucide-react'
import { binSeries, stampNow } from '../../data/binSeries'
import { instances } from '../../data/sopData'
import { formatDateTime } from '../../data/users'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import { useRole } from '../../theme/RoleContext'
import Pagination from '../common/Pagination'
import AddRowModal from './AddRowModal'
import UploadSheetModal from './UploadSheetModal'
import RowActionsMenu from './RowActionsMenu'
import DeleteRowModal from './DeleteRowModal'
import AddColumnModal from './AddColumnModal'
import ColumnUploadModal from '../common/ColumnUploadModal'
import EditableCell from '../common/EditableCell'
import EditableHeader from '../common/EditableHeader'
import VersionHistoryModal from '../common/VersionHistoryModal'
import { useChangeLog } from '../../hooks/useChangeLog'
import { downloadCsv, serializeCsv, issuerKey } from '../../utils/csv'

const baseColumnLabels = {
  issuer: 'Issuer',
  cardProgramGroupName: 'Card Program Group Name',
  binIin: 'BIN / IIN Code',
  merchantPrefix: 'Merchant Prefix',
  updatedBy: 'Updated By',
  updatedAt: 'Updated At',
}

const HIDDEN_COLS = new Set(['id', 'updatedAt'])
const FORM_SKIP = new Set(['id', 'updatedBy', 'updatedAt'])

const newId = () => `bin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const humanize = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()

export default function BinTable() {
  const { perms } = useRole()
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [cloneRow, setCloneRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [data, setData] = useState(() => [...binSeries])
  const [columnLabels, setColumnLabels] = useState(baseColumnLabels)
  const [customColumns, setCustomColumns] = useState(() => new Set())
  const [uploadColumn, setUploadColumn] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  // Recent-change log for this table (seeded with prior audit entries).
  const { entries: changeLog, log } = useChangeLog([
    {
      id: 'seed-2',
      type: 'update',
      action: 'Edited cell',
      change: 'Aurora Retail',
      field: 'Merchant Prefix',
      before: '001',
      after: '021',
      preview: {
        columns: ['issuer', 'cardProgramGroupName', 'binIin', 'merchantPrefix'],
        labels: baseColumnLabels,
        before: { issuer: 'Aurora Retail', cardProgramGroupName: 'Aurora Elite', binIin: '401288', merchantPrefix: '001' },
        after: { issuer: 'Aurora Retail', cardProgramGroupName: 'Aurora Elite', binIin: '401288', merchantPrefix: '021' },
        changedCols: ['merchantPrefix'],
      },
      by: 'Ravi Kumar',
      at: '2026-09-09 14:32',
    },
    {
      id: 'seed-3',
      type: 'create',
      action: 'Added record',
      change: 'New record for Ivory Mart',
      fields: [
        { field: 'Issuer', after: 'Ivory Mart' },
        { field: 'BIN / IIN Code', after: '533012' },
        { field: 'Merchant Prefix', after: '006' },
      ],
      preview: {
        columns: ['issuer', 'cardProgramGroupName', 'binIin', 'merchantPrefix'],
        labels: baseColumnLabels,
        after: { issuer: 'Ivory Mart', cardProgramGroupName: 'Ivory Wealth', binIin: '533012', merchantPrefix: '006' },
      },
      by: 'Arjun Rao',
      at: '2026-09-09 11:47',
    },
    {
      id: 'seed-1',
      type: 'upload',
      action: 'Imported',
      change: '600 records imported from sheet',
      by: 'Arjun Rao',
      at: '2026-09-07 14:03',
    },
  ])

  const allColumns = useMemo(
    () => (data[0] ? Object.keys(data[0]) : Object.keys(columnLabels)),
    [data]
  )
  const columns = useMemo(() => allColumns.filter((col) => !HIDDEN_COLS.has(col)), [allColumns])
  const formColumns = useMemo(() => allColumns.filter((col) => !FORM_SKIP.has(col)), [allColumns])
  const exportColumns = useMemo(() => allColumns.filter((col) => col !== 'id'), [allColumns])

  const debouncedQuery = useDebounce(query, 200)

  const rows = useMemo(() => {
    // Apply a filter immediately when the box is cleared (e.g. after Add Row)
    // so the new first record is visible without waiting on debounce.
    const source = query.trim() === '' ? query : debouncedQuery
    const q = source.trim().toLowerCase()
    if (!q) return data
    return data.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [debouncedQuery, query, data])

  // Summarise a row as field/after pairs so every added value shows in green.
  const rowFields = (row, direction = 'after') =>
    formColumns
      .filter((c) => String(row[c] ?? '').trim())
      .map((c) => ({
        field: columnLabels[c] || humanize(c),
        [direction]: row[c],
      }))

  // Table snapshot used by the eye-icon preview.
  const snapshot = ({ before, after, changedCols = [], newColumn }) => ({
    columns: formColumns,
    labels: Object.fromEntries(formColumns.map((c) => [c, columnLabels[c] || humanize(c)])),
    before,
    after,
    changedCols,
    newColumn,
  })

  const addRow = (row) => {
    setData((prev) => [{ ...row, id: newId(), ...stampNow() }, ...prev])
    log('create', 'Added record', `New record for ${row.issuer || 'issuer'}`, {
      fields: rowFields(row),
      preview: snapshot({ after: row }),
    })
    setQuery('')
  }

  const norm = (v) => String(v ?? '').trim().toLowerCase()

  // An issuer name must be unique within an instance. `ignoreId` lets the edit
  // form skip the row being edited.
  const duplicateIssuer = (form, ignoreId = null) => {
    const issuer = norm(form.issuer)
    const instance = norm(form.instance)
    if (!issuer) return null
    const clash = data.some(
      (r) =>
        r.id !== ignoreId &&
        norm(r.issuer) === issuer &&
        // Rows without an instance are treated as belonging to the same scope
        // as the one being entered, so a blank instance still blocks repeats.
        (!instance || !r.instance || norm(r.instance) === instance)
    )
    if (!clash) return null
    return instance
      ? `“${form.issuer.trim()}” already exists in the ${form.instance} instance.`
      : `“${form.issuer.trim()}” already exists.`
  }

  // Clone: prefill the form from an existing row so the user can tweak and save.
  const cloneSubmit = (row) => {
    setData((prev) => [{ ...row, id: newId(), ...stampNow() }, ...prev])
    log('create', 'Cloned record', `Copied into ${row.issuer || 'issuer'}`, {
      fields: rowFields(row),
      preview: snapshot({ after: row }),
    })
    setCloneRow(null)
    setQuery('')
  }

  // Add a new column: register its label and bulk-fill every record with the
  // chosen default value (inserted before the audit fields).
  const addColumn = (label, defaultValue = '') => {
    const colKey = label.trim().replace(/\s+/g, ' ')
    setColumnLabels((prev) => ({ ...prev, [colKey]: label.trim() }))
    setCustomColumns((prev) => new Set(prev).add(colKey))
    setData((prev) =>
      prev.map((row) => {
        const { updatedBy, updatedAt, ...rest } = row
        return { ...rest, [colKey]: rest[colKey] ?? defaultValue, updatedBy, updatedAt }
      })
    )
    const sample = data[0]
    const nextCols = [...formColumns, colKey]
    log('column', 'Added column', `Applied to ${data.length} records`, {
      fields: [
        { field: 'New column', after: label.trim() },
        ...(defaultValue ? [{ field: 'Default value', after: defaultValue }] : []),
      ],
      preview: sample
        ? {
            columns: nextCols,
            labels: Object.fromEntries(
              nextCols.map((c) => [c, c === colKey ? label.trim() : columnLabels[c] || humanize(c)])
            ),
            before: sample,
            after: { ...sample, [colKey]: defaultValue },
            changedCols: [colKey],
            newColumn: colKey,
          }
        : undefined,
    })
  }

  // Rename a column header. Only the display label changes — the underlying
  // data key stays put so rows, exports and uploads keep working.
  const renameColumn = (col, nextLabel) => {
    const before = columnLabels[col] || humanize(col)
    setColumnLabels((prev) => ({ ...prev, [col]: nextLabel }))
    log('rename', 'Renamed column', 'Column header changed', {
      field: 'Header',
      before,
      after: nextLabel,
    })
  }

  // Block renaming a header to a name another column already uses.
  const validateHeader = (col, nextLabel) => {
    const taken = columns.some(
      (c) => c !== col && norm(columnLabels[c] || humanize(c)) === norm(nextLabel)
    )
    return taken ? 'Another column already uses this name.' : null
  }

  // Apply uploaded values for a single custom column, matched by Issuer so all
  // rows belonging to that issuer receive the value.
  const applyColumnValues = (colKey) => (valueMap) => {
    setData((prev) =>
      prev.map((row) => {
        const key = String(row.issuer ?? '').trim().toLowerCase()
        return valueMap.has(key) ? { ...row, [colKey]: valueMap.get(key), ...stampNow() } : row
      })
    )
  }

  const saveEdit = (next) => {
    if (!editRow) return
    setData((prev) =>
      prev.map((row) => (row.id === editRow.id ? { ...row, ...next, ...stampNow() } : row))
    )
    // Only report the fields that actually changed.
    const changed = Object.keys(next)
      .filter((k) => String(next[k] ?? '') !== String(editRow[k] ?? ''))
      .map((k) => ({
        field: columnLabels[k] || humanize(k),
        before: editRow[k] ?? '',
        after: next[k] ?? '',
      }))
    log(
      'update',
      'Updated record',
      `${next.issuer || editRow.issuer} (BIN ${next.binIin || editRow.binIin})`,
      {
        ...(changed.length ? { fields: changed } : {}),
        preview: snapshot({
          before: editRow,
          after: { ...editRow, ...next },
          changedCols: Object.keys(next).filter(
            (k) => String(next[k] ?? '') !== String(editRow[k] ?? '')
          ),
        }),
      }
    )
    setEditRow(null)
  }

  // Inline single-cell edit.
  const saveCell = (rowId, col, value) => {
    const target = data.find((r) => r.id === rowId)
    setData((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [col]: value, ...stampNow() } : row))
    )
    const label = columnLabels[col] || humanize(col)
    log('update', 'Edited cell', `${target?.issuer || 'Record'}`, {
      field: label,
      before: target?.[col] ?? '',
      after: value,
      preview: target
        ? snapshot({
            before: target,
            after: { ...target, [col]: value },
            changedCols: [col],
          })
        : undefined,
    })
  }

  const confirmDelete = () => {
    if (!deleteRow) return
    setData((prev) => prev.filter((row) => row.id !== deleteRow.id))
    log('delete', 'Deleted record', `${deleteRow.issuer} (BIN ${deleteRow.binIin})`, {
      fields: rowFields(deleteRow, 'before'),
      preview: snapshot({ before: deleteRow }),
    })
    setDeleteRow(null)
  }

  const updateExisting = (updates) => {
    const queues = new Map()
    updates.forEach((incoming) => {
      const key = issuerKey(incoming)
      if (!key) return
      if (!queues.has(key)) queues.set(key, [])
      queues.get(key).push(incoming)
    })
    setData((prev) =>
      prev.map((row) => {
        const queue = queues.get(issuerKey(row))
        if (!queue?.length) return row
        const incoming = queue.shift()
        const next = { ...row, ...stampNow() }
        formColumns.forEach((col) => {
          if (col === 'issuer') return
          const value = String(incoming[col] ?? '').trim()
          if (value !== '') next[col] = value
        })
        return next
      })
    )
    setQuery('')
  }

  const addSheet = (incoming) => {
    setData((prev) => [
      ...incoming.map((row) => ({ ...row, id: newId(), ...stampNow() })),
      ...prev,
    ])
    setQuery('')
  }

  const exportSheet = () => {
    downloadCsv('bin-series.csv', serializeCsv(exportColumns, columnLabels, data))
  }

  const pager = usePagination(rows, 50)

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* ignore */
    }
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* card header with browse search + actions */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by issuer, program, BIN…"
            className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-8 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-heading"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSheet}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowHistory(true)}
            title="View the last 5 changes to this table"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Version History</span>
          </button>
          {perms.canCreate && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Row</span>
            </button>
          )}
          {perms.canCreate && (
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
            >
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Add Column</span>
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

      {/* table */}
      <div className="nice-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-100 bg-white">
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  <EditableHeader
                    value={columnLabels[col] || humanize(col)}
                    canEdit={perms.canEdit}
                    validate={(next) => validateHeader(col, next)}
                    onSave={(next) => renameColumn(col, next)}
                  >
                    {customColumns.has(col) && perms.canUpload && (
                      <button
                        type="button"
                        onClick={() => setUploadColumn(col)}
                        title={`Upload ${columnLabels[col] || col} values from a file`}
                        className="grid h-5 w-5 place-items-center rounded text-primary transition hover:bg-primary/10"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </EditableHeader>
                </th>
              ))}
              <th className="w-12 bg-white px-5 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pager.pageItems.map((row, i) => (
              <tr key={row.id || i} className="group transition hover:bg-primary/[0.03]">
                {columns.map((col) =>
                  col === 'issuer' ? (
                    <td key={col} className="whitespace-nowrap px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <EditableCell
                            value={row[col]}
                            canEdit={perms.canEdit}
                            onSave={(v) => saveCell(row.id, col, v)}
                            render={(v) => <span className="font-semibold text-heading">{v}</span>}
                          />
                        </div>
                        <button
                          onClick={() => copy(row[col], `${row.id || i}-issuer`)}
                          title="Copy issuer name"
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition ${
                            copied === `${row.id || i}-issuer`
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'text-gray-300 opacity-0 hover:bg-grey-light hover:text-primary group-hover:opacity-100'
                          }`}
                        >
                          {copied === `${row.id || i}-issuer` ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  ) : col === 'binIin' || col === 'merchantPrefix' ? (
                    <td key={col} className="whitespace-nowrap px-5 py-2.5">
                      <EditableCell
                        value={row[col]}
                        canEdit={perms.canEdit}
                        onSave={(v) => saveCell(row.id, col, v)}
                        render={(v) => (
                          <span className="rounded bg-grey-light px-2 py-0.5 text-xs font-medium tracking-wide text-heading">
                            {v}
                          </span>
                        )}
                      />
                    </td>
                  ) : col === 'updatedBy' ? (
                    <td key={col} className="whitespace-nowrap px-5 py-2.5">
                      <p className="text-sm font-medium text-heading">{row.updatedBy}</p>
                      <p className="text-xs text-body">{formatDateTime(row.updatedAt)}</p>
                    </td>
                  ) : (
                    <td key={col} className="whitespace-nowrap px-5 py-2.5 text-body">
                      <EditableCell
                        value={row[col]}
                        canEdit={perms.canEdit}
                        onSave={(v) => saveCell(row.id, col, v)}
                      />
                    </td>
                  )
                )}
                <td className="px-5 py-2.5 text-right">
                  {(perms.canEdit || perms.canDelete) && (
                    <RowActionsMenu
                      onEdit={perms.canEdit ? () => setEditRow(row) : undefined}
                      onClone={perms.canCreate ? () => setCloneRow(row) : undefined}
                      onDelete={perms.canDelete ? () => setDeleteRow(row) : undefined}
                    />
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-16 text-center">
                  <p className="text-sm font-medium text-heading">No matching record</p>
                  <p className="mt-1 text-xs text-body">
                    No issuer found for “{query}”. Check the digits and try again.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* footer */}
      <div className="shrink-0 border-t border-gray-100 px-5 py-3">
        <Pagination
          page={pager.page}
          totalPages={pager.totalPages}
          start={pager.start}
          end={pager.end}
          total={pager.total}
          onPrev={pager.prev}
          onNext={pager.next}
          onGoto={pager.setPage}
          label="records"
        />
      </div>

      {showAdd && (
        <AddRowModal
          columns={formColumns}
          labels={columnLabels}
          examples={data[0]}
          selectFields={[
            {
              name: 'instance',
              label: 'Instance',
              options: instances.map((i) => i.name),
              placeholder: 'Select an instance',
            },
          ]}
          validateRow={(form) => duplicateIssuer(form)}
          onClose={() => setShowAdd(false)}
          onSubmit={addRow}
        />
      )}
      {editRow && (
        <AddRowModal
          columns={formColumns}
          labels={columnLabels}
          examples={data[0]}
          initial={editRow}
          validateRow={(form) => duplicateIssuer(form, editRow.id)}
          onClose={() => setEditRow(null)}
          onSubmit={saveEdit}
        />
      )}
      {cloneRow && (
        <AddRowModal
          columns={formColumns}
          labels={columnLabels}
          examples={data[0]}
          initial={cloneRow}
          title="Clone BIN Record"
          subtitle="Review the copied values, then save as a new record"
          submitLabel="Create Clone"
          selectFields={[
            {
              name: 'instance',
              label: 'Instance',
              options: instances.map((i) => i.name),
              placeholder: 'Select an instance',
            },
          ]}
          validateRow={(form) => duplicateIssuer(form)}
          onClose={() => setCloneRow(null)}
          onSubmit={cloneSubmit}
        />
      )}
      {deleteRow && (
        <DeleteRowModal
          onClose={() => setDeleteRow(null)}
          onConfirm={confirmDelete}
        />
      )}
      {showHistory && (
        <VersionHistoryModal
          title="Version History"
          subtitle="Last 5 changes to the BIN Series table"
          entries={changeLog}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showAddColumn && (
        <AddColumnModal
          existingLabels={columns.map((c) => columnLabels[c] || humanize(c))}
          rowCount={data.length}
          onClose={() => setShowAddColumn(false)}
          onAdd={addColumn}
        />
      )}
      {uploadColumn && (
        <ColumnUploadModal
          column={columnLabels[uploadColumn] || humanize(uploadColumn)}
          keyLabel="Issuer"
          sampleKeys={[...new Set(data.map((r) => r.issuer).filter(Boolean))].slice(0, 3)}
          onClose={() => setUploadColumn(null)}
          onApply={applyColumnValues(uploadColumn)}
        />
      )}
      {showUpload && (
        <UploadSheetModal
          columns={formColumns}
          labels={columnLabels}
          existingRows={data}
          onClose={() => setShowUpload(false)}
          onUpdateExisting={updateExisting}
          onAddNew={addSheet}
        />
      )}
    </section>
  )
}
