import { Ticket } from 'lucide-react'

// Validates a helpdesk ticket reference, e.g. PL-10234 or INC0012345.
export const TICKET_PATTERN = /^[A-Za-z]{2,5}[- ]?\d{3,10}$/

export const isValidTicket = (v) => TICKET_PATTERN.test(String(v || '').trim())

// Shared "Ticket Number" input used by every create / edit / delete form.
// Every data change must be traceable to a ticket.
export default function TicketField({ value, onChange, error, hint, autoFocus = false }) {
  const touched = String(value || '').length > 0
  const invalid = touched && !isValidTicket(value)

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-heading">
        Ticket Number <span className="text-red-500">*</span>
      </span>
      <div className="relative">
        <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. PL-10234"
          className={`w-full rounded-lg border bg-grey-light py-2 pl-9 pr-3 text-sm text-heading outline-none transition focus:bg-white focus:ring-2 ${
            invalid || error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-gray-200 focus:border-primary focus:ring-primary/10'
          }`}
        />
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      ) : invalid ? (
        <span className="mt-1 block text-xs text-red-500">
          Enter a valid ticket reference, e.g. PL-10234.
        </span>
      ) : (
        <span className="mt-1 block text-[11px] text-body">
          {hint || 'Required for the audit trail — links this change to a helpdesk ticket.'}
        </span>
      )}
    </label>
  )
}
