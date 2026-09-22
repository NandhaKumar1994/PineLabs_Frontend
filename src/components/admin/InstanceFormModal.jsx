import { useEffect, useState } from 'react'
import { X, Layers, Plus, Pencil } from 'lucide-react'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

// Create / edit an instance.
export default function InstanceFormModal({ initial, existingNames = [], onClose, onSubmit }) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'Active')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const trimmed = name.trim()
  const duplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== (initial?.name ?? '').toLowerCase()
  )
  const valid = trimmed && !duplicate

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSubmit({ name: trimmed, description: description.trim(), status })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">
                {isEdit ? 'Edit Instance' : 'Create Instance'}
              </h2>
              <p className="text-xs text-body">
                {isEdit
                  ? 'Update this instance’s details'
                  : 'Group issuers under a new instance'}
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

        <div className="space-y-4 p-5">
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
            <span className="mb-1 block text-xs font-semibold text-heading">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this instance groups together"
              className={`${inputCls} resize-none`}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-heading">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
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
            {isEdit ? 'Save Changes' : 'Create Instance'}
          </button>
        </div>
      </form>
    </div>
  )
}
