import { useEffect, useRef, useState } from 'react'
import { Check, X, Pencil } from 'lucide-react'

// Click a cell to edit it inline. Shows an input with tick (save) and
// close (cancel) icons. `render` lets callers style the display value.
export default function EditableCell({
  value,
  onSave,
  canEdit = true,
  render,
  // Width of the editing input, and whether the display value may wrap.
  inputWidth = 'w-32',
  truncate = true,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setDraft(value ?? '')
      // focus + select on open
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editing, value])

  const commit = () => {
    const next = String(draft).trim()
    // Always hand the value back; the caller decides whether anything changed
    // (it may need to capture a ticket number before committing).
    onSave(next)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value ?? '')
    setEditing(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          className={`${inputWidth} min-w-0 rounded-md border border-primary bg-white px-2 py-1 text-sm text-heading outline-none ring-2 ring-primary/15`}
        />
        <button
          type="button"
          onClick={commit}
          title="Save"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
        <button
          type="button"
          onClick={cancel}
          title="Cancel"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100"
        >
          <X className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      </span>
    )
  }

  if (!canEdit) return render ? render(value) : <span>{value}</span>

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit"
      className="group/cell -mx-1 flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-primary/[0.06]"
    >
      <span className={`min-w-0 flex-1 ${truncate ? 'truncate' : ''}`}>
        {render ? render(value) : value}
      </span>
      <Pencil className="h-3 w-3 shrink-0 text-gray-300 opacity-0 transition group-hover/cell:opacity-100" />
    </button>
  )
}
