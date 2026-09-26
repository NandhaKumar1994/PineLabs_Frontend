import { useEffect, useRef, useState } from 'react'
import { Check, X, Pencil } from 'lucide-react'

// Inline-editable table header label. Click the pencil to rename the column.
// `validate` may return an error string to block the save.
export default function EditableHeader({ value, onSave, canEdit = true, validate, children }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!editing) return
    setDraft(value ?? '')
    setError('')
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [editing, value])

  const commit = () => {
    const next = String(draft).trim()
    if (!next) {
      setError('Name is required.')
      return
    }
    if (next === String(value ?? '')) {
      setEditing(false)
      return
    }
    const err = validate?.(next)
    if (err) {
      setError(err)
      return
    }
    onSave(next)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value ?? '')
    setError('')
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
      <span className="relative inline-flex items-center gap-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-32 min-w-0 rounded-md border border-primary bg-white px-2 py-1 text-xs font-semibold normal-case tracking-normal text-heading outline-none ring-2 ring-primary/15"
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
        {error && (
          <span className="absolute left-0 top-full z-20 mt-1 whitespace-nowrap rounded-md bg-red-600 px-2 py-1 text-[10px] font-semibold normal-case tracking-normal text-white shadow-lg">
            {error}
          </span>
        )}
      </span>
    )
  }

  return (
    <span className="group/hdr inline-flex items-center gap-1.5">
      <span>{value}</span>
      {children}
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title={`Rename “${value}”`}
          className="grid h-5 w-5 shrink-0 place-items-center rounded text-gray-300 opacity-0 transition hover:bg-primary/10 hover:text-primary focus:opacity-100 group-hover/hdr:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
