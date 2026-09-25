import { useMemo, useState } from 'react'
import { Search, Plus, Layers, Building2, Download, Power, PowerOff, Upload } from 'lucide-react'
import { instances as seedInstances, createInstance } from '../../data/sopData'
import { formatDateTime, stampEditor } from '../../data/users'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import EditableCell from '../common/EditableCell'
import RowActionsMenu from '../dashboard/RowActionsMenu'
import { useRole } from '../../theme/RoleContext'
import InstanceFormModal from './InstanceFormModal'
import DeleteInstanceModal from './DeleteInstanceModal'
import UploadSheetModal from '../dashboard/UploadSheetModal'
import TicketCaptureModal from '../common/TicketCaptureModal'
import StatusConfirmModal from '../sop/StatusConfirmModal'
import { downloadCsv, serializeCsv, identityValue } from '../../utils/csv'

const statusTint = {
  Active: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-gray-100 text-gray-500',
}

const FIELD_LABELS = { name: 'Instance', ticket: 'Ticket Number' }

export default function InstanceManagement() {
  const { perms } = useRole()
  const [data, setData] = useState(() => seedInstances.map((i) => ({ ...i })))
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

  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return data.filter((i) => {
      const matchesStatus = statusFilter === 'All' || (i.status || 'Active') === statusFilter
      const matchesQuery =
        !q ||
        i.name.toLowerCase().includes(q) ||
        String(i.ticket || '').toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [debounced, data, statusFilter])

  const pager = usePagination(filtered, 12)

  const names = useMemo(() => data.map((i) => i.name), [data])
  const activeCount = data.filter((i) => (i.status || 'Active') === 'Active').length
  const totalIssuers = data.reduce((s, i) => s + (i.issuerIds?.length || 0), 0)

  const addInstance = ({ ticket, ...payload }) => {
    const created = createInstance(payload)
    created.ticket = ticket
    setData((prev) => [created, ...prev])
    setQuery('')
  }

  const saveEdit = ({ copyIssuers, ...payload }) => {
    if (!editTarget) return
    setData((prev) =>
      prev.map((i) => (i.id === editTarget.id ? { ...i, ...payload, ...stampEditor() } : i))
    )
    setEditTarget(null)
  }



  // Inline edits are staged until a ticket number is captured.
  const saveField = (id, field, value) => {
    const target = data.find((i) => i.id === id)
    if (!target) return
    const before = String(target[field] ?? '')
    if (before === String(value)) return
    setPendingCell({ id, field, value, before, label: FIELD_LABELS[field] || field })
  }

  // Commit the staged inline edit once the ticket is supplied.
  const commitCell = (ticketRef) => {
    if (!pendingCell) return
    const { id, field, value } = pendingCell
    setData((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, [field]: value, ticket: ticketRef, ...stampEditor() } : i
      )
    )
    setPendingCell(null)
  }

  const toggleStatus = (inst) => setStatusTarget(inst)

  const confirmStatus = (ticketRef) => {
    if (!statusTarget) return
    const next = (statusTarget.status || 'Active') === 'Active' ? 'Inactive' : 'Active'
    setData((prev) =>
      prev.map((i) =>
        i.id === statusTarget.id
          ? { ...i, status: next, ticket: ticketRef, ...stampEditor() }
          : i
      )
    )
    setStatusTarget(null)
  }

  // Bulk import — update the ticket reference on instances matched by name.
  const updateExisting = (updates) => {
    const byName = new Map()
    updates.forEach((row) => {
      const key = identityValue(row, 'name')
      if (key) byName.set(key, row)
    })
    setData((prev) =>
      prev.map((inst) => {
        const incoming = byName.get(identityValue(inst, 'name'))
        if (!incoming) return inst
        const ticket = String(incoming.ticket || '').trim()
        return ticket ? { ...inst, ticket, ...stampEditor() } : inst
      })
    )
    setQuery('')
  }

  // Bulk import — add new instances from the Instance / Ticket Number sheet.
  const addMany = (rows) => {
    const existing = new Set(data.map((i) => identityValue(i, 'name')))
    const created = rows
      .filter((r) => String(r.name || '').trim())
      .filter((r) => !existing.has(identityValue(r, 'name')))
      .map((r) => {
        const inst = createInstance({ name: r.name })
        inst.ticket = String(r.ticket || '').trim()
        return inst
      })
    if (!created.length) return
    setData((prev) => [...created, ...prev])
    setQuery('')
  }

  const confirmDelete = (ticket) => {
    if (!deleteTarget) return
    setData((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    // ticket is captured for the audit trail
    void ticket
    setDeleteTarget(null)
  }

  const exportCsv = () => {
    const cols = ['name', 'ticket', 'issuers', 'status', 'updatedBy', 'updatedAt']
    const labels = {
      name: 'Instance',
      ticket: 'Ticket Number',
      issuers: 'Issuers',
      status: 'Status',
      updatedBy: 'Updated By',
      updatedAt: 'Updated At',
    }
    const rows = filtered.map((i) => ({
      ...i,
      status: i.status || 'Active',
      issuers: i.issuerIds?.length || 0,
    }))
    downloadCsv('instances.csv', serializeCsv(cols, labels, rows))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* summary */}
      <div className="grid shrink-0 grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {[
          { icon: Layers, label: 'Total Instances', value: data.length },
          { icon: Power, label: 'Active', value: activeCount },
          { icon: Building2, label: 'Issuers Grouped', value: totalIssuers.toLocaleString() },
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-grey-light py-1.5 px-3 text-sm text-body outline-none transition focus:border-primary focus:bg-white"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
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

        {/* table */}
        <div className="nice-scroll min-h-0 flex-1 overflow-auto">
          <table className="w-full table-fixed text-left text-sm">
            {/* Data columns share the width evenly; the actions column is fixed. */}
            <colgroup>
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-16" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-white">
                {['Instance', 'Ticket Number', 'Issuers', 'Status', 'Updated By', ''].map((h, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pager.pageItems.map((inst) => {
                const status = inst.status || 'Active'
                return (
                  <tr key={inst.id} className="transition hover:bg-primary/[0.03]">
                    <td className="px-5 py-2.5">
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
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-body">
                      <EditableCell
                        value={inst.ticket || ''}
                        canEdit={perms.canEdit}
                        onSave={(v) => saveField(inst.id, 'ticket', v)}
                        inputWidth="w-full"
                        render={(v) =>
                          v ? (
                            <span className="font-medium text-heading">{v}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        }
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-grey-light px-2 py-0.5 text-xs font-semibold text-body">
                        <Building2 className="h-3 w-3" />
                        {inst.issuerIds?.length || 0}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTint[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-xs text-body">
                      <p className="font-medium text-heading">{inst.updatedBy || '—'}</p>
                      {inst.updatedAt && <p>{formatDateTime(inst.updatedAt)}</p>}
                    </td>
                    <td className="px-5 py-2.5 text-right">
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
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pager.total === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-body">
                    No instance found{query.trim() ? ` for “${query}”` : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
            label="instances"
          />
        </div>
      </section>

      {showCreate && (
        <InstanceFormModal
          existingNames={names}
          onClose={() => setShowCreate(false)}
          onSubmit={addInstance}
        />
      )}
      {showUpload && (
        <UploadSheetModal
          columns={['name', 'ticket']}
          labels={{ name: 'Instance', ticket: 'Ticket Number' }}
          existingRows={data}
          identityField="name"
          entityLabel="instance"
          sampleName="sample-instance.csv"
          existingHint="Existing instances are matched by name; their ticket reference is updated. Linked issuers are left untouched."
          newHint="New instances are added at the top of the list and start with no issuers linked."
          onClose={() => setShowUpload(false)}
          onUpdateExisting={updateExisting}
          onAddNew={addMany}
        />
      )}
      {editTarget && (
        <InstanceFormModal
          initial={editTarget}
          existingNames={names}
          onClose={() => setEditTarget(null)}
          onSubmit={saveEdit}
        />
      )}
      {deleteTarget && (
        <DeleteInstanceModal
          instance={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
      {pendingCell && (
        <TicketCaptureModal
          title="Save Change"
          subtitle="Enter the ticket this edit relates to"
          field={pendingCell.label}
          before={pendingCell.before}
          after={pendingCell.value}
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
          onClose={() => setStatusTarget(null)}
          onConfirm={confirmStatus}
        />
      )}
    </div>
  )
}
