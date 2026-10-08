import { useEffect } from 'react'
import { X, Layers, Store, ShieldCheck } from 'lucide-react'

/**
 * Read-only view of a user's selected scope: the instances and issuers
 * granted to them. Opened by clicking the Access badges in the user
 * table. `instanceNames` maps instance id -> name (resolved by the
 * parent from the instances list) so ids render as readable names.
 */
export default function UserAccessModal({ user, instanceNames = {}, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const instanceIds = user.instanceIds || []
  const issuers = user.issuers || []
  const instanceLabels = instanceIds.map((id) => instanceNames[id] || `Instance #${id}`)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-heading/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">Access · {user.name}</h2>
              <p className="text-xs text-body">Instances and issuers granted to this user</p>
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
          {/* Instances */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                <Layers className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-semibold text-heading">Instances</h3>
              <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {instanceLabels.length}
              </span>
            </div>
            {instanceLabels.length ? (
              <div className="flex flex-wrap gap-1.5">
                {instanceLabels.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    <Layers className="h-3 w-3" />
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 bg-grey-light/50 px-3 py-4 text-center text-xs text-body">
                No instances selected.
              </p>
            )}
          </section>

          {/* Issuers */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                <Store className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-semibold text-heading">Issuers</h3>
              <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {issuers.length}
              </span>
            </div>
            {issuers.length ? (
              <div className="flex flex-wrap gap-1.5">
                {issuers.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    <Store className="h-3 w-3" />
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 bg-grey-light/50 px-3 py-4 text-center text-xs text-body">
                No issuers selected.
              </p>
            )}
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
