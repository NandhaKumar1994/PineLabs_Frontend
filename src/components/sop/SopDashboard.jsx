import { useMemo, useState } from 'react'
import InstanceList from './InstanceList'
import MerchantList from './MerchantList'
import MerchantSop from './MerchantSop'
import { ArrowLeft, Layers } from 'lucide-react'
import { merchants as initialMerchants, instances } from '../../data/sopData'

export default function SopDashboard() {
  const [instance, setInstance] = useState(null)
  const [selected, setSelected] = useState(null)
  const [initialKey, setInitialKey] = useState(null)
  const [issuerData, setIssuerData] = useState(() => [...initialMerchants])

  // Issuers belonging to the selected instance.
  const instanceIssuers = useMemo(() => {
    if (!instance) return []
    const set = new Set(instance.issuerIds)
    return issuerData.filter((m) => set.has(m.id))
  }, [instance, issuerData])

  const handleSelect = (issuer, subsheetKey = null) => {
    const live = issuerData.find((m) => m.id === issuer.id) || issuer
    setSelected(live)
    setInitialKey(subsheetKey)
  }

  // An issuer name must be unique within a single instance (the same name may
  // legitimately exist in a different instance).
  const isDuplicateInInstance = (instanceId, name) => {
    const target = instances.find((inst) => inst.id === instanceId)
    if (!target) return false
    const wanted = String(name || '').trim().toLowerCase()
    if (!wanted) return false
    const ids = new Set(target.issuerIds)
    return issuerData.some(
      (m) => ids.has(m.id) && m.name.trim().toLowerCase() === wanted
    )
  }

  // Step 3 — issuer SOP detail
  if (selected) {
    return (
      <MerchantSop
        merchant={selected}
        initialKey={initialKey}
        onBack={() => setSelected(null)}
        onMerchantChange={(next) => {
          setIssuerData((prev) => prev.map((m) => (m.id === next.id ? next : m)))
          setSelected(next)
        }}
      />
    )
  }

  // Step 2 — issuers within the selected instance
  if (instance) {
    const header = (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setInstance(null)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-body transition hover:bg-grey-light"
          title="Back to instances"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/5 text-primary">
          <Layers className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-heading">{instance.name}</h2>
          <p className="text-xs text-body">{instanceIssuers.length} issuers in this instance</p>
        </div>
      </div>
    )
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <MerchantList
          headerLeft={header}
          merchants={instanceIssuers}
          instances={instances}
          currentInstanceId={instance.id}
          isDuplicateInInstance={isDuplicateInInstance}
          onMerchantsChange={(updater, targetInstanceId) => {
            const nextList =
              typeof updater === 'function' ? updater(instanceIssuers) : updater
            // Link the new/updated issuers to the chosen instance (defaults to
            // the one currently open).
            const target =
              instances.find((inst) => inst.id === targetInstanceId) || instance
            const existing = new Set(target.issuerIds)
            nextList.forEach((m) => existing.add(m.id))
            target.issuerIds = [...existing]
            // Merge the instance list back into the global issuer data.
            setIssuerData((prev) => {
              const byId = new Map(prev.map((m) => [m.id, m]))
              nextList.forEach((m) => byId.set(m.id, m))
              return [...byId.values()]
            })
          }}
          onSelect={handleSelect}
        />
      </div>
    )
  }

  // Jump directly to an issuer's SOP from the instance landing page.
  const handleJump = (issuer, subsheetKey = null) => {
    const parent = instances.find((inst) => inst.issuerIds.includes(issuer.id))
    if (parent) setInstance(parent)
    handleSelect(issuer, subsheetKey)
  }

  // Step 1 — instances
  return (
    <InstanceList
      instances={instances}
      issuers={issuerData}
      onSelect={setInstance}
      onJump={handleJump}
    />
  )
}
