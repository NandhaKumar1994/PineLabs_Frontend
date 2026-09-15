import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

// Themed autocomplete/select replacing the native <datalist>.
// - Type to filter, click or keyboard-select an option.
// - Free text is allowed (value isn't forced to an option).
export default function Combobox({
  value,
  onChange,
  options, // array of strings
  placeholder,
  icon: Icon,
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)

  const filtered = (
    value ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase())) : options
  ).slice(0, 50)

  // close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const choose = (opt) => {
    onChange(opt)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && filtered[highlight]) {
      e.preventDefault()
      choose(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-gray-200 bg-grey-light py-2 pr-9 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 ${
            Icon ? 'pl-9' : 'pl-3'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.map((opt, i) => {
            const selected = opt === value
            return (
              <li key={opt}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => choose(opt)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                    i === highlight ? 'bg-primary/5 text-primary' : 'text-body hover:bg-grey-light'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-body shadow-lg">
          No matches
        </div>
      )}
    </div>
  )
}
