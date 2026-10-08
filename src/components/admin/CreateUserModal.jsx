import { useEffect, useMemo, useState } from 'react'
import { X, UserPlus, Search, Check, Layers, Loader2, AlertCircle } from 'lucide-react'
import MultiSelect from '../common/MultiSelect'
import Select from '../common/Select'
import { useRole } from '../../theme/RoleContext'
import { instanceService } from '../../services/instanceService'
import { userService } from '../../services/userService'

// Validation regexes. EMAIL_RE mirrors the backend's rule
// (app/schemas/user.py: non-space local@domain.tld). Mobile must be
// exactly 10 digits.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const MOBILE_RE = /^\d{10}$/

// Dual-purpose: Create (no `user`) or Edit (an existing user passed in).
// In edit mode the form is pre-filled and submit does an update.
export default function CreateUserModal({ onClose, onCreated, user = null }) {
  const isEdit = !!user
  // Role options come from the backend vocabulary (via RoleContext).
  const { roles } = useRole()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    role: user?.role || roles[roles.length - 1] || 'Viewer',
    status: user?.status || 'Invited',
  })

  // Instances fetched from the backend (GET /instances).
  const [instances, setInstances] = useState([])
  const [instancesLoading, setInstancesLoading] = useState(true)
  const [instanceIds, setInstanceIds] = useState(() => user?.instanceIds || [])

  // Issuers for the selected instances, fetched from the backend
  // (GET /instances/{id}/issuers) and merged. Each entry is a string.
  const [issuers, setIssuers] = useState([])
  const [issuersLoading, setIssuersLoading] = useState(false)
  // Selected issuer names the user will be granted access to (pre-filled
  // in edit mode from the user's persisted scope).
  const [selectedIssuers, setSelectedIssuers] = useState(() => new Set(user?.issuers || []))
  const [issuerQuery, setIssuerQuery] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  // Which fields the user has interacted with, so inline errors only
  // appear after a field is touched (or after a submit attempt).
  const [touched, setTouched] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const markTouched = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  // Load instances once.
  useEffect(() => {
    let cancelled = false
    setInstancesLoading(true)
    instanceService
      .list({ page: 1, pageSize: 200, sortBy: 'name', sortOrder: 'asc' })
      .then((data) => {
        if (!cancelled) setInstances(data.items || [])
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load instances.')
      })
      .finally(() => {
        if (!cancelled) setInstancesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const instanceOptions = useMemo(
    () => instances.map((i) => ({ value: i.id, label: i.name })),
    [instances]
  )

  // Whenever the selected instances change, fetch + merge their issuers.
  useEffect(() => {
    let cancelled = false
    if (!instanceIds.length) {
      setIssuers([])
      setSelectedIssuers(new Set())
      return
    }
    setIssuersLoading(true)
    Promise.all(instanceIds.map((id) => instanceService.getIssuers(id)))
      .then((results) => {
        if (cancelled) return
        const merged = new Set()
        results.forEach((r) => (r.issuers || []).forEach((name) => merged.add(name)))
        const list = [...merged].sort((a, b) => a.localeCompare(b))
        setIssuers(list)
        // Drop any previously-selected issuer that's no longer in scope.
        setSelectedIssuers((prev) => new Set([...prev].filter((n) => merged.has(n))))
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load issuers.')
      })
      .finally(() => {
        if (!cancelled) setIssuersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [instanceIds])

  const matchingIssuers = useMemo(() => {
    const q = issuerQuery.trim().toLowerCase()
    return q ? issuers.filter((n) => n.toLowerCase().includes(q)) : issuers
  }, [issuerQuery, issuers])

  const allSelected =
    matchingIssuers.length > 0 && matchingIssuers.every((n) => selectedIssuers.has(n))

  const toggleIssuer = (name) =>
    setSelectedIssuers((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  const toggleSelectAll = () =>
    setSelectedIssuers((prev) => {
      const next = new Set(prev)
      if (allSelected) matchingIssuers.forEach((n) => next.delete(n))
      else matchingIssuers.forEach((n) => next.add(n))
      return next
    })

  // --- Field validation -------------------------------------------------
  // Email: a pragmatic address check (matches the backend's rule in
  // app/schemas/user.py — non-space local@domain.tld). Mobile is
  // optional; when present it must be exactly 10 digits.
  const emailError = (() => {
    const v = form.email.trim()
    if (!v) return 'Email is required.'
    if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
    return ''
  })()

  const mobileError = (() => {
    const v = form.mobile.trim()
    if (!v) return '' // optional
    if (!MOBILE_RE.test(v)) return 'Enter a valid 10-digit mobile number.'
    return ''
  })()

  const nameError = form.name.trim() ? '' : 'Full name is required.'

  // Instance/issuer scope is OPTIONAL — a user can be created without
  // selecting any instance or issuer.
  const valid =
    !nameError &&
    !emailError &&
    !mobileError &&
    form.role

  const submit = async (e) => {
    e.preventDefault()
    if (!valid || submitting) {
      // Reveal any inline errors the user hasn't seen yet.
      setTouched({ name: true, email: true, mobile: true })
      return
    }
    setSubmitting(true)
    setError(null)
    const scopeIssuers = [...selectedIssuers]
    try {
      if (isEdit) {
        await userService.update(user.id, {
          name: form.name.trim(),
          mobile: form.mobile.trim() || undefined,
          role: form.role,
          status: form.status,
          instanceIds,
          issuers: scopeIssuers,
        })
      } else {
        await userService.create({
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim() || undefined,
          role: form.role,
          // The instance + issuer selection is persisted on the user via
          // these scope lists (shown as counts on the list page). The
          // SOP-sheet `access` map is a separate concern (merchant-name ->
          // sheet keys) and stays empty until an issuer->sheet mapping
          // exists.
          access: {},
          instanceIds,
          issuers: scopeIssuers,
        })
      }
      onCreated?.()
    } catch (err) {
      setError(err?.message || `Failed to ${isEdit ? 'update' : 'create'} user.`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop is non-dismissing: clicking outside must NOT close the
          form (avoids losing in-progress input). Close only via the X or
          Cancel button. */}
      <div className="absolute inset-0 bg-heading/40 backdrop-blur-sm" />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-heading">{isEdit ? 'Edit User' : 'Create User'}</h2>
              <p className="text-xs text-body">
                {isEdit
                  ? 'Update the user’s role, status and instance/issuer scope'
                  : 'Add a user and configure their instance/issuer scope'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-body transition hover:bg-grey-light"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" required error={touched.name && nameError}>
              <input
                value={form.name}
                onChange={set('name')}
                onBlur={markTouched('name')}
                placeholder="e.g. Ravi Kumar"
                className={fieldCls(touched.name && nameError)}
              />
            </Field>
            <Field label="Email ID" required error={!isEdit && touched.email && emailError}>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                onBlur={markTouched('email')}
                placeholder="name@pinelabs.in"
                disabled={isEdit}
                title={isEdit ? 'Email cannot be changed' : undefined}
                className={`${fieldCls(!isEdit && touched.email && emailError)} ${
                  isEdit ? 'cursor-not-allowed opacity-60' : ''
                }`}
              />
            </Field>
            <Field label="Mobile Number" error={touched.mobile && mobileError}>
              <input
                value={form.mobile}
                onChange={(e) =>
                  // Allow only digits, capped at 10.
                  setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))
                }
                onBlur={markTouched('mobile')}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                className={fieldCls(touched.mobile && mobileError)}
              />
            </Field>
            <Field label="Role" required>
              <Select
                value={form.role}
                onChange={(v) => setForm((f) => ({ ...f, role: v }))}
                options={roles}
                placeholder="Select a role…"
                ariaLabel="Role"
              />
            </Field>
            {isEdit && (
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  options={['Active', 'Inactive', 'Invited']}
                  placeholder="Select a status…"
                  ariaLabel="Status"
                />
              </Field>
            )}
          </div>

          {/* instance scope — drives which issuers are listed below */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                <Layers className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-semibold text-heading">Instance</p>
              {instanceIds.length > 0 && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {instanceIds.length} selected · {issuers.length} issuers
                </span>
              )}
            </div>
            <p className="mb-2 text-xs text-body">
              Optionally choose one or more instances. Only their issuers appear below.
            </p>
            {instancesLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-body">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading instances…
              </div>
            ) : (
              <MultiSelect
                options={instanceOptions}
                selected={instanceIds}
                onChange={setInstanceIds}
                placeholder="Select instances…"
                searchPlaceholder="Search instances…"
                allLabel="Select all instances"
              />
            )}
          </div>

          {/* issuer access */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm font-semibold text-heading">Issuer Access</p>
              {instanceIds.length > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    selectedIssuers.size ? 'bg-emerald-50 text-emerald-700' : 'bg-grey-light text-body'
                  }`}
                >
                  {selectedIssuers.size} issuer{selectedIssuers.size === 1 ? '' : 's'} selected
                </span>
              )}
            </div>
            <p className="text-xs text-body">
              {instanceIds.length
                ? 'Tick the issuers this user should have access to.'
                : 'Choose an instance first to load its issuers.'}
            </p>

            {!instanceIds.length ? (
              <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-grey-light/50 px-4 py-8 text-center">
                <Layers className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-heading">No instance selected</p>
                <p className="mt-0.5 text-xs text-body">
                  Pick an instance above to load its issuers.
                </p>
              </div>
            ) : issuersLoading ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-6 text-sm text-body">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading issuers…
              </div>
            ) : (
              <>
                <div className="relative my-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={issuerQuery}
                    onChange={(e) => setIssuerQuery(e.target.value)}
                    placeholder="Search issuers…"
                    className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex w-full items-center gap-2 border-b border-gray-200 bg-grey-light/60 px-3 py-2 text-left transition hover:bg-grey-light"
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                        allSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {allSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="text-sm font-semibold text-heading">
                      {allSelected ? 'Deselect all issuers' : 'Select all issuers'}
                    </span>
                    <span className="ml-auto text-xs text-body">
                      {matchingIssuers.length} issuer{matchingIssuers.length === 1 ? '' : 's'}
                    </span>
                  </button>

                  <div className="nice-scroll max-h-64 divide-y divide-gray-100 overflow-auto">
                    {matchingIssuers.map((name) => {
                      const on = selectedIssuers.has(name)
                      return (
                        <button
                          type="button"
                          key={name}
                          onClick={() => toggleIssuer(name)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-grey-light/60"
                        >
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                              on ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {on && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="truncate text-sm font-medium text-heading">{name}</span>
                        </button>
                      )
                    })}
                    {matchingIssuers.length === 0 && (
                      <p className="px-3 py-8 text-center text-sm text-body">
                        {issuers.length === 0
                          ? 'No issuers found for the selected instance(s).'
                          : `No issuer found${issuerQuery.trim() ? ` for “${issuerQuery}”` : ''}.`}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-body transition hover:bg-grey-light"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid || submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {submitting ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

// Input classes with an error state (red border + red focus ring) when a
// field has a validation error to show.
const fieldCls = (hasError) =>
  hasError
    ? 'w-full rounded-lg border border-red-300 bg-red-50/40 py-2 px-3 text-sm text-heading outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100'
    : inputCls

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-heading">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}
