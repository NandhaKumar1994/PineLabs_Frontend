import { useState } from 'react'
import { X, Columns3, Plus } from 'lucide-react'

// Add a new column to a flat table (e.g. BIN Series). Just a column name.
export default function AddColumnModal({ existingLabels = [], rowCount = 0, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [defaultValue, setDefaultValue] = useState('')

  const trimmed = name.trim()
  const duplicate = existingLabels.some((l) => l.toLowerCase() === trimmed.toLowerCase())
  const valid = trimmed && !duplicate

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onAdd(trimmed, defaultValue.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Columns3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Add Column</h2>
              <p className="text-xs text-body">Add a new column to this table</p>
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
              Column Name <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Network"
              className="w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
            {duplicate && (
              <span className="mt-1 block text-xs text-red-500">This column already exists.</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-heading">
              Default value for existing records
            </span>
            <input
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="e.g. NA  (leave blank for empty)"
              className="w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <p className="rounded-lg bg-grey-light px-3 py-2 text-xs text-body">
            {rowCount > 0 ? (
              <>
                This value will be applied to all{' '}
                <span className="font-semibold text-heading">{rowCount.toLocaleString()}</span>{' '}
                existing records at once. Individual records can be edited afterwards.
              </>
            ) : (
              'The value is applied to existing records; individual records can be edited afterwards.'
            )}
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
            Add Column
          </button>
        </div>
      </form>
    </div>
  )
}
