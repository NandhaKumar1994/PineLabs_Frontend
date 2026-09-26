import { useEffect, useState } from 'react'
import { X, Ticket, Check, ArrowRight } from 'lucide-react'
import TicketField, { isValidTicket } from './TicketField'

// Asks for a ticket number before committing a change. Optionally shows the
// pending before/after value so the user can confirm what they are saving.
export default function TicketCaptureModal({
  title = 'Confirm Change',
  subtitle = 'Enter the ticket this change relates to',
  field,
  before,
  after,
  onClose,
  onConfirm,
}) {
  const [ticket, setTicket] = useState('')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const valid = isValidTicket(ticket)

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onConfirm(ticket.trim())
  }

  const hasDiff = before !== undefined || after !== undefined

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Ticket className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">{title}</h2>
              <p className="text-xs text-body">{subtitle}</p>
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

        <div className="space-y-3 p-5">
          {hasDiff && (
            <div className="rounded-lg bg-grey-light/60 p-3">
              {field && (
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {field}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-md bg-red-50 px-1.5 py-0.5 font-semibold text-red-600 line-through decoration-red-300 ring-1 ring-red-200">
                  {String(before ?? '') || 'empty'}
                </span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {String(after ?? '') || 'empty'}
                </span>
              </div>
            </div>
          )}

          <TicketField autoFocus value={ticket} onChange={setTicket} />
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
            type="submit"
            disabled={!valid}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Save Change
          </button>
        </div>
      </form>
    </div>
  )
}
