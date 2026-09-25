import { useMemo, useState } from 'react'
import { CreditCard, Copy, Check, ArrowRight, AlertCircle, Search, Upload } from 'lucide-react'
import { binSeries, BIN_TYPES } from '../../data/binSeries'
import { useRole } from '../../theme/RoleContext'
import BulkLookupModal from './BulkLookupModal'

export default function BinResolver() {
  const { perms } = useRole()
  const [card, setCard] = useState('')
  const [copied, setCopied] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const digits = card.replace(/\D/g, '')
  const bin = digits.slice(0, 6)
  const prefix = digits.slice(6, 9)

  const match = useMemo(() => {
    if (digits.length < 6) return null
    // Search Gift Card and Wallet BIN sets together.
    const candidates = binSeries.filter((r) => r.binIin === bin)
    if (!candidates.length) return null
    if (prefix.length === 3) {
      return candidates.find((r) => r.merchantPrefix === prefix) || null
    }
    // BIN known but prefix incomplete → return partial candidates
    return candidates.length === 1 ? candidates[0] : { partial: candidates }
  }, [digits, bin, prefix])

  const handleChange = (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 9)
    setCard(d.length > 6 ? `${d.slice(0, 6)} ${d.slice(6)}` : d)
  }

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* ignore */
    }
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
  }

  const resolved = match && !match.partial ? match : null
  const noMatch = digits.length >= 6 && !match
  const searched = digits.length > 0

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="grid items-stretch gap-0 lg:grid-cols-2">
        {/* left: input */}
        <div className="flex flex-col justify-center border-b border-gray-100 p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/5 text-primary">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-heading">Find the Issuer</h2>
                <p className="text-xs text-body">Enter the card number or upload a sheet</p>
              </div>
            </div>
            {perms.canUpload && (
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5"
                title="Look up multiple card numbers from a file"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            )}
          </div>

          <div className="relative mt-4">
            <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              inputMode="numeric"
              value={card}
              onChange={handleChange}
              maxLength={10}
              placeholder="401288 001"
              className="w-full rounded-xl border-2 border-gray-200 bg-grey-light py-3 pl-12 pr-20 text-xl font-bold tracking-widest text-heading outline-none transition focus:border-primary focus:bg-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-400 shadow-sm">
              {digits.length}/9
            </span>
          </div>

          {/* digit split hint */}
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <span
              className={`rounded-md px-2.5 py-1 font-medium ${
                digits.length >= 6 ? 'bg-primary/10 text-primary' : 'bg-grey-light text-gray-400'
              }`}
            >
              BIN / IIN {bin || '••••••'}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
            <span
              className={`rounded-md px-2.5 py-1 font-medium ${
                prefix.length === 3 ? 'bg-primary/10 text-primary' : 'bg-grey-light text-gray-400'
              }`}
            >
              Prefix {prefix || '•••'}
            </span>
          </div>
        </div>

        {/* right: result */}
        <div className="flex items-center p-4">
          {!searched && <IdleState />}

          {searched && resolved && (
            <ResultCard resolved={resolved} copied={copied} copy={copy} />
          )}

          {searched && match?.partial && (
            <PartialState count={match.partial.length} />
          )}

          {noMatch && <NoMatchState value={card} />}

          {searched && !resolved && !noMatch && !match?.partial && (
            <PromptState />
          )}
        </div>
      </div>

      {bulkOpen && <BulkLookupModal onClose={() => setBulkOpen(false)} />}
    </section>
  )
}

function IdleState() {
  return (
    <div className="w-full text-center text-gray-400">
      <CreditCard className="mx-auto h-10 w-10 text-gray-200" />
      <p className="mt-3 text-sm">The matched issuer will appear here.</p>
    </div>
  )
}

function PromptState() {
  return (
    <div className="w-full text-center text-gray-400">
      <p className="text-sm">Keep typing to complete the 9-digit card prefix…</p>
    </div>
  )
}

function PartialState({ count }) {
  return (
    <div className="w-full rounded-lg bg-amber-50 p-4 text-center">
      <p className="text-sm font-semibold text-amber-800">
        {count} card programs share this BIN
      </p>
      <p className="mt-1 text-xs text-amber-700">
        Enter the 3-digit merchant prefix to pinpoint the issuer.
      </p>
    </div>
  )
}

function NoMatchState({ value }) {
  return (
    <div className="w-full rounded-lg bg-red-50 p-4">
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-semibold">No issuer found</p>
      </div>
      <p className="mt-1 text-xs text-red-600">
        “{value}” didn't match any BIN series. Verify the digits or check the reference table below.
      </p>
    </div>
  )
}

function ResultCard({ resolved, copied, copy }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        Issuer matched
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-2xl font-extrabold text-heading">
            <span className="truncate">{resolved.issuer}</span>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
              {BIN_TYPES[resolved.binType]?.label || 'Gift Card'}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-body">
            {resolved.cardProgramGroupName || resolved.walletProgramName}
            {resolved.merchant && (
              <span className="text-gray-400"> · {resolved.merchant}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => copy(resolved.issuer, 'issuer')}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {copied === 'issuer' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied === 'issuer' ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <DetailCopy label="BIN / IIN" value={resolved.binIin} copied={copied} copy={copy} k="bin" />
        <DetailCopy label="Merchant Prefix" value={resolved.merchantPrefix} copied={copied} copy={copy} k="prefix" />
      </div>
    </div>
  )
}

function DetailCopy({ label, value, copied, copy, k }) {
  return (
    <button
      onClick={() => copy(value, k)}
      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left transition hover:border-primary hover:bg-primary/[0.03]"
    >
      <span>
        <span className="block text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
        <span className="font-semibold text-heading">{value}</span>
      </span>
      {copied === k ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4 text-gray-300" />
      )}
    </button>
  )
}
