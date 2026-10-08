import { useEffect, useState } from 'react'
import { Trash2, X, AlertTriangle, User, UserCheck } from 'lucide-react'
import TicketField, { isValidTicket } from '../common/TicketField'
import BrandLoader from '../common/BrandLoader'

const auditInputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 pl-9 pr-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

// Confirms deleting a CUSTOM instance column. Deleting a column also
// strips its value from every instance, so we warn before proceeding —
// styled like the other admin modals rather than a native window.confirm.
// A ticket number must be entered (same as deleting an instance row);
// onConfirm receives it. onConfirm may be async and may throw, in which
// case the error is shown inline and the modal stays open.
export default function DeleteColumnModal({ column, instanceCount = 0, onClose, onConfirm }) {
  const [ticket, setTicket] = useState('')
  const [revisedBy, setRevisedBy] = useState('')
  const [reviewer, setReviewer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const valid = isValidTicket(ticket) && revisedBy.trim() && reviewer.trim()

  const confirm = async () => {
    if (!valid || submitting) return
    setError('')
    setSubmitting(true)
    try {
      await onConfirm(ticket.trim(), { revisedBy: revisedBy.trim(), reviewer: reviewer.trim() })
      setSubmitting(false)
    } catch (err) {
      setError(err?.message || 'Could not delete the column.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {submitting && <BrandLoader label="Deleting column…" />}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-bold text-heading">Delete Column</h2>
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

        <div className="px-5 py-4 text-sm text-body">
          <p>
            Delete the column <span className="font-semibold text-heading">{column.label}</span>?
          </p>
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Its value is removed from{' '}
              {instanceCount > 0 ? (
                <>
                  all <span className="font-semibold">{instanceCount.toLocaleString()}</span> instances
                </>
              ) : (
                'every instance'
              )}
              .
            </span>
          </p>
          <p className="mt-2 text-xs">This action cannot be undone.</p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-heading">
                Revised By <span className="text-red-500">*</span>
              </span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={revisedBy}
                  onChange={(e) => setRevisedBy(e.target.value)}
                  placeholder="Name"
                  className={auditInputCls}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-heading">
                Reviewer <span className="text-red-500">*</span>
              </span>
              <div className="relative">
                <UserCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  placeholder="Name"
                  className={auditInputCls}
                />
              </div>
            </label>
          </div>

          <div className="mt-3">
            <TicketField value={ticket} onChange={setTicket} />
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <span className="min-w-0 flex-1">{error}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || submitting}
            onClick={confirm}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
