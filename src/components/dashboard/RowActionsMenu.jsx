import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react'

export default function RowActionsMenu({ onEdit, onClone, onDelete }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, flip: false })
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  const toggle = (e) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const flip = r.bottom + 96 > window.innerHeight
      setPos({
        top: flip ? r.top - 6 : r.bottom + 6,
        left: Math.max(12, r.right - 160),
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

  const pick = (fn) => (e) => {
    e.stopPropagation()
    setOpen(false)
    fn()
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Row actions"
        className="grid h-7 w-7 place-items-center rounded-md text-gray-300 transition hover:bg-gray-100 hover:text-heading"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            className="fixed z-[60] w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            style={{
              top: pos.top,
              left: pos.left,
              transform: pos.flip ? 'translateY(-100%)' : undefined,
            }}
          >
            {onEdit && (
              <button
                type="button"
                role="menuitem"
                onClick={pick(onEdit)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-heading transition hover:bg-grey-light"
              >
                <Pencil className="h-3.5 w-3.5 text-body" />
                Edit
              </button>
            )}
            {onClone && (
              <button
                type="button"
                role="menuitem"
                onClick={pick(onClone)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-heading transition hover:bg-grey-light"
              >
                <Copy className="h-3.5 w-3.5 text-body" />
                Clone
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={pick(onDelete)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  )
}
