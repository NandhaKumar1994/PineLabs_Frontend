import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Themed single-select dropdown — a styled replacement for the native
 * <select>, matching the app's inputs (grey-light field, primary focus
 * ring, chevron, primary-highlighted options). Reusable anywhere a
 * fixed-option picker is needed.
 *
 * Props:
 *   value       - the currently selected option value
 *   onChange    - (value) => void
 *   options     - array of { value, label } OR array of strings
 *   placeholder - shown when nothing is selected
 *   disabled
 *   className   - extra classes on the trigger button
 *   ariaLabel   - accessible label
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  className = '',
  ariaLabel,
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)

  // Normalize to { value, label } objects.
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const selected = items.find((o) => o.value === value)

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // When opening, highlight the currently-selected option.
  useEffect(() => {
    if (open) {
      const idx = items.findIndex((o) => o.value === value)
      setHighlight(idx >= 0 ? idx : 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const choose = (opt) => {
    onChange(opt.value)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (disabled) return
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && items[highlight]) {
      e.preventDefault()
      choose(items[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-left text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className={`truncate ${selected ? 'text-heading' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && items.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((opt, i) => {
            const isSel = opt.value === value
            return (
              <li key={opt.value} role="option" aria-selected={isSel}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => choose(opt)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                    i === highlight ? 'bg-primary/5 text-primary' : 'text-body hover:bg-grey-light'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSel && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
