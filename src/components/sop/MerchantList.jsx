import { useMemo, useState } from 'react'
import { Search, Store, ChevronRight, FileSpreadsheet, Zap, ArrowRight } from 'lucide-react'
import { merchants } from '../../data/sopData'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../common/Pagination'
import Combobox from '../common/Combobox'
import { useTheme } from '../../theme/ThemeContext'

const classificationOptions = [
  'Blocking',
  'Activation',
  'Cancel Activate',
  'Cancel Redemptions',
  'Update Expiry',
  'Escalation Matrix',
  'POC',
]

// Map free-text classification (from the mail / BIN Series) to a subsheet key.
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

function resolveSubsheetKey(text, merchant) {
  const t = text.trim().toLowerCase()
  if (!t) return null
  if (classAliases[t]) return classAliases[t]
  // fuzzy: match against the merchant's actual subsheet names
  const found = merchant.subsheets.find(
    (s) => s.name.toLowerCase().includes(t) || t.includes(s.name.toLowerCase())
  )
  return found ? found.key : null
}

export default function MerchantList({ onSelect }) {
  const { theme } = useTheme()
  const t2 = theme === 'theme2'
  const [query, setQuery] = useState('')
  const [issuer, setIssuer] = useState('')
  const [classification, setClassification] = useState('')

  const debouncedQuery = useDebounce(query, 200)

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return merchants
    return merchants.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.classification.toLowerCase().includes(q)
    )
  }, [debouncedQuery])

  const pager = usePagination(filtered, 24)

  const merchantNames = useMemo(() => merchants.map((m) => m.name), [])

  const handleGo = (e) => {
    e.preventDefault()
    const merchant = merchants.find(
      (m) => m.name.toLowerCase() === issuer.trim().toLowerCase()
    )
    if (!merchant) return
    const subsheetKey = resolveSubsheetKey(classification, merchant)
    onSelect(merchant, subsheetKey)
  }

  const matchedMerchant = merchants.find(
    (m) => m.name.toLowerCase() === issuer.trim().toLowerCase()
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* quick jump: paste issuer + classification from BIN Series */}
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
            <span className="mb-1 block text-xs font-semibold text-heading">Issuer / Merchant</span>
            <Combobox
              value={issuer}
              onChange={setIssuer}
              options={merchantNames}
              placeholder="e.g. HDFC Bank"
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
            disabled={!matchedMerchant}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            Open SOP
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {issuer.trim() && !matchedMerchant && (
          <p className="mt-2 text-xs text-red-500">
            No merchant workbook found for “{issuer}”.
          </p>
        )}
      </form>

      {/* browse merchants */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-heading">All Merchants</h2>
          <p className="text-xs text-body">
            {filtered.length} merchant workbooks
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchant…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {pager.total === 0 ? (
          <p className="py-12 text-center text-sm text-body">
            No merchant found for “{query}”.
          </p>
        ) : t2 ? (
          /* Theme 2: dense single-column list rows */
          <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {pager.pageItems.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary/[0.04]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Store className="h-5 w-5" />
                </span>
                <span className="w-56 shrink-0 truncate font-semibold text-heading">{m.name}</span>
                <span className="rounded-full bg-grey-light px-2 py-0.5 text-xs font-medium text-body">
                  {m.classification}
                </span>
                <span className="flex items-center gap-1 text-xs text-body">
                  <FileSpreadsheet className="h-3 w-3" />
                  {m.subsheets.length} sheets
                </span>
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pager.pageItems.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary hover:shadow-md"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/5 text-primary">
                  <Store className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-heading">{m.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-body">
                    <span className="rounded-full bg-grey-light px-2 py-0.5 font-medium">
                      {m.classification}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="h-3 w-3" />
                      {m.subsheets.length} SOP sheets
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>

      {pager.total > 0 && (
        <div className="shrink-0 border-t border-gray-200 pt-3">
          <Pagination
            page={pager.page}
            totalPages={pager.totalPages}
            start={pager.start}
            end={pager.end}
            total={pager.total}
            onPrev={pager.prev}
            onNext={pager.next}
            onGoto={pager.setPage}
            label="merchants"
          />
        </div>
      )}
    </div>
  )
}
