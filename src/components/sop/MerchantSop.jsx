import { useState } from 'react'
import { ArrowLeft, Store, FileSpreadsheet, Layers, UploadCloud, Upload } from 'lucide-react'
import SopSheet from './SopSheet'
import SopValidateModal from './SopValidateModal'
import MerchantImportModal from './MerchantImportModal'
import { commonEscalation } from '../../data/sopData'
import { stampEditor } from '../../data/users'
import { useRole } from '../../theme/RoleContext'

export default function MerchantSop({ merchant, initialKey, onBack, onMerchantChange }) {
  const { perms } = useRole()
  const hasData = merchant.subsheets && merchant.subsheets.length > 0
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const firstKey = hasData ? merchant.subsheets[0].key : null
  const validInitial = hasData && merchant.subsheets.some((s) => s.key === initialKey)
  const [activeKey, setActiveKey] = useState(validInitial ? initialKey : firstKey)
  const active = hasData ? merchant.subsheets.find((s) => s.key === activeKey) || merchant.subsheets[0] : null

  const poc = hasData ? merchant.subsheets.find((s) => s.key === 'poc') : null
  const escalation =
    (hasData && merchant.subsheets.find((s) => s.key === 'escalation')) || commonEscalation
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

  const handleColumnsChange = (sheetKey, groups) => {
    onMerchantChange?.({
      ...merchant,
      ...stampEditor(),
      subsheets: merchant.subsheets.map((s) => (s.key === sheetKey ? { ...s, groups } : s)),
    })
  }

  // Import populates the empty merchant with new SOP sheets.
  const handleImport = (sheets) => {
    if (!sheets?.length) return
    onMerchantChange?.({ ...merchant, ...stampEditor(), subsheets: sheets })
    setActiveKey(sheets[0].key)
    setShowImport(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* merchant header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-body transition hover:bg-grey-light"
          title="Back to issuers"
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
            {hasData
              ? `${merchant.name} · ${merchant.subsheets.length} SOP sheets`
              : 'No SOP data yet'}
          </p>
        </div>

        {/* cross-validate modal trigger — only when there's data */}
        {hasData && (
          <button
            onClick={() => setShowModal(true)}
            className="ml-auto flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
            title="Open all sheets to cross-validate"
          >
            <Layers className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Cross-validate</span>
          </button>
        )}
      </div>

      {hasData ? (
        <>
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

          <SopSheet
            sheet={active}
            title={active.name}
            merchantName={merchant.name}
            onRowsChange={handleRowsChange}
            onColumnsChange={handleColumnsChange}
          />
        </>
      ) : (
        <EmptyUploadState canUpload={perms.canUpload} onImport={() => setShowImport(true)} />
      )}

      {showModal && (
        <SopValidateModal
          merchant={merchant}
          sheets={validateSheets}
          onClose={() => setShowModal(false)}
        />
      )}

      {showImport && (
        <MerchantImportModal
          merchant={merchant}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  )
}

// Big empty state shown when a (manually created) merchant has no SOP data.
function EmptyUploadState({ canUpload, onImport }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-primary/5 text-primary">
          <UploadCloud className="h-12 w-12" strokeWidth={1.5} />
        </span>
        <h3 className="mt-6 text-lg font-bold text-heading">No SOP data yet</h3>
        <p className="mt-1 max-w-sm text-sm text-body">
          This issuer was created manually and has no SOP sheets. Import the details
          sheet(s) to get started.
        </p>
        {canUpload ? (
          <button
            onClick={onImport}
            className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:opacity-90"
          >
            <Upload className="h-4.5 w-4.5" />
            Import Data
          </button>
        ) : (
          <p className="mt-6 text-xs text-gray-400">You do not have permission to import data.</p>
        )}
      </div>
    </div>
  )
}
