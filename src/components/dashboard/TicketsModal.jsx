import { useEffect } from 'react'
import { X } from 'lucide-react'
import Pagination from '../common/Pagination'
import { tickets, ticketsByRecent, statusBadge } from '../../data/tickets'
import { usePagination } from '../../hooks/usePagination'
import StatusReasonInfo from './StatusReasonInfo'

const priorityBadge = {
  P1: 'bg-red-50 text-red-700',
  P2: 'bg-amber-50 text-amber-700',
  P3: 'bg-sky-50 text-sky-700',
  P4: 'bg-gray-100 text-gray-600',
}

const columns = ['Ticket', 'Subject', 'Issuer', 'Classification', 'Status', 'Priority', 'Assignee', 'Updated']

export default function TicketsModal({ onClose }) {
  const pager = usePagination(ticketsByRecent, 15)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-heading">Tickets by Status</h2>
            <p className="text-xs text-body">{tickets.length} tickets in the current pipeline</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tickets table"
            className="grid h-8 w-8 place-items-center rounded-lg text-body transition hover:bg-grey-light hover:text-heading"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-white">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {col}
                  </th>
                ))}
                <th className="w-10 bg-white px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pager.pageItems.map((row) => (
                <tr key={row.id} className="hover:bg-primary/[0.03]">
                  <td className="whitespace-nowrap px-5 py-2.5 font-semibold text-heading">{row.id}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-heading">{row.subject}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-body">{row.issuer}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-body">{row.classification}</td>
                  <td className="whitespace-nowrap px-5 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5">
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${priorityBadge[row.priority]}`}
                    >
                      {row.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-body">{row.assignee}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs text-body">{row.updated}</td>
                  <td className="w-10 px-4 py-2.5 text-right">
                    <StatusReasonInfo status={row.status} reason={row.reason} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-3">
          <Pagination
            page={pager.page}
            totalPages={pager.totalPages}
            start={pager.start}
            end={pager.end}
            total={pager.total}
            onPrev={pager.prev}
            onNext={pager.next}
            onGoto={pager.setPage}
            label="tickets"
          />
        </div>
      </div>
    </div>
  )
}
