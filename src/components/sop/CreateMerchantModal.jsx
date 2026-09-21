import { useState } from 'react'
import { X, Store, Plus } from 'lucide-react'

const classifications = [
  'Digital Gift Card',
  'Physical Gift Card',
  'Corporate Gifting',
  'Reward Card',
]

// Manual "Create Merchant" form. After creating, the merchant appears in the
// list with a "New" badge; the SOP details sheet can then be imported.
export default function CreateMerchantModal({
  existingNames = [],
  instances = [],
  defaultInstanceId = '',
  onClose,
  onCreate,
}) {
  const [name, setName] = useState('')
  const [classification, setClassification] = useState('Digital Gift Card')
  const [instanceId, setInstanceId] = useState(defaultInstanceId)

  const trimmed = name.trim()
  const duplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())
  const valid = trimmed && !duplicate && !!instanceId

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onCreate({ name: trimmed, classification, instanceId, manualEntry: true })
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
              <Store className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Create Issuer</h2>
              <p className="text-xs text-body">
                Add an issuer manually; import its SOP details afterwards
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
              Issuer Name <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summit Retail"
              className="w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
            {duplicate && (
              <span className="mt-1 block text-xs text-red-500">
                An issuer with this name already exists.
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
              className="w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
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

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-heading">Classification</span>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            >
              {classifications.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

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
            Create Issuer
          </button>
        </div>
      </form>
    </div>
  )
}
