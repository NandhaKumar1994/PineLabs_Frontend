import { useEffect, useMemo, useState } from 'react'
import { Search, Download, Filter, X, ChevronDown, Plus, Columns3, Upload, History } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import { useRole } from '../../theme/RoleContext'
import AddRowModal from '../dashboard/AddRowModal'
import RowActionsMenu from '../dashboard/RowActionsMenu'
import DeleteRowModal from '../dashboard/DeleteRowModal'
import AddColumnModal from './AddColumnModal'
import ColumnUploadModal from '../common/ColumnUploadModal'
import EditableCell from '../common/EditableCell'
import EditableHeader from '../common/EditableHeader'
import VersionHistoryModal from '../common/VersionHistoryModal'
import { useChangeLog } from '../../hooks/useChangeLog'

const groupTint = ['bg-primary/5 text-primary', 'bg-amber-50 text-amber-700', 'bg-teal-50 text-teal-700']

const newRowId = () => `sop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const tagRows = (rows, key) =>
  rows.map((r, i) => (r._rowId ? r : { ...r, _rowId: `${key}-${i}` }))

export default function SopSheet({ sheet, title, merchantName, enableAddRow = true, onRowsChange, onColumnsChange }) {
  const { perms } = useRole()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({}) // { column: value }
  const [showFilters, setShowFilters] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [rowsByKey, setRowsByKey] = useState({})
  const [groupsByKey, setGroupsByKey] = useState({})
  const [customColsByKey, setCustomColsByKey] = useState({})
  const [uploadColumn, setUploadColumn] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  // Recent-change log for this sheet (seeded so the panel has prior context).
  const { entries: changeLog, log } = useChangeLog([
    {
      id: 'sop-seed-2',
      type: 'update',
      action: 'Edited cell',
      change: 'Condition row updated',
      field: 'Action',
      before: 'Approve',
      after: 'Escalate',
      preview: {
        columns: ['Card Status', 'Balance', 'Requester', 'Action'],
        before: { 'Card Status': 'Activated', Balance: '>Zero', Requester: 'CES', Action: 'Approve' },
        after: { 'Card Status': 'Activated', Balance: '>Zero', Requester: 'CES', Action: 'Escalate' },
        changedCols: ['Action'],
      },
      by: 'Neha Shah',
      at: '2026-09-08 10:15',
    },
    {
      id: 'sop-seed-3',
      type: 'create',
      action: 'Added row',
      change: 'New condition row appended',
      fields: [
        { field: 'Card Status', after: 'Expired' },
        { field: 'Balance', after: '>Zero' },
        { field: 'Action', after: 'Escalate' },
      ],
      preview: {
        columns: ['Card Status', 'Balance', 'Requester', 'Action'],
        after: { 'Card Status': 'Expired', Balance: '>Zero', Requester: 'Brand POC', Action: 'Escalate' },
      },
      by: 'Priya Das',
      at: '2026-09-06 12:30',
    },
    {
      id: 'sop-seed-1',
      type: 'upload',
      action: 'Imported',
      change: 'Sheet replaced from uploaded file',
      by: 'Neha Shah',
      at: '2026-09-09 13:10',
    },
  ])

  const groups = groupsByKey[sheet.key] ?? sheet.groups
  const customColumns = customColsByKey[sheet.key] ?? new Set()

  const flatColumns = useMemo(
    () => groups.flatMap((g) => g.columns),
    [groups]
  )

  const columnLabels = useMemo(
    () => Object.fromEntries(flatColumns.map((col) => [col, col])),
    [flatColumns]
  )

  const data = rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key)

  // Reset search + filters whenever the active subsheet changes, since
  // columns differ between sheets.
  useEffect(() => {
    setQuery('')
    setFilters({})
    setShowFilters(false)
    setShowAdd(false)
    setShowAddColumn(false)
    setUploadColumn(null)
    setEditRow(null)
    setDeleteRow(null)
    setShowHistory(false)
  }, [sheet])

  // unique values per column for the filter dropdowns
  const columnValues = useMemo(() => {
    const map = {}
    flatColumns.forEach((col) => {
      map[col] = [...new Set(data.map((r) => r[col]))].filter(Boolean).sort()
    })
    return map
  }, [flatColumns, data])

  const debouncedQuery = useDebounce(query, 200)

  const rows = useMemo(() => {
    const source = query.trim() === '' ? query : debouncedQuery
    const q = source.trim().toLowerCase()
    return data.filter((r) => {
      if (q && !Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
        return false
      for (const [col, val] of Object.entries(filters)) {
        if (val && r[col] !== val) return false
      }
      return true
    })
  }, [debouncedQuery, query, filters, data])

  const pager = usePagination(rows, 50)

  const commitRows = (list) => {
    setRowsByKey((prev) => ({ ...prev, [sheet.key]: list }))
    onRowsChange?.(sheet.key, list)
  }

  // Inline single-cell edit.
  const saveCell = (rowId, col, value) => {
    const current = rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key)
    const before = current.find((r) => r._rowId === rowId)?.[col]
    const list = current.map((r) => (r._rowId === rowId ? { ...r, [col]: value } : r))
    commitRows(list)
    const target = current.find((r) => r._rowId === rowId)
    log('update', 'Edited cell', sheet.name, {
      field: col,
      before: before ?? '',
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

  // Add a new column to the sheet: update groups and fill every row with the
  // chosen default value (bulk-applied so users don't edit each row manually).
  const addColumn = ({ column, group, isNewGroup, defaultValue = '' }) => {
    const nextGroups = isNewGroup
      ? [...groups, { group, columns: [column] }]
      : groups.map((g) => (g.group === group ? { ...g, columns: [...g.columns, column] } : g))

    const currentRows = rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key)
    const nextRows = currentRows.map((r) => ({ ...r, [column]: r[column] ?? defaultValue }))

    setGroupsByKey((prev) => ({ ...prev, [sheet.key]: nextGroups }))
    setRowsByKey((prev) => ({ ...prev, [sheet.key]: nextRows }))
    setCustomColsByKey((prev) => {
      const next = new Set(prev[sheet.key] ?? [])
      next.add(column)
      return { ...prev, [sheet.key]: next }
    })
    onColumnsChange?.(sheet.key, nextGroups)
    onRowsChange?.(sheet.key, nextRows)
    const sample = currentRows[0]
    log('column', 'Added column', `Added under ${group}`, {
      fields: [
        { field: 'New column', after: column },
        ...(defaultValue ? [{ field: 'Default value', after: defaultValue }] : []),
      ],
      preview: sample
        ? snapshot({
            columns: [...flatColumns, column],
            before: sample,
            after: { ...sample, [column]: defaultValue },
            changedCols: [column],
            newColumn: column,
          })
        : undefined,
    })
  }

  const norm = (v) => String(v ?? '').trim().toLowerCase()

  // Rename a column group (the top header tier).
  const renameGroup = (from, to) => {
    const nextGroups = groups.map((g) => (g.group === from ? { ...g, group: to } : g))
    setGroupsByKey((prev) => ({ ...prev, [sheet.key]: nextGroups }))
    onColumnsChange?.(sheet.key, nextGroups)
    log('rename', 'Renamed group', 'Column group heading changed', {
      field: 'Group',
      before: from,
      after: to,
    })
  }

  const validateGroupName = (from, to) =>
    groups.some((g) => g.group !== from && norm(g.group) === norm(to))
      ? 'Another group already uses this name.'
      : null

  // Rename a column. In SOP sheets the column name IS the row key, so the row
  // data, filters and custom-column tracking all have to be migrated too.
  const renameColumn = (from, to) => {
    const nextGroups = groups.map((g) => ({
      ...g,
      columns: g.columns.map((c) => (c === from ? to : c)),
    }))

    const currentRows = rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key)
    const nextRows = currentRows.map((r) => {
      // Rebuild each row preserving column order, swapping the renamed key.
      const next = {}
      Object.entries(r).forEach(([k, v]) => {
        next[k === from ? to : k] = v
      })
      return next
    })

    setGroupsByKey((prev) => ({ ...prev, [sheet.key]: nextGroups }))
    setRowsByKey((prev) => ({ ...prev, [sheet.key]: nextRows }))
    setCustomColsByKey((prev) => {
      const cur = new Set(prev[sheet.key] ?? [])
      if (cur.delete(from)) cur.add(to)
      return { ...prev, [sheet.key]: cur }
    })
    setFilters((prev) => {
      if (!(from in prev)) return prev
      const { [from]: val, ...rest } = prev
      return { ...rest, [to]: val }
    })

    onColumnsChange?.(sheet.key, nextGroups)
    onRowsChange?.(sheet.key, nextRows)
    log('rename', 'Renamed column', 'Column header changed', {
      field: 'Column',
      before: from,
      after: to,
    })
  }

  const validateColumnName = (from, to) =>
    flatColumns.some((c) => c !== from && norm(c) === norm(to))
      ? 'Another column already uses this name.'
      : null

  // Apply uploaded values for a custom column, matched by Issuer/Merchant.
  // Every row in this merchant's sheet receives the value uploaded for it.
  const applyColumnValues = (colKey) => (valueMap) => {
    const mKey = String(merchantName ?? '').trim().toLowerCase()
    if (!valueMap.has(mKey)) return
    const value = valueMap.get(mKey)
    const currentRows = rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key)
    const nextRows = currentRows.map((r) => ({ ...r, [colKey]: value }))
    setRowsByKey((prev) => ({ ...prev, [sheet.key]: nextRows }))
    onRowsChange?.(sheet.key, nextRows)
  }

  // Summarise a row as field/value pairs so each value is colour-coded.
  const rowFields = (row, direction = 'after') =>
    flatColumns
      .filter((c) => String(row[c] ?? '').trim())
      .map((c) => ({ field: c, [direction]: row[c] }))

  // Table snapshot used by the eye-icon preview.
  const snapshot = ({ before, after, changedCols = [], newColumn, columns = flatColumns }) => ({
    columns,
    labels: Object.fromEntries(columns.map((c) => [c, c])),
    before,
    after,
    changedCols,
    newColumn,
  })

  const addRow = (row) => {
    commitRows([{ ...row, _rowId: newRowId() }, ...(rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key))])
    log('create', 'Added row', `New row in ${sheet.name}`, {
      fields: rowFields(row),
      preview: snapshot({ after: row }),
    })
    setQuery('')
  }

  const saveEdit = (next) => {
    if (!editRow) return
    const list = (rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key)).map((r) =>
      r._rowId === editRow._rowId ? { ...r, ...next, _rowId: editRow._rowId } : r
    )
    commitRows(list)
    const changed = flatColumns
      .filter((c) => String(next[c] ?? '') !== String(editRow[c] ?? ''))
      .map((c) => ({ field: c, before: editRow[c] ?? '', after: next[c] ?? '' }))
    log('update', 'Updated row', `Row edited in ${sheet.name}`, {
      ...(changed.length ? { fields: changed } : {}),
      preview: snapshot({
        before: editRow,
        after: { ...editRow, ...next },
        changedCols: changed.map((c) => c.field),
      }),
    })
    setEditRow(null)
  }

  const confirmDelete = () => {
    if (!deleteRow) return
    commitRows((rowsByKey[sheet.key] ?? tagRows(sheet.rows, sheet.key)).filter((r) => r._rowId !== deleteRow._rowId))
    log('delete', 'Deleted row', `Row removed from ${sheet.name}`, {
      fields: rowFields(deleteRow, 'before'),
      preview: snapshot({ before: deleteRow }),
    })
    setDeleteRow(null)
  }

  const setFilter = (col, val) =>
    setFilters((f) => {
      const next = { ...f }
      if (val) next[col] = val
      else delete next[col]
      return next
    })

  const activeFilterCount = Object.keys(filters).length

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-3">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="whitespace-nowrap text-sm font-bold text-heading">{title}</h3>
              <span className="rounded-full bg-grey-light px-2 py-0.5 text-[11px] font-medium text-body">
                {data.length}
              </span>
              <span className="hidden h-5 w-px bg-gray-200 sm:block" />
            </div>
          )}
          <div className="relative w-52 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this sheet…"
              className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            title="View the last 5 changes to this sheet"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Version History</span>
          </button>
          {enableAddRow && perms.canCreate && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Row</span>
            </button>
          )}
          {perms.canCreate && (
            <button
              type="button"
              onClick={() => setShowAddColumn(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
            >
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Add Column</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              showFilters || activeFilterCount
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 text-body hover:bg-grey-light'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({})}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* per-column filter bar */}
      {showFilters && (
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-gray-100 bg-grey-light/50 px-4 py-2.5">
          {flatColumns.map((col) => (
            <div key={col} className="relative">
              <select
                value={filters[col] || ''}
                onChange={(e) => setFilter(col, e.target.value)}
                className={`appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${
                  filters[col]
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 bg-white text-body'
                }`}
              >
                <option value="">{col}: All</option>
                {columnValues[col].map((v) => (
                  <option key={v} value={v}>
                    {col}: {v}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          ))}
        </div>
      )}

      {/* two-tier grouped table */}
      <div className="nice-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-20">
            <tr>
              {groups.map((g, gi) => (
                <th
                  key={g.group}
                  colSpan={g.columns.length}
                  className={`whitespace-nowrap border border-gray-200 px-4 py-2 text-center text-xs font-bold uppercase tracking-wide ${
                    groupTint[gi % groupTint.length]
                  }`}
                >
                  <EditableHeader
                    value={g.group}
                    canEdit={perms.canEdit}
                    validate={(next) => validateGroupName(g.group, next)}
                    onSave={(next) => renameGroup(g.group, next)}
                  />
                </th>
              ))}
              {(perms.canEdit || perms.canDelete) && (
                <th rowSpan={2} className="w-12 border border-gray-200 bg-white" />
              )}
            </tr>
            <tr>
              {flatColumns.map((col) => (
                <th
                  key={col}
                  className={`border border-gray-200 px-4 py-2 text-xs font-semibold ${
                    filters[col] ? 'bg-primary/10 text-primary' : 'bg-grey-light text-heading'
                  }`}
                >
                  <EditableHeader
                    value={col}
                    canEdit={perms.canEdit}
                    validate={(next) => validateColumnName(col, next)}
                    onSave={(next) => renameColumn(col, next)}
                  >
                    {customColumns.has(col) && perms.canUpload && (
                      <button
                        type="button"
                        onClick={() => setUploadColumn(col)}
                        title={`Upload ${col} values from a file`}
                        className="grid h-5 w-5 place-items-center rounded text-primary transition hover:bg-primary/10"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </EditableHeader>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((row) => (
              <tr key={row._rowId} className="transition hover:bg-primary/[0.03]">
                {flatColumns.map((col) => (
                  <td
                    key={col}
                    className="border border-gray-100 px-4 py-2 align-top text-body"
                  >
                    <EditableCell
                      value={row[col]}
                      canEdit={perms.canEdit}
                      onSave={(v) => saveCell(row._rowId, col, v)}
                      render={(v) => <CellValue value={v} />}
                    />
                  </td>
                ))}
                {(perms.canEdit || perms.canDelete) && (
                  <td className="border border-gray-100 px-2 py-2 text-center">
                    <RowActionsMenu
                      onEdit={perms.canEdit ? () => setEditRow(row) : undefined}
                      onDelete={perms.canDelete ? () => setDeleteRow(row) : undefined}
                    />
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={flatColumns.length + (perms.canEdit || perms.canDelete ? 1 : 0)} className="px-4 py-12 text-center text-sm text-body">
                  No rows match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-gray-100 px-4 py-2">
        {rows.length === 1 ? (
          <div className="flex items-center justify-between text-xs text-body">
            <span>1 row</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
              Single action matched
            </span>
          </div>
        ) : (
          <Pagination
            page={pager.page}
            totalPages={pager.totalPages}
            start={pager.start}
            end={pager.end}
            total={pager.total}
            onPrev={pager.prev}
            onNext={pager.next}
            onGoto={pager.setPage}
            label="rows"
          />
        )}
      </div>

      {showHistory && (
        <VersionHistoryModal
          title="Version History"
          subtitle={`Last 5 changes to ${sheet.name}`}
          entries={changeLog}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showAdd && enableAddRow && (
        <AddRowModal
          columns={flatColumns}
          labels={columnLabels}
          examples={data[0]}
          onClose={() => setShowAdd(false)}
          onSubmit={addRow}
          groups={groups}
        />
      )}
      {editRow && (
        <AddRowModal
          columns={flatColumns}
          labels={columnLabels}
          examples={data[0]}
          initial={editRow}
          onClose={() => setEditRow(null)}
          onSubmit={saveEdit}
          groups={groups}
        />
      )}
      {showAddColumn && (
        <AddColumnModal
          groups={groups}
          existingColumns={flatColumns}
          rowCount={data.length}
          onClose={() => setShowAddColumn(false)}
          onAdd={addColumn}
        />
      )}
      {uploadColumn && (
        <ColumnUploadModal
          column={uploadColumn}
          keyLabel="Issuer"
          sampleKeys={merchantName ? [merchantName] : []}
          onClose={() => setUploadColumn(null)}
          onApply={applyColumnValues(uploadColumn)}
        />
      )}
      {deleteRow && (
        <DeleteRowModal onClose={() => setDeleteRow(null)} onConfirm={confirmDelete} />
      )}
    </section>
  )
}

const positive = new Set(['Yes', 'Approve', 'Activate', 'Extend', 'Reverse', 'Block', 'Cancel'])
const negative = new Set(['Reject', 'Freeze'])
const warning = new Set(['Escalate', 'Hold', 'Wait', 'Manual Review'])

function CellValue({ value }) {
  const v = String(value)
  if (positive.has(v))
    return (
      <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
        {v}
      </span>
    )
  if (negative.has(v))
    return (
      <span className="inline-block rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-600">
        {v}
      </span>
    )
  if (warning.has(v))
    return (
      <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
        {v}
      </span>
    )
  if (v === 'NA' || v === 'No')
    return <span className="text-xs font-medium text-gray-400">{v}</span>
  return <span>{v}</span>
}
