import { useEffect, useState } from 'react'
import { Trash2, X, AlertTriangle, User, UserCheck } from 'lucide-react'
import TicketField, { isValidTicket } from '../common/TicketField'

const auditInputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 pl-9 pr-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

// Confirms deleting an instance. Warns when issuers are still attached.
// Captures the mandatory audit trail (Revised By / Reviewer / Ticket
// Number) and passes it to onConfirm(ticket, { revisedBy, reviewer }).
export default function DeleteInstanceModal({ instance, onClose, onConfirm }) {
  const [ticket, setTicket] = useState('')
  const [revisedBy, setRevisedBy] = useState('')
  const [reviewer, setReviewer] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const count = instance.issuerIds?.length || 0
  const valid = isValidTicket(ticket) && revisedBy.trim() && reviewer.trim()

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-bold text-heading">Delete Instance</h2>
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
            Delete <span className="font-semibold text-heading">{instance.name}</span>?
          </p>
          {count > 0 && (
            <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {count} issuer{count === 1 ? '' : 's'} are grouped under this instance. They stay in
                the system but will no longer belong to any instance.
              </span>
            </p>
          )}
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
            disabled={!valid}
            onClick={() => onConfirm(ticket.trim(), { revisedBy: revisedBy.trim(), reviewer: reviewer.trim() })}
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
