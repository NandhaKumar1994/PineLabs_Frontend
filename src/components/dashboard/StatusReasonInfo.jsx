import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

export default function StatusReasonInfo({ status, reason }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, flip: false })
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  const toggle = (e) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const flip = r.bottom + 140 > window.innerHeight
      setPos({
        top: flip ? r.top - 6 : r.bottom + 6,
        left: Math.max(12, Math.min(r.right - 288, window.innerWidth - 300)),
        flip,
      })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Why this ticket is ${status}`}
        className="grid h-7 w-7 place-items-center rounded-md text-gray-400 transition hover:bg-grey-light hover:text-heading"
      >
        <Info className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Status reason"
            className="fixed z-[70] w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
            style={{
              top: pos.top,
              left: pos.left,
              transform: pos.flip ? 'translateY(-100%)' : undefined,
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status reason</p>
            <p className="mt-1 text-sm font-semibold text-heading">{status}</p>
            <p className="mt-1 text-xs leading-relaxed text-body">{reason}</p>
          </div>,
          document.body
        )}
    </>
  )
}
