import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

// Checkbox dropdown supporting multi-select, select-all and search.
// options: [{ value, label, hint }]
export default function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  allLabel = 'Select all',
  emptyText = 'No options available.',
  maxChips = 3,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
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

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [query, options])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((o) => selectedSet.has(o.value))

  const toggleOne = (value) => {
    const next = new Set(selectedSet)
    next.has(value) ? next.delete(value) : next.add(value)
    onChange([...next])
  }

  const toggleAll = () => {
    const next = new Set(selectedSet)
    if (allFilteredSelected) filtered.forEach((o) => next.delete(o.value))
    else filtered.forEach((o) => next.add(o.value))
    onChange([...next])
  }

  const clearAll = (e) => {
    e.stopPropagation()
    onChange([])
  }

  const chosen = options.filter((o) => selectedSet.has(o.value))
  const chips = chosen.slice(0, maxChips)
  const overflow = chosen.length - chips.length

  return (
    <div ref={wrapRef} className="relative">
      {/* control */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
          open
            ? 'border-primary bg-white ring-2 ring-primary/10'
            : 'border-gray-200 bg-grey-light hover:border-primary/40'
        }`}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {chosen.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <>
              {chips.map((o) => (
                <span
                  key={o.value}
                  className="inline-flex max-w-[160px] items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary"
                >
                  <span className="truncate">{o.label}</span>
                </span>
              ))}
              {overflow > 0 && (
                <span className="rounded-md bg-grey-light px-1.5 py-0.5 text-xs font-semibold text-body">
                  +{overflow} more
                </span>
              )}
            </>
          )}
        </span>

        {chosen.length > 0 && (
          <span
            role="button"
            tabIndex={-1}
            onClick={clearAll}
            title="Clear selection"
            className="grid h-5 w-5 shrink-0 place-items-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-heading"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* panel */}
      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="relative border-b border-gray-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-gray-200 bg-grey-light py-1.5 pl-8 pr-2 text-sm outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          {filtered.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center gap-2 border-b border-gray-100 bg-grey-light/60 px-3 py-2 text-left transition hover:bg-grey-light"
            >
              <Box on={allFilteredSelected} />
              <span className="text-sm font-semibold text-heading">
                {allFilteredSelected ? `Deselect all` : allLabel}
              </span>
              <span className="ml-auto text-xs text-body">{filtered.length}</span>
            </button>
          )}

          <div className="nice-scroll max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-body">{emptyText}</p>
            ) : (
              filtered.map((o) => {
                const on = selectedSet.has(o.value)
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => toggleOne(o.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${
                      on ? 'bg-primary/[0.04]' : 'hover:bg-grey-light'
                    }`}
                  >
                    <Box on={on} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-heading">
                        {o.label}
                      </span>
                      {o.hint && (
                        <span className="block truncate text-xs text-body">{o.hint}</span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Box({ on }) {
  return (
    <span
      className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
        on ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
      }`}
    >
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  )
}
