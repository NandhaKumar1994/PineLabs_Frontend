import { useMemo, useState } from 'react'
import {
  Upload,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Copy,
  Check,
  X,
} from 'lucide-react'
import { binSeries } from '../../data/binSeries'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'

const columnLabels = {
  issuer: 'Issuer',
  cardProgramGroupName: 'Card Program Group Name',
  binIin: 'BIN / IIN Code',
  merchantPrefix: 'Merchant Prefix',
}

const humanize = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()

export default function BinTable() {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(null)

  const columns = useMemo(
    () => (binSeries[0] ? Object.keys(binSeries[0]) : []),
    []
  )

  const debouncedQuery = useDebounce(query, 200)

  const rows = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return binSeries
    return binSeries.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [debouncedQuery])

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
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-body transition hover:bg-grey-light">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Row</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Sheet</span>
          </button>
        </div>
      </div>

      {/* table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-100 bg-white">
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {columnLabels[col] || humanize(col)}
                </th>
              ))}
              <th className="w-12 bg-white px-5 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pager.pageItems.map((row, i) => (
              <tr key={i} className="group transition hover:bg-primary/[0.03]">
                {columns.map((col) =>
                  col === 'issuer' ? (
                    <td key={col} className="whitespace-nowrap px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-heading">{row[col]}</span>
                        <button
                          onClick={() => copy(row[col], `${i}-issuer`)}
                          title="Copy issuer name"
                          className={`grid h-6 w-6 place-items-center rounded-md transition ${
                            copied === `${i}-issuer`
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'text-gray-300 opacity-0 hover:bg-grey-light hover:text-primary group-hover:opacity-100'
                          }`}
                        >
                          {copied === `${i}-issuer` ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  ) : col === 'binIin' || col === 'merchantPrefix' ? (
                    <td key={col} className="whitespace-nowrap px-5 py-2.5">
                      <span className="rounded bg-grey-light px-2 py-0.5 text-xs font-medium tracking-wide text-heading">
                        {row[col]}
                      </span>
                    </td>
                  ) : (
                    <td key={col} className="whitespace-nowrap px-5 py-2.5 text-body">
                      {row[col]}
                    </td>
                  )
                )}
                <td className="px-5 py-2.5 text-right">
                  <button className="grid h-7 w-7 place-items-center rounded-md text-gray-300 transition hover:bg-gray-100 hover:text-heading">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
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
    </section>
  )
}
