import { useEffect } from 'react'
import { X, Layers } from 'lucide-react'
import SopSheet from './SopSheet'

// Full-size modal showing the active action sheet together with POC and
// Escalation Matrix, each with the same search + column filters as the
// detail page, so the agent can cross-validate on one screen.
export default function SopValidateModal({ merchant, sheets, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // First sheet is the active action; the rest (POC, Escalation) are refs.
  const action = sheets[0]
  const refs = sheets.slice(1)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-heading/40 backdrop-blur-sm">
      {/* full-size panel */}
      <div className="m-3 flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">
                Cross-validate · {merchant.name}
              </h2>
              <p className="text-xs text-body">
                Action steps with POC & Escalation Matrix, all filterable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-body transition hover:bg-grey-light"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body scrolls; action sheet on top, POC + Escalation in one row below */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-grey-bg p-4">
          {action && <SopSheet sheet={action} title={action.name} />}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {refs.map((s) => (
              <SopSheet key={s.key} sheet={s} title={s.name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


