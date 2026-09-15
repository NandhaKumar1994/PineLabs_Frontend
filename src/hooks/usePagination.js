import { useMemo, useState, useEffect } from 'react'

// Client-side pagination for large arrays. Returns the current page slice
// plus helpers. Resets to page 1 whenever the total item count changes
// (e.g. after filtering).
export function usePagination(items, pageSize = 25) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // Clamp / reset page when the dataset size changes.
  useEffect(() => {
    setPage(1)
  }, [items.length])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const start = items.length === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, items.length)

  return {
    page,
    setPage,
    totalPages,
    pageItems,
    start,
    end,
    total: items.length,
    next: () => setPage((p) => Math.min(p + 1, totalPages)),
    prev: () => setPage((p) => Math.max(p - 1, 1)),
  }
}
