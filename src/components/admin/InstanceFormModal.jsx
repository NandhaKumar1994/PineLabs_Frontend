import { useEffect, useState } from 'react'
import { X, Layers, Plus, Pencil, Copy, Check } from 'lucide-react'
import TicketField, { isValidTicket } from '../common/TicketField'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

// Create / edit / clone an instance.
export default function InstanceFormModal({
  initial,
  mode = initial ? 'edit' : 'create',
  existingNames = [],
  onClose,
  onSubmit,
}) {
  const isEdit = mode === 'edit'
  const isClone = mode === 'clone'
  const [name, setName] = useState(
    isClone ? `${initial?.name ?? ''} (Copy)` : initial?.name ?? ''
  )
  const [status, setStatus] = useState(initial?.status ?? 'Active')
  // Clone only: carry the source instance's issuers across.
  const [copyIssuers, setCopyIssuers] = useState(true)
  const [ticket, setTicket] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const trimmed = name.trim()
  // On edit the instance's own name is allowed; on clone it is not.
  const ownName = isEdit ? (initial?.name ?? '').toLowerCase() : '\u0000'
  const duplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== ownName
  )
  const valid = trimmed && !duplicate && isValidTicket(ticket)

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSubmit({
      name: trimmed,
      status,
      copyIssuers,
      ticket: ticket.trim(),
    })
    onClose()
  }

  const heading = isEdit ? 'Edit Instance' : isClone ? 'Clone Instance' : 'Create Instance'
  const sub = isEdit
    ? 'Update this instance’s details'
    : isClone
      ? `Copy “${initial?.name}” into a new instance`
      : 'Group issuers under a new instance'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              {isClone ? <Copy className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">{heading}</h2>
              <p className="text-xs text-body">{sub}</p>
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
              Instance Name <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Zone"
              className={inputCls}
            />
            {duplicate && (
              <span className="mt-1 block text-xs text-red-500">
                An instance with this name already exists.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-heading">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          {isClone && (
            <button
              type="button"
              onClick={() => setCopyIssuers((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-grey-light/60 px-3 py-2.5 text-left transition hover:bg-grey-light"
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                  copyIssuers ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                }`}
              >
                {copyIssuers && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-heading">
                  Copy the {initial?.issuerIds?.length || 0} linked issuer
                  {(initial?.issuerIds?.length || 0) === 1 ? '' : 's'}
                </span>
                <span className="block text-[11px] text-body">
                  The same issuers will also belong to the new instance.
                </span>
              </span>
            </button>
          )}

          <TicketField value={ticket} onChange={setTicket} />
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
            {isEdit ? <Pencil className="h-4 w-4" /> : isClone ? <Copy className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : isClone ? 'Create Clone' : 'Create Instance'}
          </button>
        </div>
      </form>
    </div>
  )
}
