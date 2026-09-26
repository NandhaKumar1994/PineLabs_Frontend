import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import TicketField, { isValidTicket } from '../common/TicketField'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

const fieldHints = {
  binIin: { maxLength: 6, inputMode: 'numeric', placeholder: '6-digit BIN / IIN' },
  merchantPrefix: { maxLength: 3, inputMode: 'numeric', placeholder: '3-digit prefix' },
}

const humanize = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()

export default function AddRowModal({
  columns,
  labels,
  examples,
  initial,
  groups,
  selectFields = [],
  validateRow,
  requireTicket = false,
  onClose,
  onSubmit,
  title,
  subtitle,
  submitLabel,
}) {
  const isEdit = Boolean(initial)
  const empty = useMemo(
    () =>
      Object.fromEntries([
        ...columns.map((col) => [col, initial?.[col] != null ? String(initial[col]) : '']),
        ...selectFields.map((f) => [f.name, initial?.[f.name] != null ? String(initial[f.name]) : '']),
      ]),
    [columns, initial, selectFields]
  )
  const [form, setForm] = useState(empty)
  const [ticket, setTicket] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (col) => (e) => setForm((f) => ({ ...f, [col]: e.target.value }))

  const requiredSelects = selectFields.filter((f) => f.required !== false)
  const filled =
    columns.every((col) => String(form[col] ?? '').trim()) &&
    requiredSelects.every((f) => String(form[f.name] ?? '').trim())

  // Optional caller-supplied check (e.g. duplicate name within an instance).
  // Returns an error message string, or falsy when the row is acceptable.
  const duplicateError = validateRow ? validateRow(form) : null
  const ticketOk = !requireTicket || isValidTicket(ticket)
  const valid = filled && !duplicateError && ticketOk

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const row = Object.fromEntries([
      ...columns.map((col) => [col, String(form[col]).trim()]),
      ...selectFields.map((f) => [f.name, String(form[f.name] ?? '').trim()]),
    ])
    onSubmit(row, requireTicket ? ticket.trim() : undefined)
    onClose()
  }

  const firstCol = groups?.[0]?.columns?.[0] || columns[0]

  const renderField = (col) => {
    const hint = fieldHints[col] || {}
    const label = labels[col] || humanize(col)
    return (
      <label key={col} className="block">
        <span className="mb-1 block text-xs font-semibold text-heading">
          {label} <span className="text-red-500">*</span>
        </span>
        <input
          autoFocus={col === firstCol}
          value={form[col]}
          onChange={set(col)}
          maxLength={hint.maxLength}
          inputMode={hint.inputMode}
          placeholder={hint.placeholder || (examples?.[col] ? `e.g. ${examples[col]}` : `Enter ${label.toLowerCase()}`)}
          className={inputCls}
        />
      </label>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              {isEdit ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">{title || (isEdit ? 'Edit Row' : 'Add Row')}</h2>
              <p className="text-xs text-body">
                {subtitle ||
                  (isEdit
                    ? 'Update the sheet columns and save changes'
                    : 'Fill in the sheet columns and insert at the top')}
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

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {selectFields.length > 0 && (
            <div className="space-y-3">
              {selectFields.map((f) => (
                <label key={f.name} className="block">
                  <span className="mb-1 block text-xs font-semibold text-heading">
                    {f.label}
                    {f.required !== false && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    value={form[f.name] ?? ''}
                    onChange={set(f.name)}
                    className={inputCls}
                  >
                    <option value="" disabled>
                      {f.placeholder || `Select ${f.label.toLowerCase()}`}
                    </option>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
          {groups?.length
            ? groups.map((g) => (
                <div key={g.group} className="space-y-3">
                  <p className="text-sm font-bold text-heading">{g.group}</p>
                  {g.columns.map((col) => renderField(col))}
                </div>
              ))
            : columns.map((col) => renderField(col))}

          {requireTicket && (
            <div className="border-t border-gray-100 pt-4">
              <TicketField value={ticket} onChange={setTicket} />
            </div>
          )}

          {duplicateError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {duplicateError}
            </p>
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
            disabled={!valid}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {submitLabel || (isEdit ? 'Save Changes' : 'Add Row')}
          </button>
        </div>
      </form>
    </div>
  )
}
