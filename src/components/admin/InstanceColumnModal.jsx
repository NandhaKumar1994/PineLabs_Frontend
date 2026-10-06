import { useEffect, useMemo, useState } from 'react'
import { X, Columns3, Plus } from 'lucide-react'
import Select from '../common/Select'
import RadioGroup from '../common/RadioGroup'
import BrandLoader from '../common/BrandLoader'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

const COLUMN_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
]

// Add a custom column to the Instance Management table. Collects name,
// type, required flag, default value, and (for dropdown) the options.
// The default is applied to existing instances when the column is added,
// and a required column needs a non-blank default (backend enforces it
// too — this just mirrors the rule in the UI).
//
// Position is NOT chosen here anymore: the new column is added at the END
// of the table and the user drags its header wherever they want (see the
// drag handles in InstanceManagement.jsx). `layout` is still received so
// we can anchor the new column after the current last column (afterKey);
// falling back to the very start only when the table is somehow empty.
export default function InstanceColumnModal({
  existingLabels = [],
  layout = [],
  instanceCount = 0,
  onClose,
  onAdd,
}) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState('text')
  const [required, setRequired] = useState(false)
  const [defaultValue, setDefaultValue] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // New columns land at the end of the table: anchor after the current
  // last column's key (null only when the table has no columns yet).
  const lastKey = layout.length ? layout[layout.length - 1].key : null

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // The `error` banner holds a SERVER-side rejection from the last submit
  // (e.g. "'nee' must be a number"). Once the user edits any field that
  // could have caused it, that message is stale — clear it so it doesn't
  // linger after they fix the input.
  useEffect(() => {
    setError('')
  }, [label, type, required, defaultValue, optionsText])

  const trimmed = label.trim()
  const duplicate = existingLabels.some((l) => l.toLowerCase() === trimmed.toLowerCase())

  const options = useMemo(
    () =>
      optionsText
        .split(/[\n,]/)
        .map((o) => o.trim())
        .filter(Boolean),
    [optionsText]
  )

  const requiredNeedsDefault = required && !defaultValue.trim()
  const dropdownNeedsOptions = type === 'dropdown' && options.length === 0
  const valid = trimmed && !duplicate && !requiredNeedsDefault && !dropdownNeedsOptions && !submitting

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setError('')
    setSubmitting(true)
    try {
      await onAdd({
        label: trimmed,
        type,
        required,
        defaultValue: defaultValue.trim() || undefined,
        options: type === 'dropdown' ? options : undefined,
        // Land at the end of the table (after the current last column);
        // null only when there are no columns yet. Users reposition by
        // dragging the header afterward.
        afterKey: lastKey,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not add the column.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Branded loader while the column is being created + existing
            instances are backfilled server-side. */}
        {submitting && <BrandLoader label="Adding column…" />}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Columns3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Add Column</h2>
              <p className="text-xs text-body">Add a custom column to Instance Management</p>
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
              Column Name <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Region"
              className={inputCls}
            />
            {duplicate && (
              <span className="mt-1 block text-xs text-red-500">A column with this name already exists.</span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-xs font-semibold text-heading">Type</span>
              <Select value={type} onChange={setType} options={COLUMN_TYPES} ariaLabel="Column type" />
            </div>

            <div>
              <span className="mb-1 block text-xs font-semibold text-heading">Required</span>
              <div className="py-2">
                <RadioGroup
                  value={required ? 'required' : 'optional'}
                  onChange={(v) => setRequired(v === 'required')}
                  options={[
                    { value: 'optional', label: 'Optional' },
                    { value: 'required', label: 'Required' },
                  ]}
                  name="column-required"
                />
              </div>
            </div>
          </div>

          {type === 'dropdown' && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-heading">
                Options <span className="text-red-500">*</span>
              </span>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="One per line or comma-separated, e.g. Visa, Mastercard, Rupay"
                rows={3}
                className={inputCls}
              />
              {options.length > 0 && (
                <span className="mt-1 flex flex-wrap gap-1">
                  {options.map((o) => (
                    <span key={o} className="rounded-full bg-grey-light px-2 py-0.5 text-[11px] text-body">
                      {o}
                    </span>
                  ))}
                </span>
              )}
              {dropdownNeedsOptions && (
                <span className="mt-1 block text-xs text-red-500">Add at least one option.</span>
              )}
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-heading">
              Default value for existing instances
              {required && <span className="text-red-500"> *</span>}
            </span>
            <input
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder={required ? 'Required — applied to existing rows' : 'e.g. NA  (leave blank -> NA)'}
              className={inputCls}
            />
            {requiredNeedsDefault && (
              <span className="mt-1 block text-xs text-red-500">
                A required column needs a default value (applied to existing instances).
              </span>
            )}
          </label>

          <p className="rounded-lg bg-grey-light px-3 py-2 text-xs text-body">
            {instanceCount > 0 ? (
              <>
                This column is added to all{' '}
                <span className="font-semibold text-heading">{instanceCount.toLocaleString()}</span> existing
                instances with the default value (blank becomes <span className="font-semibold">NA</span>).
              </>
            ) : (
              'The default value is applied to existing instances; a blank optional value becomes NA.'
            )}
          </p>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
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
            <Plus className="h-4 w-4" />
            Add Column
          </button>
        </div>
      </form>
    </div>
  )
}
