import { useEffect, useState } from 'react'
import { X, Ticket, Check, ArrowRight, Lock } from 'lucide-react'
import TicketField, { isValidTicket } from './TicketField'
import BrandLoader from './BrandLoader'

// Asks for a ticket number before committing a change. Optionally shows the
// pending before/after value so the user can confirm what they are saving.
//
// Two optional read-only behaviors (used by Instance Management; other
// callers like BIN Series pass neither and get the original editable
// ticket flow unchanged):
//   - readOnlyTicket: when set, the ticket is NOT editable — it's shown
//     as a locked, auto-populated box and confirmed with this exact
//     value. Used when editing a non-ticket field (e.g. Instance Name):
//     the change is tied to the record's EXISTING ticket, which the user
//     may not change here.
//   - contextField { label, value }: an extra read-only box shown above
//     the ticket, auto-populated. Used when editing the Ticket Number
//     itself, to show which Instance (read-only) the ticket belongs to.
export default function TicketCaptureModal({
  title = 'Confirm Change',
  subtitle = 'Enter the ticket this change relates to',
  field,
  before,
  after,
  readOnlyTicket,
  readOnlyTicketHint = 'Change is linked to this instance’s existing ticket.',
  contextField,
  onClose,
  onConfirm,
}) {
  const ticketLocked = readOnlyTicket !== undefined && readOnlyTicket !== null
  const [ticket, setTicket] = useState(ticketLocked ? String(readOnlyTicket) : '')
  // In-flight state for the branded loader while the change is saved.
  // We await onConfirm so callers whose handler is async (e.g. the row
  // "Save Change" update) show the loader for the whole request.
  const [submitting, setSubmitting] = useState(false)
  // Server-side error (e.g. "'Total Count' must be a number") surfaced
  // by onConfirm throwing — shown INSIDE this modal so the user sees it
  // right where they acted, and the modal stays open to retry/fix.
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  // When the ticket is locked/auto-populated, it's always valid to
  // confirm (there's a real existing ticket); otherwise it must be a
  // non-blank ticket the user typed.
  const valid = ticketLocked ? String(readOnlyTicket).trim().length > 0 : isValidTicket(ticket)

  const submit = async (e) => {
    e.preventDefault()
    if (!valid || submitting) return
    setError('')
    setSubmitting(true)
    try {
      // onConfirm may be async (e.g. it PATCHes the instance). Awaiting
      // it keeps the loader up until the request settles. On success the
      // parent usually unmounts this modal. If onConfirm THROWS, the save
      // failed (e.g. a datatype validation error) — we show that message
      // inline here and keep the modal open so the user can fix/retry.
      await onConfirm(ticketLocked ? String(readOnlyTicket).trim() : ticket.trim())
      setSubmitting(false)
    } catch (err) {
      setError(err?.message || 'Could not save the change.')
      setSubmitting(false)
    }
  }

  const hasDiff = before !== undefined || after !== undefined

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Branded loader while the change is being saved. */}
        {submitting && <BrandLoader label="Saving change…" />}

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

          {/* Read-only context (e.g. the Instance name) shown when editing
              the ticket number itself, auto-populated and non-editable. */}
          {contextField && (
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-heading">
                {contextField.label}
                <Lock className="h-3 w-3 text-gray-400" />
              </span>
              <input
                value={contextField.value ?? ''}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-body outline-none"
              />
            </label>
          )}

          {ticketLocked ? (
            // Editing a non-ticket field: the ticket is the record's
            // existing one, auto-populated and read-only.
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-heading">
                Ticket Number
                <Lock className="h-3 w-3 text-gray-400" />
              </span>
              <input
                value={ticket}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-body outline-none"
              />
              <span className="mt-1 block text-[11px] text-body">{readOnlyTicketHint}</span>
            </label>
          ) : (
            <TicketField autoFocus value={ticket} onChange={setTicket} />
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
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
            type="submit"
            disabled={!valid || submitting}
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
