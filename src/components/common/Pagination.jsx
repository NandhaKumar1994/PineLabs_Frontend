import { ChevronLeft, ChevronRight } from 'lucide-react'

// Compact pager: shows a small window of page numbers with ellipses.
function pageWindow(page, totalPages) {
  const pages = []
  const push = (p) => pages.push(p)
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i)
    return pages
  }
  push(1)
  if (page > 3) push('…')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i)
  if (page < totalPages - 2) push('…')
  push(totalPages)
  return pages
}

export default function Pagination({ page, totalPages, start, end, total, onPrev, onNext, onGoto, label = 'records' }) {
  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <span className="text-xs text-body">
        Showing <span className="font-semibold text-heading">{start}</span>–
        <span className="font-semibold text-heading">{end}</span> of{' '}
        <span className="font-semibold text-heading">{total}</span> {label}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="grid h-7 w-7 place-items-center rounded-md border border-gray-200 text-body transition hover:bg-grey-light disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1.5 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onGoto(p)}
              className={`min-w-7 rounded-md px-2 py-1 text-xs font-medium transition ${
                p === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-gray-200 text-body hover:bg-grey-light'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="grid h-7 w-7 place-items-center rounded-md border border-gray-200 text-body transition hover:bg-grey-light disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
