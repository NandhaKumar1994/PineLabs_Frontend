import { useState } from 'react'
import { ArrowLeft, Store, FileSpreadsheet, Layers } from 'lucide-react'
import SopSheet from './SopSheet'
import SopValidateModal from './SopValidateModal'
import { commonEscalation } from '../../data/sopData'
import { stampEditor } from '../../data/users'

export default function MerchantSop({ merchant, initialKey, onBack, onMerchantChange }) {
  const validInitial = merchant.subsheets.some((s) => s.key === initialKey)
  const [activeKey, setActiveKey] = useState(
    validInitial ? initialKey : merchant.subsheets[0].key
  )
  const [showModal, setShowModal] = useState(false)
  const active = merchant.subsheets.find((s) => s.key === activeKey)

  // Build the cross-validation set: active action sheet + POC + Escalation.
  const poc = merchant.subsheets.find((s) => s.key === 'poc')
  const escalation =
    merchant.subsheets.find((s) => s.key === 'escalation') || commonEscalation
  const validateSheets = [active, poc, escalation].filter(
    (s, i, arr) => s && arr.indexOf(s) === i
  )

  const handleRowsChange = (sheetKey, rows) => {
    onMerchantChange?.({
      ...merchant,
      ...stampEditor(),
      subsheets: merchant.subsheets.map((s) => (s.key === sheetKey ? { ...s, rows } : s)),
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* merchant header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-body transition hover:bg-grey-light"
          title="Back to merchants"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/5 text-primary">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-heading">{merchant.name}</h2>
            <span className="rounded-full bg-grey-light px-2 py-0.5 text-xs font-medium text-body">
              {merchant.classification}
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-body">
            <FileSpreadsheet className="h-3 w-3" />
            {merchant.name} workbook · {merchant.subsheets.length} SOP sheets
          </p>
        </div>

        {/* cross-validate modal trigger */}
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
          title="Open all sheets to cross-validate"
        >
          <Layers className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Cross-validate</span>
        </button>
      </div>

      {/* subsheet navbar (like Excel tabs) */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
        {merchant.subsheets.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveKey(s.key)}
            className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
              s.key === activeKey
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-body hover:bg-grey-light'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* active subsheet */}
      <SopSheet sheet={active} title={active.name} onRowsChange={handleRowsChange} />

      {showModal && (
        <SopValidateModal
          merchant={merchant}
          sheets={validateSheets}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
