import { useEffect } from 'react'
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'

// Confirms deleting a user — same visual language as DeleteInstanceModal.
// `deleting` disables the actions and shows a spinner while the request
// is in flight (the parent owns the async call).
export default function DeleteUserModal({ user, onClose, onConfirm, deleting = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !deleting && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, deleting])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && onClose()} />

      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-bold text-heading">Delete User</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="grid h-9 w-9 place-items-center rounded-lg text-body transition hover:bg-grey-light disabled:opacity-50"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm text-body">
          <p>
            Delete <span className="font-semibold text-heading">{user.name}</span>?
          </p>
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This removes the user and all of their SOP sheet access. If the user has recorded
              revision history, the deletion will be blocked.
            </span>
          </p>
          <p className="mt-2 text-xs">This action cannot be undone.</p>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-body transition hover:bg-grey-light disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onConfirm(user)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
