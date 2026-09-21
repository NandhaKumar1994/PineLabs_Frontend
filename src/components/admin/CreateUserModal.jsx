import { useMemo, useState } from 'react'
import { X, UserPlus, Search, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { merchants } from '../../data/sopData'

const roles = ['Admin', 'SME', 'Automation', 'Viewer']

export default function CreateUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', role: 'SME' })
  // access: { [merchantId]: Set(subsheetKeys) }
  const [access, setAccess] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [merchantQuery, setMerchantQuery] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const filteredMerchants = useMemo(() => {
    const q = merchantQuery.trim().toLowerCase()
    const base = q ? merchants.filter((m) => m.name.toLowerCase().includes(q)) : merchants
    return base.slice(0, 60)
  }, [merchantQuery])

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

  const valid = form.name.trim() && form.email.trim() && form.role

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const accessPayload = Object.fromEntries(
      Object.entries(access).map(([id, set]) => [id, [...set]])
    )
    onCreate?.({ ...form, access: accessPayload })
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

          {/* merchant + subsheet access */}
          <div>
            <div className="mb-1">
              <p className="text-sm font-semibold text-heading">Issuer SOP Access</p>
              <p className="text-xs text-body">
                Select issuers and configure which SOP menus (Block, Activation, POC…) the
                user sees. <span className="font-medium text-heading">{selectedMerchantCount}</span> issuer(s) enabled.
              </p>
            </div>

            <div className="relative my-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={merchantQuery}
                onChange={(e) => setMerchantQuery(e.target.value)}
                placeholder="Search issuers…"
                className="w-full rounded-lg border border-gray-200 bg-grey-light py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="max-h-64 divide-y divide-gray-100 overflow-auto rounded-lg border border-gray-200">
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
            </div>
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
