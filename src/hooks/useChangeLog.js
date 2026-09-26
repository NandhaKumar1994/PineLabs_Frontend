import { useCallback, useState } from 'react'
import { CURRENT_USER } from '../data/users'

const pad = (n) => String(n).padStart(2, '0')

const stamp = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Tracks the most recent changes made to a table/sheet in this session.
// `seed` provides prior history so the panel isn't empty on first open.
export function useChangeLog(seed = []) {
  const [entries, setEntries] = useState(seed)

  // type: create | update | delete | upload | column | rename
  // detail (optional): { field, before, after, fields: [{ field, before, after }] }
  const log = useCallback((type, action, change, detail = null) => {
    setEntries((prev) => [
      {
        id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        action,
        change,
        ...detail,
        by: CURRENT_USER,
        at: stamp(),
      },
      ...prev,
    ])
  }, [])

  return { entries, log }
}
