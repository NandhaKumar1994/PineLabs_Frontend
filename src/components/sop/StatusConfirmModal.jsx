import { useEffect } from 'react'
import { X, Power, PowerOff } from 'lucide-react'

// Confirms activating / deactivating an issuer.
export default function StatusConfirmModal({ issuer, deactivating, onClose, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const Icon = deactivating ? PowerOff : Power

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`grid h-9 w-9 place-items-center rounded-lg ${
                deactivating ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-bold text-heading">
              {deactivating ? 'Deactivate Issuer' : 'Activate Issuer'}
            </h2>
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

        <div className="px-5 py-4 text-sm text-body">
          <p>
            {deactivating ? 'Deactivate' : 'Activate'}{' '}
            <span className="font-semibold text-heading">{issuer.name}</span>?
          </p>
          <p className="mt-1.5 text-xs">
            {deactivating
              ? 'It moves to the Inactive list and its SOP data stops being served to the automation system. You can reactivate it any time.'
              : 'It moves back to the Active list and its SOP data is served to the automation system again.'}
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
            type="button"
            onClick={onConfirm}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              deactivating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {deactivating ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  )
}
