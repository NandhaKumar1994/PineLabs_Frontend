import { useEffect, useState } from 'react'
import { X, History, Plus, Pencil, Trash2, Upload, Columns3, Type, ArrowRight, Eye, Ticket } from 'lucide-react'
import ChangePreviewModal from './ChangePreviewModal'

const actionMeta = {
  create: { icon: Plus, tint: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-100', label: 'Added' },
  update: { icon: Pencil, tint: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100', label: 'Updated' },
  delete: { icon: Trash2, tint: 'bg-red-50 text-red-600', ring: 'ring-red-100', label: 'Deleted' },
  upload: { icon: Upload, tint: 'bg-amber-50 text-amber-700', ring: 'ring-amber-100', label: 'Imported' },
  column: { icon: Columns3, tint: 'bg-violet-50 text-violet-600', ring: 'ring-violet-100', label: 'Column' },
  rename: { icon: Type, tint: 'bg-teal-50 text-teal-700', ring: 'ring-teal-100', label: 'Renamed' },
}

// Green chip = value added / new. Red chip = value removed / previous.
function Added({ children }) {
  return (
    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
      {children === '' || children == null ? <em className="font-normal text-emerald-600">empty</em> : children}
    </span>
  )
}

function Removed({ children }) {
  return (
    <span className="rounded-md bg-red-50 px-1.5 py-0.5 font-semibold text-red-600 line-through decoration-red-300 ring-1 ring-red-200">
      {children === '' || children == null ? <em className="font-normal no-underline text-red-500">empty</em> : children}
    </span>
  )
}

// Renders one field's before → after pair with colour coding.
function FieldDiff({ field, before, after }) {
  const hasBefore = before !== undefined && before !== null && String(before) !== ''
  const hasAfter = after !== undefined && after !== null && String(after) !== ''

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {field && <span className="font-medium text-heading">{field}:</span>}
      {hasBefore && <Removed>{String(before)}</Removed>}
      {hasBefore && hasAfter && <ArrowRight className="h-3 w-3 shrink-0 text-gray-400" />}
      {hasAfter && <Added>{String(after)}</Added>}
      {!hasBefore && !hasAfter && <span className="text-body">—</span>}
    </div>
  )
}

// Shows the most recent changes made to a sheet / table.
export default function VersionHistoryModal({ title, subtitle, entries = [], limit = 5, onClose }) {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      // Let the preview modal handle Escape while it's open.
      if (e.key !== 'Escape' || preview) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, preview])

  const recent = entries.slice(0, limit)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <History className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">{title || 'Version History'}</h2>
              <p className="text-xs text-body">{subtitle || `Last ${limit} changes`}</p>
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

        {/* legend so the colours are unambiguous */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 bg-grey-light/50 px-5 py-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-body">Added / new value</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            <span className="text-body">Removed / previous value</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            <span className="text-body">Edited</span>
          </span>
        </div>

        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto p-5">
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-body">No changes recorded yet.</p>
          ) : (
            <ol className="relative ml-3 border-l border-gray-200">
              {recent.map((e, i) => {
                const meta = actionMeta[e.type] || actionMeta.update
                const Icon = meta.icon
                // A change can describe one field, several fields, or just text.
                const fields = e.fields?.length
                  ? e.fields
                  : e.field || e.before !== undefined || e.after !== undefined
                    ? [{ field: e.field, before: e.before, after: e.after }]
                    : []

                return (
                  <li key={e.id || i} className="mb-4 ml-6 last:mb-0">
                    <span
                      className={`absolute -left-[13px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-white ${meta.tint}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${meta.tint}`}
                        >
                          {e.action || meta.label}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="text-[11px] text-body">{e.at}</span>
                          <button
                            type="button"
                            onClick={() => setPreview(e)}
                            title="View this change in the table"
                            className="grid h-6 w-6 place-items-center rounded-md text-gray-400 transition hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-body">{e.change}</p>

                      {fields.length > 0 && (
                        <div className="mt-2 space-y-1.5 rounded-md bg-grey-light/60 p-2">
                          {fields.map((f, fi) => (
                            <FieldDiff key={fi} {...f} />
                          ))}
                        </div>
                      )}

                      <div className="mt-1.5 flex items-center gap-2">
                        {e.ticket && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            <Ticket className="h-2.5 w-2.5" />
                            {e.ticket}
                          </span>
                        )}
                        {e.by && <p className="text-[11px] text-gray-400">by {e.by}</p>}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      {preview && (
        <ChangePreviewModal entry={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
