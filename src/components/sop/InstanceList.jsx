import { useMemo, useState } from 'react'
import { Search, Layers, ChevronRight, Building2, Zap, Store, ArrowRight, Copy } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import Combobox from '../common/Combobox'
import { useRole } from '../../theme/RoleContext'

const classificationOptions = [
  'Blocking',
  'Activation',
  'Cancel Activate',
  'Cancel Redemptions',
  'Update Expiry',
  'Escalation Matrix',
  'POC',
]

const classAliases = {
  block: 'block',
  blocking: 'block',
  activation: 'activation',
  activate: 'activation',
  'cancel activate': 'cancel-activate',
  'cancel activation': 'cancel-activate',
  'cancel redemptions': 'cancel-redemptions',
  'cancel redemption': 'cancel-redemptions',
  'update expiry': 'update-expiry',
  expiry: 'update-expiry',
  escalation: 'escalation',
  poc: 'poc',
}

function resolveSubsheetKey(text, issuer) {
  const t = text.trim().toLowerCase()
  if (!t) return null
  if (classAliases[t]) return classAliases[t]
  const found = issuer.subsheets?.find(
    (s) => s.name.toLowerCase().includes(t) || t.includes(s.name.toLowerCase())
  )
  return found ? found.key : null
}

// Lists SOP instances. Selecting one loads that instance's issuers.
// The Jump-to-SOP form lets a user open an issuer's SOP directly.
export default function InstanceList({ instances, issuers = [], onSelect, onJump, onClone }) {
  const { perms } = useRole()
  const [query, setQuery] = useState('')
  const [issuer, setIssuer] = useState('')
  const [classification, setClassification] = useState('')
  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    if (!q) return instances
    return instances.filter((i) => i.name.toLowerCase().includes(q))
  }, [debounced, instances])

  const issuerNames = useMemo(() => issuers.map((m) => m.name), [issuers])

  const matched = issuers.find(
    (m) => m.name.toLowerCase() === issuer.trim().toLowerCase()
  )

  const handleGo = (e) => {
    e.preventDefault()
    if (!matched) return
    onJump?.(matched, resolveSubsheetKey(classification, matched))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* quick jump: paste issuer + classification from a ticket / BIN Series */}
      <form
        onSubmit={handleGo}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/5 text-primary">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-heading">Jump to SOP</h2>
            <p className="text-xs text-body">
              Paste the Issuer and Classification from the ticket / BIN Series
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-semibold text-heading">Issuer</span>
            <Combobox
              value={issuer}
              onChange={setIssuer}
              options={issuerNames}
              placeholder="e.g. Aurora Retail"
              icon={Store}
            />
          </label>

          <label className="flex-1">
            <span className="mb-1 block text-xs font-semibold text-heading">Classification</span>
            <Combobox
              value={classification}
              onChange={setClassification}
              options={classificationOptions}
              placeholder="e.g. Blocking"
              icon={Zap}
            />
          </label>

          <button
            type="submit"
            disabled={!matched}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            Open SOP
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {issuer.trim() && !matched && (
          <p className="mt-2 text-xs text-red-500">
            No issuer workbook found for &ldquo;{issuer}&rdquo;.
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-heading">Instances</h2>
          <p className="text-xs text-body">Select an instance to view its issuers</p>
        </div>
        <div className="relative w-52 sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search instance…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-body">
            No instance found for &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((inst) => (
              <div
                key={inst.id}
                className="group relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary hover:shadow-md"
              >
                {onClone && perms.canCreate && (
                  <button
                    type="button"
                    onClick={() => onClone(inst)}
                    title={`Clone ${inst.name}`}
                    className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-md text-gray-300 opacity-0 transition hover:bg-grey-light hover:text-primary focus:opacity-100 group-hover:opacity-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(inst)}
                  className="absolute inset-0 rounded-xl"
                  aria-label={`Open ${inst.name}`}
                />
                <span className="pointer-events-none grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/5 text-primary">
                  <Layers className="h-6 w-6" />
                </span>
                <div className="pointer-events-none min-w-0 flex-1">
                  <p className="truncate font-bold text-heading">{inst.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-body">
                    <Building2 className="h-3 w-3" />
                    {inst.issuerIds.length} issuers
                  </p>
                </div>
                <ChevronRight className="pointer-events-none h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
