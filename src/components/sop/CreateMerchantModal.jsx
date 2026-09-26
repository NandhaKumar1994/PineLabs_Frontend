import { useState } from 'react'
import { X, Store, Plus, User, UserCheck } from 'lucide-react'
import TicketField, { isValidTicket } from '../common/TicketField'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

// Manual "Create Issuer" form. After creating, the issuer appears in the
// list with a "New" badge; the SOP details sheet can then be imported.
export default function CreateMerchantModal({
  existingNames = [],
  instances = [],
  defaultInstanceId = '',
  // (instanceId, name) => boolean - true when that instance already has the name.
  isDuplicateInInstance,
  initialName = '',
  initialRevisedBy = '',
  initialReviewer = '',
  title = 'Create Issuer',
  subtitle = 'Add an issuer manually; import its SOP details afterwards',
  submitLabel = 'Create Issuer',
  onClose,
  onCreate,
}) {
  const [name, setName] = useState(initialName)
  const [instanceId, setInstanceId] = useState(defaultInstanceId)
  const [revisedBy, setRevisedBy] = useState(initialRevisedBy)
  const [reviewer, setReviewer] = useState(initialReviewer)
  const [ticket, setTicket] = useState('')

  const trimmed = name.trim()
  // Duplicate check is scoped to the selected instance when the caller provides
  // a resolver; otherwise it falls back to the names passed in.
  const duplicate = isDuplicateInInstance
    ? !!instanceId && isDuplicateInInstance(instanceId, trimmed)
    : existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())

  const valid =
    trimmed &&
    !duplicate &&
    !!instanceId &&
    revisedBy.trim() &&
    reviewer.trim() &&
    isValidTicket(ticket)

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onCreate({
      name: trimmed,
      instanceId,
      revisedBy: revisedBy.trim(),
      reviewer: reviewer.trim(),
      ticket: ticket.trim(),
      manualEntry: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Store className="h-5 w-5" />
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

        <div className="nice-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-heading">
              Issuer Name <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summit Retail"
              className={inputCls}
            />
            {duplicate && (
              <span className="mt-1 block text-xs text-red-500">
                An issuer named "{trimmed}" already exists in{' '}
                {instances.find((i) => i.id === instanceId)?.name || 'this instance'}.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-heading">
              Instance <span className="text-red-500">*</span>
            </span>
            <select
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              className={inputCls}
            >
              <option value="" disabled>
                Select an instance
              </option>
              {instances.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-heading">
                Revised By <span className="text-red-500">*</span>
              </span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={revisedBy}
                  onChange={(e) => setRevisedBy(e.target.value)}
                  placeholder="Name"
                  className={`${inputCls} pl-9`}
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
                  className={`${inputCls} pl-9`}
                />
              </div>
            </label>
          </div>

          <TicketField value={ticket} onChange={setTicket} />

          <p className="rounded-lg bg-grey-light px-3 py-2 text-xs text-body">
            The issuer is created with empty SOP sheets. Open it and use{' '}
            <span className="font-semibold text-heading">Import Data</span> to upload its details.
          </p>
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
            <Plus className="h-4 w-4" />
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
