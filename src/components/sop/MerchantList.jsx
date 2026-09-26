import { useMemo, useState } from 'react'
import { Search, Store, ChevronRight, FileSpreadsheet, Upload, User, Plus, Sparkles, Copy, CheckCircle2, XCircle, Power, PowerOff } from 'lucide-react'
import { merchants as allMerchants, createMerchant } from '../../data/sopData'
import { stampEditor, formatDateTime } from '../../data/users'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import { useTheme } from '../../theme/ThemeContext'
import { useRole } from '../../theme/RoleContext'
import UploadSheetModal from '../dashboard/UploadSheetModal'
import CreateMerchantModal from './CreateMerchantModal'
import StatusConfirmModal from './StatusConfirmModal'
import { identityValue } from '../../utils/csv'

const merchantColumns = ['name', 'classification']
const merchantLabels = {
  name: 'Issuer',
  classification: 'Classification',
}

export default function MerchantList({
  merchants = allMerchants,
  onMerchantsChange,
  onSelect,
  headerLeft = null,
  instances = [],
  currentInstanceId = '',
  // (instanceId, name) => boolean — checks duplicates across the whole dataset.
  isDuplicateInInstance,
}) {
  const { theme } = useTheme()
  const { perms } = useRole()
  const t2 = theme === 'theme2'
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [cloneSource, setCloneSource] = useState(null)
  // 'active' | 'inactive' — which issuer list is on screen.
  const [statusView, setStatusView] = useState('active')
  // Issuer pending an activate/deactivate confirmation.
  const [statusTarget, setStatusTarget] = useState(null)

  const debouncedQuery = useDebounce(query, 200)

  // Issuers default to active unless explicitly deactivated.
  const isActive = (m) => m.status !== 'Inactive'

  const activeCount = useMemo(() => merchants.filter(isActive).length, [merchants])
  const inactiveCount = merchants.length - activeCount

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    const byStatus = merchants.filter((m) =>
      statusView === 'active' ? isActive(m) : !isActive(m)
    )
    if (!q) return byStatus
    return byStatus.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.classification.toLowerCase().includes(q)
    )
  }, [debouncedQuery, merchants, statusView])

  const pager = usePagination(filtered, 24)

  // Flip an issuer between Active and Inactive (after confirmation).
  const confirmStatusChange = (ticket) => {
    if (!statusTarget) return
    const next = isActive(statusTarget) ? 'Inactive' : 'Active'
    onMerchantsChange?.((prev) =>
      prev.map((x) =>
        x.id === statusTarget.id ? { ...x, status: next, ticket, ...stampEditor() } : x
      )
    )
    setStatusTarget(null)
  }

  const merchantNames = useMemo(() => merchants.map((m) => m.name), [merchants])

  const updateExisting = (updates) => {
    const queues = new Map()
    updates.forEach((incoming) => {
      const key = identityValue(incoming, 'name')
      if (!key) return
      if (!queues.has(key)) queues.set(key, [])
      queues.get(key).push(incoming)
    })
    onMerchantsChange?.((prev) =>
      prev.map((merchant) => {
        const queue = queues.get(identityValue(merchant, 'name'))
        if (!queue?.length) return merchant
        const incoming = queue.shift()
        const nextClass = String(incoming.classification || '').trim()
        return nextClass ? { ...merchant, classification: nextClass, ...stampEditor() } : merchant
      })
    )
    setQuery('')
  }

  const addMerchants = (incoming) => {
    const created = incoming
      .filter((row) => String(row.name || '').trim())
      .map((row) =>
        createMerchant({
          name: row.name,
          classification: row.classification,
        })
      )
    if (!created.length) return
    onMerchantsChange?.((prev) => [...created, ...prev])
    setQuery('')
  }

  // Manual single-merchant creation (flagged with manualEntry for the badge).
  const createManualMerchant = ({ name, instanceId, revisedBy, reviewer, ticket, manualEntry }) => {
    const merchant = createMerchant({ name, manualEntry })
    Object.assign(merchant, { revisedBy, reviewer, ticket })
    onMerchantsChange?.((prev) => [merchant, ...prev], instanceId)
    setQuery('')
  }

  // Clone an issuer: copies its SOP sheets into a new issuer, into the chosen
  // instance, under a new (non-duplicate) name.
  const cloneIssuer = ({ name, instanceId, revisedBy, reviewer, ticket }) => {
    if (!cloneSource) return
    const copy = {
      ...createMerchant({ name, classification: cloneSource.classification }),
      revisedBy,
      reviewer,
      ticket,
      // deep-ish copy so edits to the clone don't mutate the source
      subsheets: (cloneSource.subsheets || []).map((s) => ({
        ...s,
        groups: s.groups.map((g) => ({ ...g, columns: [...g.columns] })),
        rows: s.rows.map((r) => ({ ...r })),
      })),
    }
    onMerchantsChange?.((prev) => [copy, ...prev], instanceId)
    setCloneSource(null)
    setQuery('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* header: instance title (left) + actions + search on a single row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {headerLeft}
        <div className="flex items-center gap-2 sm:ml-auto">
          {/* Active / Inactive issuer lists */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setStatusView('active')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                statusView === 'active'
                  ? 'bg-primary/10 text-primary'
                  : 'text-body hover:bg-grey-light'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
              <span className="rounded-full bg-grey-light px-1.5 text-[11px] font-bold text-body">
                {activeCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusView('inactive')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                statusView === 'inactive'
                  ? 'bg-primary/10 text-primary'
                  : 'text-body hover:bg-grey-light'
              }`}
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Inactive</span>
              <span className="rounded-full bg-grey-light px-1.5 text-[11px] font-bold text-body">
                {inactiveCount}
              </span>
            </button>
          </div>

          {perms.canCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Issuer</span>
            </button>
          )}
          {perms.canUpload && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import Data</span>
            </button>
          )}
          <div className="relative w-52 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issuer…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {pager.total === 0 ? (
          <p className="py-12 text-center text-sm text-body">
            {query.trim()
              ? `No ${statusView} issuer found for “${query}”.`
              : `No ${statusView} issuers in this instance.`}
          </p>
        ) : t2 ? (
          /* Theme 2: dense single-column list rows */
          <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {pager.pageItems.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary/[0.04]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Store className="h-5 w-5" />
                </span>
                <span className="flex w-56 shrink-0 items-center gap-1.5 truncate font-semibold text-heading">
                  <span className="truncate">{m.name}</span>
                  {m.manualEntry && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      <Sparkles className="h-2.5 w-2.5" />
                      New
                    </span>
                  )}
                </span>
                <span className="rounded-full bg-grey-light px-2 py-0.5 text-xs font-medium text-body">
                  {m.classification}
                </span>
                {m.updatedBy && (
                  <span className="min-w-0 text-xs text-body">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{m.updatedBy}</span>
                    </span>
                    {m.updatedAt && (
                      <span className="mt-0.5 block truncate">{formatDateTime(m.updatedAt)}</span>
                    )}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-body">
                  <FileSpreadsheet className="h-3 w-3" />
                  {m.subsheets.length} sheets
                </span>
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pager.pageItems.map((m) => (
              <div
                key={m.id}
                className={`group relative flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                  !isActive(m)
                    ? 'border-gray-200 opacity-70 hover:border-gray-300'
                    : m.manualEntry
                      ? 'border-emerald-300 ring-1 ring-emerald-100 hover:border-emerald-400'
                      : 'border-gray-200 hover:border-primary'
                }`}
              >
                <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                  {perms.canEdit && (
                    <button
                      type="button"
                      onClick={() => setStatusTarget(m)}
                      title={isActive(m) ? `Deactivate ${m.name}` : `Activate ${m.name}`}
                      className={`grid h-7 w-7 place-items-center rounded-md transition hover:bg-grey-light ${
                        isActive(m)
                          ? 'text-emerald-500 hover:text-amber-600'
                          : 'text-gray-400 hover:text-emerald-600'
                      }`}
                    >
                      {isActive(m) ? (
                        <Power className="h-3.5 w-3.5" />
                      ) : (
                        <PowerOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  {perms.canCreate && (
                    <button
                      type="button"
                      onClick={() => setCloneSource(m)}
                      title={`Clone ${m.name}`}
                      className="grid h-7 w-7 place-items-center rounded-md text-gray-300 transition hover:bg-grey-light hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(m)}
                  className="absolute inset-0 rounded-xl"
                  aria-label={`Open ${m.name} SOP`}
                />
                <span className="pointer-events-none grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/5 text-primary">
                  <Store className="h-6 w-6" />
                </span>
                <div className="pointer-events-none min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-bold text-heading">
                    <span className="truncate">{m.name}</span>
                    {!isActive(m) && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Inactive
                      </span>
                    )}
                    {m.manualEntry && isActive(m) && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                        <Sparkles className="h-2.5 w-2.5" />
                        New
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-body">
                    <span className="rounded-full bg-grey-light px-2 py-0.5 font-medium">
                      {m.classification}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="h-3 w-3" />
                      {m.subsheets.length} SOP sheets
                    </span>
                  </div>
                  {(m.revisedBy || m.reviewer) && (
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-body">
                      {m.revisedBy && (
                        <span>
                          Revised by <span className="font-medium text-heading">{m.revisedBy}</span>
                        </span>
                      )}
                      {m.reviewer && (
                        <span>
                          Reviewer <span className="font-medium text-heading">{m.reviewer}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {m.updatedBy && (
                    <div className="mt-1 text-xs text-body">
                      <p className="flex items-center gap-1">
                        <User className="h-3 w-3 shrink-0" />
                        Edited by <span className="font-medium text-heading">{m.updatedBy}</span>
                      </p>
                      {m.updatedAt && (
                        <p className="mt-0.5">{formatDateTime(m.updatedAt)}</p>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="pointer-events-none h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            ))}
          </div>
        )}
      </div>

      {pager.total > 0 && (
        <div className="shrink-0 border-t border-gray-200 pt-3">
          <Pagination
            page={pager.page}
            totalPages={pager.totalPages}
            start={pager.start}
            end={pager.end}
            total={pager.total}
            onPrev={pager.prev}
            onNext={pager.next}
            onGoto={pager.setPage}
            label="issuers"
          />
        </div>
      )}

      {showUpload && (
        <UploadSheetModal
          columns={merchantColumns}
          labels={merchantLabels}
          existingRows={merchants}
          identityField="name"
          entityLabel="issuer"
          existingHint="Existing issuer cards are identified by issuer name and updated in place."
          newHint="New issuers are added at the top of this list."
          onClose={() => setShowUpload(false)}
          onUpdateExisting={updateExisting}
          onAddNew={addMerchants}
        />
      )}

      {showCreate && (
        <CreateMerchantModal
          existingNames={merchantNames}
          instances={instances}
          defaultInstanceId={currentInstanceId}
          isDuplicateInInstance={isDuplicateInInstance}
          onClose={() => setShowCreate(false)}
          onCreate={createManualMerchant}
        />
      )}

      {statusTarget && (
        <StatusConfirmModal
          issuer={statusTarget}
          deactivating={isActive(statusTarget)}
          onClose={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />
      )}

      {cloneSource && (
        <CreateMerchantModal
          existingNames={merchantNames}
          instances={instances}
          defaultInstanceId={currentInstanceId}
          isDuplicateInInstance={isDuplicateInInstance}
          initialName={`${cloneSource.name} (Copy)`}
          initialRevisedBy={cloneSource.revisedBy || ''}
          initialReviewer={cloneSource.reviewer || ''}
          title="Clone Issuer"
          subtitle={`Copy “${cloneSource.name}” and its SOP sheets into an instance`}
          submitLabel="Create Clone"
          onClose={() => setCloneSource(null)}
          onCreate={cloneIssuer}
        />
      )}
    </div>
  )
}
