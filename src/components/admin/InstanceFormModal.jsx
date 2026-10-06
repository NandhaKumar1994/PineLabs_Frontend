import { useEffect, useState } from 'react'
import { X, Layers, Plus, Pencil, Copy, Check } from 'lucide-react'
import TicketField, { isValidTicket } from '../common/TicketField'
import Select from '../common/Select'
import BrandLoader from '../common/BrandLoader'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

// Create / edit / clone an instance. `columns` are the custom column
// definitions ({key,label,type,required,options,defaultValue}); one
// input is rendered per column (type-appropriate), required ones marked
// with a * and enforced.
export default function InstanceFormModal({
  initial,
  mode = initial ? 'edit' : 'create',
  existingNames = [],
  columns = [],
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
  // On edit, pre-fill the instance's current ticket reference so it isn't
  // blank when the modal opens — same as `name`/`status` above. On
  // create/clone there is nothing to pre-fill from.
  const [ticket, setTicket] = useState(isEdit ? initial?.ticket ?? '' : '')

  // Custom field values keyed by column key. Pre-filled from the
  // instance's existing customFields on edit; blank on create (the
  // backend applies defaults for optional blanks -> NA).
  const [customValues, setCustomValues] = useState(() => {
    const cf = initial?.customFields || {}
    return Object.fromEntries(
      columns.map((c) => {
        const v = cf[c.key]
        // Don't pre-seed the "NA" placeholder into the input — show blank.
        return [c.key, v === undefined || v === null || String(v).toUpperCase() === 'NA' ? '' : String(v)]
      })
    )
  })

  const setCustomValue = (key, value) => setCustomValues((prev) => ({ ...prev, [key]: value }))

  // In-flight state for the branded loader shown while the create/edit/
  // clone request is being saved.
  const [submitting, setSubmitting] = useState(false)

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
  // Every required custom column must have a non-blank value.
  const missingRequired = columns.some(
    (c) => c.required && !String(customValues[c.key] ?? '').trim()
  )
  const valid = trimmed && !duplicate && isValidTicket(ticket) && !missingRequired && !submitting

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) return
    // Only send non-blank custom values; the backend fills blanks with
    // the column default / NA. Keyed by column key.
    const customFields = {}
    columns.forEach((c) => {
      const v = String(customValues[c.key] ?? '').trim()
      if (v) customFields[c.key] = v
    })
    setSubmitting(true)
    try {
      // onSubmit returns the ok boolean (see InstanceManagement's
      // addInstance/saveEdit). It closes the modal itself on success; on
      // failure it keeps the modal open with the error banner, so we do
      // NOT close here. The loader shows for the whole request.
      const ok = await onSubmit({
        name: trimmed,
        status,
        copyIssuers,
        ticket: ticket.trim(),
        customFields,
      })
      if (ok === false) setSubmitting(false)
      // On success the parent unmounts this modal, so no need to reset.
    } catch {
      setSubmitting(false)
    }
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
        {/* Branded loader while the instance is being saved. */}
        {submitting && (
          <BrandLoader label={isEdit ? 'Saving changes…' : isClone ? 'Cloning instance…' : 'Creating instance…'} />
        )}

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

          <div>
            <span className="mb-1 block text-xs font-semibold text-heading">Status</span>
            <Select
              value={status}
              onChange={setStatus}
              options={['Active', 'Inactive']}
              ariaLabel="Status"
            />
          </div>

          {/* Custom columns — one input per definition, type-appropriate.
              A required column shows the * marker and gates the submit
              button (same as the built-in required fields), but no inline
              "required" error text — consistent with Instance Name /
              Ticket Number above. */}
          {columns.map((col) => {
            const value = customValues[col.key] ?? ''
            // NOTE: this field is a <div>, NOT a <label>. The dropdown
            // (Select) is a button-based custom widget; wrapping it in a
            // <label> made a click on an option ALSO forward to the
            // trigger button, which reopened the dropdown right after
            // selecting — so it looked like the selection "didn't take"
            // until a second click. A plain <div> avoids that redirect.
            const isDropdown = col.type === 'dropdown'
            return (
              <div key={col.key} className="block">
                <span className="mb-1 block text-xs font-semibold text-heading">
                  {col.label}
                  {col.required && <span className="text-red-500"> *</span>}
                </span>
                {isDropdown ? (
                  <Select
                    value={value}
                    onChange={(v) => setCustomValue(col.key, v)}
                    options={col.options || []}
                    placeholder="Select…"
                    ariaLabel={col.label}
                  />
                ) : (
                  <input
                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    value={value}
                    onChange={(e) => setCustomValue(col.key, e.target.value)}
                    placeholder=""
                    className={inputCls}
                  />
                )}
              </div>
            )
          })}

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
