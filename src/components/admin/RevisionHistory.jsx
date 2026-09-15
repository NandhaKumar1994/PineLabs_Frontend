import { useMemo, useState } from 'react'
import { Search, Download, Plus, Pencil, Trash2, Upload, ChevronDown } from 'lucide-react'
import { revisions } from '../../data/revisions'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import { useTheme } from '../../theme/ThemeContext'

const actionMeta = {
  create: { icon: Plus, tint: 'bg-emerald-50 text-emerald-700' },
  update: { icon: Pencil, tint: 'bg-blue-50 text-blue-600' },
  delete: { icon: Trash2, tint: 'bg-red-50 text-red-600' },
  upload: { icon: Upload, tint: 'bg-amber-50 text-amber-700' },
}

export default function RevisionHistory() {
  const { theme } = useTheme()
  const t2 = theme === 'theme2'
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return revisions.filter((r) => {
      const matchesType = type === 'All' || r.type === type
      const matchesQuery =
        !q ||
        [r.user, r.entity, r.target, r.change].some((v) =>
          v.toLowerCase().includes(q)
        )
      return matchesType && matchesQuery
    })
  }, [debounced, type])

  const pager = usePagination(filtered, 25)

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search audit log…"
              className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="relative w-full sm:w-44">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-3 pr-8 text-sm text-body outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            >
              <option value="All">All actions</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
              <option value="upload">Uploaded</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light">
          <Download className="h-4 w-4" />
          Export Log
        </button>
      </div>

      {t2 ? (
        /* Theme 2: vertical timeline layout */
        <div className="min-h-0 flex-1 overflow-auto p-5">
          {pager.total === 0 ? (
            <p className="py-16 text-center text-sm text-body">No matching audit entries.</p>
          ) : (
            <ol className="relative ml-3 border-l border-gray-200">
              {pager.pageItems.map((r) => {
                const meta = actionMeta[r.type] || actionMeta.update
                const Icon = meta.icon
                return (
                  <li key={r.id} className="mb-5 ml-6">
                    <span className={`absolute -left-[13px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-white ${meta.tint}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-heading">
                          {r.user}{' '}
                          <span className="font-normal text-body">{r.action.toLowerCase()}</span>{' '}
                          {r.entity}
                        </p>
                        <span className="text-[11px] text-body">{r.timestamp}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-body">
                        {r.target} · {r.change}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-white">
                {['Timestamp', 'User', 'Action', 'Entity', 'Change'].map((h, i) => (
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
              {pager.pageItems.map((r) => {
                const meta = actionMeta[r.type] || actionMeta.update
                const Icon = meta.icon
                return (
                  <tr key={r.id} className="transition hover:bg-primary/[0.03]">
                    <td className="whitespace-nowrap px-5 py-2.5 text-body">{r.timestamp}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-medium text-heading">{r.user}</td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.tint}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {r.action}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-heading">{r.entity}</p>
                      <p className="text-xs text-body">{r.target}</p>
                    </td>
                    <td className="px-5 py-2.5 text-body">{r.change}</td>
                  </tr>
                )
              })}
              {pager.total === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-body">
                    No matching audit entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
          label="entries"
        />
      </div>
    </section>
  )
}
