import { useMemo, useState } from 'react'
import { Search, UserPlus, MoreHorizontal, Mail } from 'lucide-react'
import { users } from '../../data/users'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import { useTheme } from '../../theme/ThemeContext'
import CreateUserModal from './CreateUserModal'

const roleTint = {
  Admin: 'bg-primary/10 text-primary',
  SME: 'bg-blue-50 text-blue-600',
  Automation: 'bg-violet-50 text-violet-600',
  Viewer: 'bg-amber-50 text-amber-700',
}

const statusTint = {
  Active: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-gray-100 text-gray-500',
  Invited: 'bg-amber-50 text-amber-700',
}

export default function UserManagement() {
  const { theme } = useTheme()
  const t2 = theme === 'theme2'
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [debounced])

  const pager = usePagination(filtered, 25)

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, role…"
            className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {t2 ? (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {pager.total === 0 ? (
            <p className="py-12 text-center text-sm text-body">No users match “{query}”.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pager.pageItems.map((u) => (
                <div key={u.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-heading">{u.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-body">
                        <Mail className="h-3 w-3 shrink-0" />
                        {u.email}
                      </p>
                    </div>
                    <button className="grid h-7 w-7 place-items-center rounded-md text-gray-300 transition hover:bg-gray-100 hover:text-heading">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleTint[u.role] || 'bg-grey-light text-body'}`}>
                      {u.role}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTint[u.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {u.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-body">Last active · {u.lastActive}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-100 bg-white">
              {['User', 'Role', 'Status', 'Last Active', ''].map((h, i) => (
                <th
                  key={i}
                  className="whitespace-nowrap bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pager.pageItems.map((u) => (
              <tr key={u.id} className="transition hover:bg-primary/[0.03]">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-heading">{u.name}</p>
                      <p className="flex items-center gap-1 text-xs text-body">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-2.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleTint[u.role] || 'bg-grey-light text-body'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-2.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTint[u.status]}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-body">{u.lastActive}</td>
                <td className="px-5 py-2.5 text-right">
                  <button className="grid h-7 w-7 place-items-center rounded-md text-gray-300 transition hover:bg-gray-100 hover:text-heading">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {pager.total === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-sm text-body">
                  No users match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

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
          label="users"
        />
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </section>
  )
}
