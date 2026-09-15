import { useEffect, useMemo, useState } from 'react'
import { Search, Download, Filter, X, ChevronDown } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'

const groupTint = ['bg-primary/5 text-primary', 'bg-amber-50 text-amber-700', 'bg-teal-50 text-teal-700']

export default function SopSheet({ sheet, title }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({}) // { column: value }
  const [showFilters, setShowFilters] = useState(false)

  const flatColumns = useMemo(
    () => sheet.groups.flatMap((g) => g.columns),
    [sheet]
  )

  // Reset search + filters whenever the active subsheet changes, since
  // columns differ between sheets.
  useEffect(() => {
    setQuery('')
    setFilters({})
    setShowFilters(false)
  }, [sheet])

  // unique values per column for the filter dropdowns
  const columnValues = useMemo(() => {
    const map = {}
    flatColumns.forEach((col) => {
      map[col] = [...new Set(sheet.rows.map((r) => r[col]))].filter(Boolean).sort()
    })
    return map
  }, [flatColumns, sheet])

  const debouncedQuery = useDebounce(query, 200)

  const rows = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return sheet.rows.filter((r) => {
      // text search across all cells
      if (q && !Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
        return false
      // per-column filters
      for (const [col, val] of Object.entries(filters)) {
        if (val && r[col] !== val) return false
      }
      return true
    })
  }, [debouncedQuery, filters, sheet])

  const pager = usePagination(rows, 50)

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
                {sheet.rows.length}
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
      <div className="max-h-[46vh] min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {sheet.groups.map((g, gi) => (
                <th
                  key={g.group}
                  colSpan={g.columns.length}
                  className={`whitespace-nowrap border border-gray-200 px-4 py-2 text-center text-xs font-bold uppercase tracking-wide ${
                    groupTint[gi % groupTint.length]
                  }`}
                >
                  {g.group}
                </th>
              ))}
            </tr>
            <tr>
              {flatColumns.map((col) => (
                <th
                  key={col}
                  className={`whitespace-nowrap border border-gray-200 px-4 py-2 text-xs font-semibold ${
                    filters[col] ? 'bg-primary/10 text-primary' : 'bg-grey-light text-heading'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((row, i) => (
              <tr key={i} className="transition hover:bg-primary/[0.03]">
                {flatColumns.map((col) => (
                  <td
                    key={col}
                    className="whitespace-nowrap border border-gray-100 px-4 py-2 text-body"
                  >
                    <CellValue value={row[col]} />
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={flatColumns.length} className="px-4 py-12 text-center text-sm text-body">
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
