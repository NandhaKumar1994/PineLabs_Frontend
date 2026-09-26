import { useEffect } from 'react'
import {
  X,
  FileClock,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Columns3,
  Type,
  ArrowRight,
  Archive,
} from 'lucide-react'

const typeMeta = {
  create: { icon: Plus, tint: 'bg-emerald-50 text-emerald-700', label: 'Added' },
  update: { icon: Pencil, tint: 'bg-blue-50 text-blue-600', label: 'Updated' },
  delete: { icon: Trash2, tint: 'bg-red-50 text-red-600', label: 'Deleted' },
  upload: { icon: Upload, tint: 'bg-amber-50 text-amber-700', label: 'Imported' },
  column: { icon: Columns3, tint: 'bg-violet-50 text-violet-600', label: 'Column' },
  rename: { icon: Type, tint: 'bg-teal-50 text-teal-700', label: 'Renamed' },
}

const Added = ({ children }) => (
  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
    {children}
  </span>
)

const Removed = ({ children }) => (
  <span className="rounded-md bg-red-50 px-1.5 py-0.5 font-semibold text-red-600 line-through decoration-red-300 ring-1 ring-red-200">
    {children}
  </span>
)

// Shows the itemised changes captured under a single revision entry.
export default function RevisionDetailModal({ entry, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const changes = entry.changes || []

  // Group the change list by the SOP sheet it applies to.
  const bySheet = changes.reduce((acc, c) => {
    const k = c.sheet || 'General'
    ;(acc[k] = acc[k] || []).push(c)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary">
              <FileClock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-bold text-heading">
                <span className="truncate">{entry.issuer}</span>
                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                  v{entry.version}
                </span>
                {entry.migrated && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    <Archive className="h-2.5 w-2.5" />
                    Migrated
                  </span>
                )}
              </h2>
              <p className="truncate text-xs text-body">
                {entry.instance} · {entry.date} · Revised by {entry.revisedBy}
                {entry.reviewer ? ` · Reviewed by ${entry.reviewer}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-body transition hover:bg-grey-light"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* summary line + ticket */}
        <div className="shrink-0 border-b border-gray-100 bg-grey-light/50 px-5 py-3">
          <p className="text-sm text-heading">{entry.description}</p>
          {entry.ticket && (
            <p className="mt-1.5 text-xs text-body">
              Ticket{' '}
              <span className="rounded-md bg-white px-1.5 py-0.5 font-semibold text-heading ring-1 ring-gray-200">
                {entry.ticket}
              </span>
            </p>
          )}
        </div>

        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto p-5">
          {changes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-grey-light/40 px-4 py-8 text-center">
              <Archive className="mx-auto h-6 w-6 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-heading">No itemised detail</p>
              <p className="mt-0.5 text-xs text-body">
                This entry was migrated from the previous process, which recorded only the summary
                above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-body">Added / new value</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                  <span className="text-body">Removed / previous value</span>
                </span>
                <span className="ml-auto font-semibold text-body">
                  {changes.length} change{changes.length === 1 ? '' : 's'}
                </span>
              </div>

              {Object.entries(bySheet).map(([sheet, list]) => (
                <div key={sheet} className="space-y-1.5">
                  <p className="flex items-center gap-2 text-xs font-bold text-heading">
                    {sheet}
                    <span className="font-normal text-body">
                      {list.length} change{list.length === 1 ? '' : 's'}
                    </span>
                  </p>
                  <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
                    {list.map((c, i) => {
                      const meta = typeMeta[c.type] || typeMeta.update
                      const Icon = meta.icon
                      const hasBefore = c.before !== undefined && c.before !== ''
                      const hasAfter = c.after !== undefined && c.after !== ''
                      return (
                        <li key={i} className="flex items-start gap-3 px-3 py-2.5">
                          <span
                            className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${meta.tint}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.tint}`}
                              >
                                {meta.label}
                              </span>
                              <span className="font-medium text-heading">{c.summary}</span>
                            </p>
                            {(hasBefore || hasAfter) && (
                              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                                {c.field && (
                                  <span className="font-medium text-heading">{c.field}:</span>
                                )}
                                {hasBefore && <Removed>{String(c.before)}</Removed>}
                                {hasBefore && hasAfter && (
                                  <ArrowRight className="h-3 w-3 shrink-0 text-gray-400" />
                                )}
                                {hasAfter && <Added>{String(c.after)}</Added>}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
