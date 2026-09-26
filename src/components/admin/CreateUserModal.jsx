import { useMemo, useState } from 'react'
import { X, UserPlus, Search, Check, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { merchants, instances } from '../../data/sopData'
import MultiSelect from '../common/MultiSelect'

const roles = ['Admin', 'SME', 'Automation', 'Viewer']

export default function CreateUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', role: 'SME' })
  // access: { [merchantId]: Set(subsheetKeys) }
  const [access, setAccess] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [merchantQuery, setMerchantQuery] = useState('')
  // One or more instances; the issuer list below is scoped to these.
  const [instanceIds, setInstanceIds] = useState([])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const instanceOptions = useMemo(
    () =>
      instances.map((i) => ({
        value: i.id,
        label: i.name,
        hint: `${i.issuerIds.length} issuers`,
      })),
    []
  )

  // Issuers belonging to any of the selected instances.
  const instanceMerchants = useMemo(() => {
    if (!instanceIds.length) return []
    const ids = new Set()
    instanceIds.forEach((id) => {
      instances.find((i) => i.id === id)?.issuerIds.forEach((iid) => ids.add(iid))
    })
    return merchants.filter((m) => ids.has(m.id))
  }, [instanceIds])

  // Full set that matches the current search (used by Select all).
  const matchingMerchants = useMemo(() => {
    const q = merchantQuery.trim().toLowerCase()
    return q
      ? instanceMerchants.filter((m) => m.name.toLowerCase().includes(q))
      : instanceMerchants
  }, [merchantQuery, instanceMerchants])

  // Only render a capped slice for performance.
  const filteredMerchants = useMemo(() => matchingMerchants.slice(0, 60), [matchingMerchants])

  const isMerchantOn = (id) => !!access[id]
  const sheetCount = (id) => (access[id] ? access[id].size : 0)

  // Toggle whole merchant: on = all subsheets, off = removed.
  const toggleMerchant = (m) =>
    setAccess((prev) => {
      const next = { ...prev }
      if (next[m.id]) {
        delete next[m.id]
      } else {
        next[m.id] = new Set(m.subsheets.map((s) => s.key))
      }
      return next
    })

  // Toggle a single subsheet within a merchant.
  const toggleSheet = (m, key) =>
    setAccess((prev) => {
      const next = { ...prev }
      const cur = new Set(next[m.id] || [])
      cur.has(key) ? cur.delete(key) : cur.add(key)
      if (cur.size === 0) delete next[m.id]
      else next[m.id] = cur
      return next
    })

  const selectedMerchantCount = Object.keys(access).length

  // Whether every issuer matching the current search is fully selected.
  const allSelected =
    matchingMerchants.length > 0 && matchingMerchants.every((m) => access[m.id])

  // Select all → enable every matching issuer with all its subsheets.
  // Deselect all → remove them.
  const toggleSelectAll = () =>
    setAccess((prev) => {
      const next = { ...prev }
      if (allSelected) {
        matchingMerchants.forEach((m) => delete next[m.id])
      } else {
        matchingMerchants.forEach((m) => {
          next[m.id] = new Set(m.subsheets.map((s) => s.key))
        })
      }
      return next
    })

  // Changing the instance scope drops any issuer picks that no longer apply.
  const changeInstances = (ids) => {
    setInstanceIds(ids)
    const keep = new Set()
    ids.forEach((id) => {
      instances.find((i) => i.id === id)?.issuerIds.forEach((iid) => keep.add(iid))
    })
    setAccess((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([mid]) => keep.has(mid)))
    )
    setExpanded(null)
    setMerchantQuery('')
  }

  const valid = form.name.trim() && form.email.trim() && form.role && instanceIds.length > 0

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const accessPayload = Object.fromEntries(
      Object.entries(access).map(([id, set]) => [id, [...set]])
    )
    onCreate?.({ ...form, instanceIds, access: accessPayload })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-heading/40 backdrop-blur-sm" onClick={onClose} />

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
              <h2 className="text-sm font-bold text-heading">Create User</h2>
              <p className="text-xs text-body">Add a user and configure their SOP menu access</p>
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
          {/* details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Ravi Kumar" className={inputCls} />
            </Field>
            <Field label="Email ID" required>
              <input type="email" value={form.email} onChange={set('email')} placeholder="name@pinelabs.in" className={inputCls} />
            </Field>
            <Field label="Mobile Number">
              <input value={form.mobile} onChange={set('mobile')} placeholder="+91 •••••• ••••" className={inputCls} />
            </Field>
            <Field label="Role" required>
              <select value={form.role} onChange={set('role')} className={inputCls}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* instance scope — drives which issuers are listed below */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                <Layers className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-semibold text-heading">
                Instance <span className="text-red-500">*</span>
              </p>
              {instanceIds.length > 0 && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {instanceIds.length} selected · {instanceMerchants.length} issuers
                </span>
              )}
            </div>
            <p className="mb-2 text-xs text-body">
              Choose one or more instances. Only their issuers appear below.
            </p>
            <MultiSelect
              options={instanceOptions}
              selected={instanceIds}
              onChange={changeInstances}
              placeholder="Select instances…"
              searchPlaceholder="Search instances…"
              allLabel="Select all instances"
            />
          </div>

          {/* merchant + subsheet access */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm font-semibold text-heading">Issuer SOP Access</p>
              {instanceIds.length > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    selectedMerchantCount
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-grey-light text-body'
                  }`}
                >
                  {selectedMerchantCount} issuer{selectedMerchantCount === 1 ? '' : 's'} enabled
                </span>
              )}
            </div>
            <p className="text-xs text-body">
              {instanceIds.length
                ? 'Tick an issuer to grant all its SOP menus, or expand it to pick individual menus.'
                : 'Choose an instance first to load its issuers.'}
            </p>

            {!instanceIds.length ? (
              <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-grey-light/50 px-4 py-8 text-center">
                <Layers className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-heading">No instance selected</p>
                <p className="mt-0.5 text-xs text-body">
                  Pick an instance above to configure issuer-level SOP access.
                </p>
              </div>
            ) : (
              <>
            <div className="relative my-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={merchantQuery}
                onChange={(e) => setMerchantQuery(e.target.value)}
                placeholder="Search issuers…"
                className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              {/* select all issuers */}
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
                  {matchingMerchants.length} issuer{matchingMerchants.length === 1 ? '' : 's'}
                </span>
              </button>

              <div className="nice-scroll max-h-64 divide-y divide-gray-100 overflow-auto">
              {filteredMerchants.map((m) => {
                const on = isMerchantOn(m.id)
                const open = expanded === m.id
                return (
                  <div key={m.id}>
                    <div className="flex items-center gap-2 px-3 py-2">
                      {/* merchant checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleMerchant(m)}
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                          on ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : m.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-heading">{m.name}</span>
                          <span className="block truncate text-xs text-body">
                            {on ? `${sheetCount(m.id)} of ${m.subsheets.length} menus` : m.classification}
                          </span>
                        </span>
                        <span className="ml-auto text-gray-400">
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </span>
                      </button>
                    </div>

                    {/* subsheet menu config */}
                    {open && (
                      <div className="flex flex-wrap gap-1.5 bg-grey-light/60 px-3 pb-3 pl-9">
                        {m.subsheets.map((s) => {
                          const checked = !!access[m.id]?.has(s.key)
                          return (
                            <button
                              type="button"
                              key={s.key}
                              onClick={() => toggleSheet(m, s.key)}
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                checked
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-gray-200 bg-white text-body hover:bg-grey-light'
                              }`}
                            >
                              {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                              {s.name}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {matchingMerchants.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-body">
                  No issuer found{merchantQuery.trim() ? ` for “${merchantQuery}”` : ''}.
                </p>
              )}
              </div>

              {matchingMerchants.length > filteredMerchants.length && (
                <p className="border-t border-gray-100 bg-grey-light/60 px-3 py-1.5 text-center text-[11px] text-body">
                  Showing {filteredMerchants.length} of {matchingMerchants.length} — search to
                  narrow, or use Select all to include every match.
                </p>
              )}
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
            disabled={!valid}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-grey-light py-2 px-3 text-sm text-heading outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-heading">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
