import { useEffect } from 'react'
import { X, Eye, Plus, Pencil, Trash2, Columns3, Type, Upload } from 'lucide-react'

const typeMeta = {
  create: { icon: Plus, tint: 'bg-emerald-50 text-emerald-700', word: 'Added' },
  update: { icon: Pencil, tint: 'bg-blue-50 text-blue-600', word: 'Edited' },
  delete: { icon: Trash2, tint: 'bg-red-50 text-red-600', word: 'Deleted' },
  upload: { icon: Upload, tint: 'bg-amber-50 text-amber-700', word: 'Imported' },
  column: { icon: Columns3, tint: 'bg-violet-50 text-violet-600', word: 'Column added' },
  rename: { icon: Type, tint: 'bg-teal-50 text-teal-700', word: 'Renamed' },
}

const txt = (v) => (v === undefined || v === null || v === '' ? '' : String(v))

// Renders the affected record as a table row, colour-coded by what happened.
export default function ChangePreviewModal({ entry, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const meta = typeMeta[entry.type] || typeMeta.update
  const Icon = meta.icon
  const preview = entry.preview || {}
  const { columns = [], labels = {}, before = null, after = null, changedCols = [], newColumn } = preview

  const label = (c) => labels[c] || c
  const changed = new Set(changedCols)

  // Which rows to render: deletes show the old row, creates the new one,
  // edits show both so the difference is obvious.
  const rows = []
  if (entry.type === 'delete' && before) rows.push({ data: before, kind: 'removed' })
  else if (entry.type === 'create' && after) rows.push({ data: after, kind: 'added' })
  else if (before && after) {
    rows.push({ data: before, kind: 'removed', tag: 'Before' })
    rows.push({ data: after, kind: 'added', tag: 'After' })
  } else if (after) rows.push({ data: after, kind: 'added' })
  else if (before) rows.push({ data: before, kind: 'removed' })

  const rowTint = (kind) =>
    kind === 'added' ? 'bg-emerald-50/60' : kind === 'removed' ? 'bg-red-50/60' : ''

  const cellTint = (col, kind) => {
    const isTarget = changed.size === 0 || changed.has(col) || col === newColumn
    if (!isTarget) return 'text-body'
    if (kind === 'added') return 'bg-emerald-100/70 font-semibold text-emerald-800'
    if (kind === 'removed') return 'bg-red-100/70 font-semibold text-red-700 line-through decoration-red-300'
    return 'text-body'
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${meta.tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">
                {entry.action || meta.word}
              </h2>
              <p className="text-xs text-body">
                {entry.change} · {entry.at}
                {entry.by ? ` · by ${entry.by}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-body transition hover:bg-grey-light"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* legend */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 bg-grey-light/50 px-5 py-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-body">Added / new value</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            <span className="text-body">Removed / previous value</span>
          </span>
          {changed.size > 0 && (
            <span className="ml-auto text-body">
              {changed.size} column{changed.size === 1 ? '' : 's'} affected
            </span>
          )}
        </div>

        <div className="nice-scroll min-h-0 flex-1 overflow-auto p-5">
          {columns.length === 0 || rows.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-grey-light/50 p-4 text-sm text-body">
              <p className="font-medium text-heading">No row snapshot for this change.</p>
              <p className="mt-1 text-xs">{entry.change}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-grey-light text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">State</th>
                    {columns.map((c) => (
                      <th
                        key={c}
                        className={`whitespace-nowrap px-3 py-2 font-semibold ${
                          changed.has(c) || c === newColumn ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        {label(c)}
                        {c === newColumn && (
                          <span className="ml-1 rounded bg-emerald-100 px-1 text-[9px] font-bold text-emerald-700">
                            NEW
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r, i) => (
                    <tr key={i} className={rowTint(r.kind)}>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            r.kind === 'added'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {r.tag || (r.kind === 'added' ? 'Added' : 'Removed')}
                        </span>
                      </td>
                      {columns.map((c) => (
                        <td key={c} className="px-3 py-2">
                          <span className={`inline-block rounded px-1.5 py-0.5 ${cellTint(c, r.kind)}`}>
                            {txt(r.data[c]) || <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
