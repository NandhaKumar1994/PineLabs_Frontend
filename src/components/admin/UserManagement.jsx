import { useCallback, useEffect, useState } from 'react'
import { Search, UserPlus, Trash2, Pencil, Mail, Loader2, AlertCircle, Layers, Store } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import { useRole } from '../../theme/RoleContext'
import { userService } from '../../services/userService'
import { instanceService } from '../../services/instanceService'
import CreateUserModal from './CreateUserModal'
import DeleteUserModal from './DeleteUserModal'
import UserAccessModal from './UserAccessModal'

const roleTint = {
  'Super Admin': 'bg-primary/10 text-primary',
  Admin: 'bg-violet-50 text-violet-600',
  SME: 'bg-blue-50 text-blue-600',
  Viewer: 'bg-amber-50 text-amber-700',
}

const statusTint = {
  Active: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-gray-100 text-gray-500',
  Invited: 'bg-amber-50 text-amber-700',
}

export default function UserManagement() {
  const { perms } = useRole()
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  // The user being edited (opens the modal in edit mode), if any.
  const [editTarget, setEditTarget] = useState(null)
  // The user whose access detail is being viewed, if any.
  const [accessTarget, setAccessTarget] = useState(null)
  // Instance id -> name map, for rendering the access modal readably.
  const [instanceNames, setInstanceNames] = useState({})
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // The user pending deletion (opens the confirm modal) + in-flight flag.
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const debounced = useDebounce(query, 300)

  // Fetch users from the backend (search is server-side).
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // pageSize covers the full set; client-side pagination then slices
      // it (keeps the existing Pagination UI without a server round-trip
      // per page). Raise if the roster ever grows beyond this.
      const data = await userService.list({
        page: 1,
        pageSize: 200,
        search: debounced.trim() || undefined,
      })
      setUsers(data.items || [])
    } catch (e) {
      setError(e?.message || 'Failed to load users.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [debounced])

  useEffect(() => {
    load()
  }, [load])

  // Instance id -> name map (fetched once) so the Access modal can show
  // instance names instead of raw ids.
  useEffect(() => {
    let cancelled = false
    instanceService
      .list({ page: 1, pageSize: 200, sortBy: 'name', sortOrder: 'asc' })
      .then((data) => {
        if (cancelled) return
        const map = {}
        for (const i of data.items || []) map[i.id] = i.name
        setInstanceNames(map)
      })
      .catch(() => {
        /* non-fatal — modal falls back to "Instance #<id>" */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const pager = usePagination(users, 25)

  const handleSaved = () => {
    setShowCreate(false)
    setEditTarget(null)
    load()
  }

  const confirmDelete = async (user) => {
    setDeleting(true)
    setError(null)
    try {
      await userService.remove(user.id)
      setDeleteTarget(null)
      await load()
    } catch (e) {
      // Surface the failure in the page banner (e.g. the backend blocks
      // deleting a user that still has revision history → 409) and close
      // the modal so the message is visible.
      setError(e?.message || 'Failed to delete user.')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const initials = (name) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2)

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
        {perms.canManageUsers && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={load} className="ml-auto font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20 text-body">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading users…
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-white">
                {['User', 'Role', 'Status', 'Access', ''].map((h, i) => (
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
                        {initials(u.name)}
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
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTint[u.status] || 'bg-grey-light text-body'}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <AccessBadges
                      instanceCount={u.instanceCount}
                      issuerCount={u.issuerCount}
                      onClick={() => setAccessTarget(u)}
                    />
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {perms.canManageUsers && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTarget(u)}
                          title="Edit user"
                          className="grid h-7 w-7 place-items-center rounded-md text-gray-300 transition hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title="Delete user"
                          className="grid h-7 w-7 place-items-center rounded-md text-gray-300 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pager.total === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-body">
                    {query.trim() ? `No users match “${query}”.` : 'No users yet.'}
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

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={handleSaved} />
      )}
      {editTarget && (
        <CreateUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onCreated={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          deleting={deleting}
          onClose={() => !deleting && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
      {accessTarget && (
        <UserAccessModal
          user={accessTarget}
          instanceNames={instanceNames}
          onClose={() => setAccessTarget(null)}
        />
      )}
    </section>
  )
}

// Compact "N instances · M issuers" badges for the Access column. Click
// to open the read-only access detail modal. Shows a muted dash (still
// clickable) when the user has no scope selected yet.
function AccessBadges({ instanceCount = 0, issuerCount = 0, onClick }) {
  const empty = !instanceCount && !issuerCount
  return (
    <button
      type="button"
      onClick={onClick}
      title="View access detail"
      className="group flex flex-wrap items-center gap-1.5 rounded-md px-1 py-0.5 transition hover:bg-grey-light"
    >
      {empty ? (
        <span className="text-xs text-gray-400 group-hover:text-body">— view</span>
      ) : (
        <>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
            title={`${instanceCount} instance${instanceCount === 1 ? '' : 's'}`}
          >
            <Layers className="h-3 w-3" />
            {instanceCount}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
            title={`${issuerCount} issuer${issuerCount === 1 ? '' : 's'}`}
          >
            <Store className="h-3 w-3" />
            {issuerCount}
          </span>
        </>
      )}
    </button>
  )
}
