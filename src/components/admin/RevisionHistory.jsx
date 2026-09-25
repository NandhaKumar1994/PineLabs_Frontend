import { useMemo, useState } from 'react'
import { Search, Download, ChevronDown, Archive, FileClock, Eye } from 'lucide-react'
import { revisions, REVISION_COLUMNS, REVISION_LABELS } from '../../data/revisions'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import { useRole } from '../../theme/RoleContext'
import ImportHistoryModal from './ImportHistoryModal'
import RevisionDetailModal from './RevisionDetailModal'
import { downloadCsv, serializeCsv } from '../../utils/csv'

const uniqueSorted = (rows, key) =>
  [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort()

export default function RevisionHistory() {
  const { perms } = useRole()
  const [entries, setEntries] = useState(() => [...revisions])
  const [query, setQuery] = useState('')
  const [instance, setInstance] = useState('All')
  const [issuer, setIssuer] = useState('All')
  const [showImport, setShowImport] = useState(false)
  // Revision whose itemised changes are being viewed.
  const [detailTarget, setDetailTarget] = useState(null)
  const debounced = useDebounce(query, 200)

  // Imported rows join the list, newest first by date.
  const importHistory = (rows) => {
    setEntries((prev) => [...rows, ...prev])
    setQuery('')
    setInstance('All')
    setIssuer('All')
  }

  const instanceOptions = useMemo(() => uniqueSorted(entries, 'instance'), [entries])
  // Issuer choices follow the selected instance.
  const issuerOptions = useMemo(
    () =>
      uniqueSorted(
        instance === 'All' ? entries : entries.filter((r) => r.instance === instance),
        'issuer'
      ),
    [entries, instance]
  )

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return entries.filter((r) => {
      if (instance !== 'All' && r.instance !== instance) return false
      if (issuer !== 'All' && r.issuer !== issuer) return false
      if (!q) return true
      return REVISION_COLUMNS.some((c) =>
        String(r[c] || '').toLowerCase().includes(q)
      )
    })
  }, [debounced, entries, instance, issuer])

  const pager = usePagination(filtered, 15)

  const changeInstance = (v) => {
    setInstance(v)
    setIssuer('All')
  }

  const exportLog = () => {
    const cols = [...REVISION_COLUMNS, 'changeCount', 'changeDetail', 'source']
    const labels = {
      ...REVISION_LABELS,
      changeCount: 'Changes',
      changeDetail: 'Change Detail',
      source: 'Source',
    }
    const rows = filtered.map((r) => ({
      ...r,
      changeCount: r.changes?.length || 0,
      // Flatten the itemised changes into one cell for the export.
      changeDetail: (r.changes || [])
        .map((c) => {
          const where = c.sheet ? `${c.sheet}: ` : ''
          const diff =
            c.before !== undefined || c.after !== undefined
              ? ` (${c.field ? `${c.field} ` : ''}${c.before ?? ''}${
                  c.before !== undefined && c.after !== undefined ? ' -> ' : ''
                }${c.after ?? ''})`
              : ''
          return `${where}${c.summary}${diff}`
        })
        .join(' | '),
      source: r.migrated ? 'Migrated' : 'System',
    }))
    downloadCsv('revision-history.csv', serializeCsv(cols, labels, rows))
  }

  const migratedCount = entries.filter((r) => r.migrated).length

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* summary */}
      <div className="grid shrink-0 grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {[
          { icon: FileClock, label: 'Total Revisions', value: entries.length },
          { icon: Archive, label: 'Migrated Entries', value: migratedCount },
          { icon: Search, label: 'Showing', value: filtered.length },
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
            <div className="relative w-48 sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search issuer, ticket, description"
                className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <Select value={instance} onChange={changeInstance} label="All instances" options={instanceOptions} />
            <Select value={issuer} onChange={setIssuer} label="All issuers" options={issuerOptions} />
          </div>

          <div className="flex items-center gap-2">
            {perms.canManageUsers && (
              <button
                type="button"
                onClick={() => setShowImport(true)}
                title="One-time migration of the historical revision log"
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
              >
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline">Import Historical Log</span>
              </button>
            )}
            <button
              onClick={exportLog}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Log</span>
            </button>
          </div>
        </div>

        {/* table */}
        <div className="nice-scroll min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-white">
                {REVISION_COLUMNS.map((c) => (
                  <th
                    key={c}
                    className={`bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${
                      c === 'description' ? 'min-w-[16rem]' : 'whitespace-nowrap'
                    }`}
                  >
                    {REVISION_LABELS[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pager.pageItems.map((r) => (
                <tr key={r.id} className="align-top transition hover:bg-primary/[0.03]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-body">{r.instance}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-heading">{r.issuer}</span>
                      {r.migrated && (
                        <span
                          title="Migrated from the previous process"
                          className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500"
                        >
                          <Archive className="h-2.5 w-2.5" />
                          Migrated
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                      v{r.version}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-body">{r.date}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-heading">
                    {r.revisedBy}
                  </td>
                  <td className="px-4 py-2.5 text-body">
                    <span className="flex items-start gap-1.5">
                      <span className="min-w-0 flex-1">{r.description}</span>
                      <button
                        type="button"
                        onClick={() => setDetailTarget(r)}
                        title="View the changes captured under this revision"
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-gray-400 transition hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {r.changes?.length > 0 && (
                        <span className="mt-0.5 shrink-0 rounded-full bg-grey-light px-1.5 py-0.5 text-[10px] font-bold text-body">
                          {r.changes.length}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-heading">
                    {r.reviewer || <span className="font-normal text-gray-300">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {r.ticket ? (
                      <span className="rounded-md bg-grey-light px-1.5 py-0.5 text-xs font-semibold text-body">
                        {r.ticket}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {pager.total === 0 && (
                <tr>
                  <td colSpan={REVISION_COLUMNS.length} className="px-4 py-16 text-center text-sm text-body">
                    No revision entries match the current filters.
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
            label="revisions"
          />
        </div>
      </section>

      {showImport && (
        <ImportHistoryModal onClose={() => setShowImport(false)} onImport={importHistory} />
      )}
      {detailTarget && (
        <RevisionDetailModal entry={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  )
}

function Select({ value, onChange, label, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-3 pr-8 text-sm text-body outline-none transition focus:border-primary focus:bg-white"
      >
        <option value="All">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  )
}
