// SOP data model for the prototype.
// Issuer (workbook = issuer name, matching BIN Series) → subsheets
// (classifications/actions) → grouped columns + rows.
// BOTH the two-tier headers and the per-column filters are derived
// dynamically from each subsheet's `groups` + `rows`.
// Each issuer intentionally has DIFFERENT group/column structures and rows.

import { stampEditor } from './users'

const sheet = (key, name, groups, rows) => ({ key, name, groups, rows })

// Shared Escalation Matrix used across all merchants for cross-validation.
export const commonEscalation = sheet(
  'escalation',
  'Escalation Matrix',
  [{ group: 'Escalation Matrix', columns: ['Severity', 'Owner', 'TAT', 'Next Level'] }],
  [
    { Severity: 'P1 · Critical', Owner: 'Ops Lead', TAT: '1h', 'Next Level': 'Support Head' },
    { Severity: 'P2 · High', Owner: 'Support Manager', TAT: '4h', 'Next Level': 'Ops Lead' },
    { Severity: 'P3 · Medium', Owner: 'Senior Agent', TAT: '1d', 'Next Level': 'Support Manager' },
    { Severity: 'P4 · Low', Owner: 'Agent', TAT: '2d', 'Next Level': 'Senior Agent' },
  ]
)

/* ------------------------------------------------------------------ *
 * Aurora Retail
 * ------------------------------------------------------------------ */
const hdfcSheets = [
  sheet(
    'block',
    'Block',
    [
      { group: 'Prerequisites', columns: ['Card Status', 'Balance', 'Requester', 'Region'] },
      { group: 'Input from the requester', columns: ['Need Reason?', 'Outlet (for blocking)', 'Reason Code'] },
      { group: 'Validations', columns: ['Activating Merchant Group', 'CPG', 'Descriptive Outlet', 'Risk Level'] },
      { group: 'SLA & Ownership', columns: ['Owner Team', 'Approval Level', 'TAT', 'Action'] },
    ],
    [
      { 'Card Status': 'Created', Balance: 'NA', Requester: 'Brand POC', Region: 'North', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Reason Code': 'FRD-01', 'Activating Merchant Group': 'NA', CPG: 'NA', 'Descriptive Outlet': 'NA', 'Risk Level': 'Low', 'Owner Team': 'Ops', 'Approval Level': 'L1', TAT: '4h', Action: 'Approve' },
      { 'Card Status': 'Purchased', Balance: 'NA', Requester: 'Brand POC', Region: 'South', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Reason Code': 'FRD-02', 'Activating Merchant Group': 'Brand, Reseller and NAB', CPG: 'NA', 'Descriptive Outlet': 'NA', 'Risk Level': 'Low', 'Owner Team': 'Ops', 'Approval Level': 'L1', TAT: '4h', Action: 'Approve' },
      { 'Card Status': 'Activated', Balance: 'Zero', Requester: 'Brand POC', Region: 'West', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Reason Code': 'FRD-03', 'Activating Merchant Group': 'Brand, Reseller and NAB', CPG: 'NA', 'Descriptive Outlet': 'NA', 'Risk Level': 'Medium', 'Owner Team': 'Risk', 'Approval Level': 'L2', TAT: '8h', Action: 'Approve' },
      { 'Card Status': 'Activated', Balance: '>Zero', Requester: 'CES', Region: 'East', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Reason Code': 'FRD-07', 'Activating Merchant Group': 'GiftBig', CPG: 'Yes', 'Descriptive Outlet': 'NA', 'Risk Level': 'High', 'Owner Team': 'Risk', 'Approval Level': 'L3', TAT: '1h', Action: 'Escalate' },
      { 'Card Status': 'Deactivated', Balance: 'NA', Requester: 'Brand POC', Region: 'North', 'Need Reason?': 'NA', 'Outlet (for blocking)': 'NA', 'Reason Code': 'NA', 'Activating Merchant Group': 'Brand, Reseller and NAB', CPG: 'NA', 'Descriptive Outlet': 'NA', 'Risk Level': 'Low', 'Owner Team': 'Ops', 'Approval Level': 'L1', TAT: '1d', Action: 'Reject' },
      { 'Card Status': 'Expired', Balance: 'Zero', Requester: 'CES', Region: 'South', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Reason Code': 'FRD-09', 'Activating Merchant Group': 'GiftBig', CPG: 'Yes', 'Descriptive Outlet': 'Yes', 'Risk Level': 'Medium', 'Owner Team': 'Support', 'Approval Level': 'L2', TAT: '8h', Action: 'Approve' },
    ]
  ),
  sheet(
    'activation',
    'Activation',
    [
      { group: 'Prerequisites', columns: ['Card Status', 'KYC'] },
      { group: 'Validations', columns: ['Channel', 'Action'] },
    ],
    [
      { 'Card Status': 'Created', KYC: 'Done', Channel: 'NetBanking', Action: 'Activate' },
      { 'Card Status': 'Created', KYC: 'Pending', Channel: 'NetBanking', Action: 'Hold' },
      { 'Card Status': 'Purchased', KYC: 'Done', Channel: 'Branch', Action: 'Activate' },
      { 'Card Status': 'Deactivated', KYC: 'Done', Channel: 'NetBanking', Action: 'Reject' },
    ]
  ),
  sheet(
    'cancel-activate',
    'Cancel Activate',
    [
      { group: 'Prerequisites', columns: ['Card Status', 'Balance'] },
      { group: 'Validations', columns: ['Window (days)', 'Action'] },
    ],
    [
      { 'Card Status': 'Activated', Balance: 'Zero', 'Window (days)': '≤ 7', Action: 'Cancel' },
      { 'Card Status': 'Activated', Balance: '>Zero', 'Window (days)': '≤ 7', Action: 'Escalate' },
      { 'Card Status': 'Activated', Balance: 'Zero', 'Window (days)': '> 7', Action: 'Reject' },
    ]
  ),
  sheet(
    'poc',
    'POC',
    [{ group: 'Contacts', columns: ['Team', 'Name', 'Email', 'SLA'] }],
    [
      { Team: 'Brand POC', Name: 'Ravi Kumar', Email: 'brand.poc@aurora.example.in', SLA: '4h' },
      { Team: 'Escalation', Name: 'Neha Shah', Email: 'esc@aurora.example.in', SLA: '2h' },
      { Team: 'CES', Name: 'Arjun Rao', Email: 'ces@aurora.example.in', SLA: '8h' },
    ]
  ),
]

/* ------------------------------------------------------------------ *
 * Bluewave Stores — different structure
 * ------------------------------------------------------------------ */
const iciciSheets = [
  sheet(
    'block',
    'Block',
    [
      { group: 'Card', columns: ['Card Type', 'Status', 'Region'] },
      { group: 'Decision', columns: ['Reason Required', 'Approval Level', 'Action'] },
    ],
    [
      { 'Card Type': 'Standard', Status: 'Active', Region: 'North', 'Reason Required': 'Yes', 'Approval Level': 'L1', Action: 'Block' },
      { 'Card Type': 'Standard', Status: 'Active', Region: 'South', 'Reason Required': 'Yes', 'Approval Level': 'L2', Action: 'Block' },
      { 'Card Type': 'Premium', Status: 'Expired', Region: 'West', 'Reason Required': 'No', 'Approval Level': 'L1', Action: 'Reject' },
      { 'Card Type': 'Premium', Status: 'Active', Region: 'East', 'Reason Required': 'Yes', 'Approval Level': 'L3', Action: 'Escalate' },
    ]
  ),
  sheet(
    'activation',
    'Activation',
    [
      { group: 'Order', columns: ['Order Type', 'Payment'] },
      { group: 'Rule', columns: ['Auto Activate', 'Action'] },
    ],
    [
      { 'Order Type': 'Bulk', Payment: 'Prepaid', 'Auto Activate': 'Yes', Action: 'Activate' },
      { 'Order Type': 'Bulk', Payment: 'Credit', 'Auto Activate': 'No', Action: 'Manual Review' },
      { 'Order Type': 'Single', Payment: 'Prepaid', 'Auto Activate': 'Yes', Action: 'Activate' },
    ]
  ),
  sheet(
    'cancel-redemptions',
    'Cancel Redemptions',
    [{ group: 'Redemption', columns: ['Txn Status', 'Amount Slab', 'Action'] }],
    [
      { 'Txn Status': 'Success', 'Amount Slab': '< 5000', Action: 'Reverse' },
      { 'Txn Status': 'Success', 'Amount Slab': '≥ 5000', Action: 'Escalate' },
      { 'Txn Status': 'Pending', 'Amount Slab': '< 5000', Action: 'Wait' },
    ]
  ),
  sheet(
    'escalation',
    'Escalation Matrix',
    [{ group: 'Matrix', columns: ['Severity', 'Owner', 'TAT'] }],
    [
      { Severity: 'P1', Owner: 'Ops Lead', TAT: '1h' },
      { Severity: 'P2', Owner: 'Support Mgr', TAT: '4h' },
      { Severity: 'P3', Owner: 'Agent', TAT: '1d' },
    ]
  ),
]

/* ------------------------------------------------------------------ *
 * Cedar Mart — another structure
 * ------------------------------------------------------------------ */
const axisSheets = [
  sheet(
    'block',
    'Block',
    [
      { group: 'Account', columns: ['Card State', 'KYC Tier'] },
      { group: 'Checks', columns: ['Fraud Flag', 'Balance', 'Action'] },
    ],
    [
      { 'Card State': 'Active', 'KYC Tier': 'Full', 'Fraud Flag': 'No', Balance: '>Zero', Action: 'Block' },
      { 'Card State': 'Active', 'KYC Tier': 'Min', 'Fraud Flag': 'Yes', Balance: '>Zero', Action: 'Freeze' },
      { 'Card State': 'Suspended', 'KYC Tier': 'Full', 'Fraud Flag': 'No', Balance: 'Zero', Action: 'Reject' },
    ]
  ),
  sheet(
    'update-expiry',
    'Update Expiry',
    [{ group: 'Expiry', columns: ['Current Validity', 'Extension', 'Approval', 'Action'] }],
    [
      { 'Current Validity': '< 30d', Extension: '+90d', Approval: 'L1', Action: 'Extend' },
      { 'Current Validity': 'Expired', Extension: '+180d', Approval: 'L2', Action: 'Extend' },
      { 'Current Validity': '> 30d', Extension: 'NA', Approval: 'NA', Action: 'Reject' },
    ]
  ),
  sheet(
    'poc',
    'POC',
    [{ group: 'Contacts', columns: ['Team', 'Name', 'Phone'] }],
    [
      { Team: 'Card Ops', Name: 'Sana Iyer', Phone: '+91 98••• 12345' },
      { Team: 'Risk', Name: 'Dev Menon', Phone: '+91 99••• 67890' },
    ]
  ),
]

/* ------------------------------------------------------------------ *
 * Generic (distinct) sheets for the remaining issuers
 * ------------------------------------------------------------------ */
const genericSheets = (label, domain) => [
  sheet(
    'block',
    'Block',
    [
      { group: 'Prerequisites', columns: ['Card Status', 'Balance'] },
      { group: 'Decision', columns: ['Requester', 'Action'] },
    ],
    [
      { 'Card Status': 'Active', Balance: 'Zero', Requester: `${label} POC`, Action: 'Block' },
      { 'Card Status': 'Active', Balance: '>Zero', Requester: 'CES', Action: 'Escalate' },
      { 'Card Status': 'Expired', Balance: 'Zero', Requester: `${label} POC`, Action: 'Reject' },
    ]
  ),
  sheet(
    'activation',
    'Activation',
    [{ group: 'Rule', columns: ['Channel', 'KYC', 'Action'] }],
    [
      { Channel: 'Online', KYC: 'Done', Action: 'Activate' },
      { Channel: 'Branch', KYC: 'Pending', Action: 'Hold' },
    ]
  ),
  sheet(
    'poc',
    'POC',
    [{ group: 'Contacts', columns: ['Team', 'Name', 'Email'] }],
    [{ Team: `${label} POC`, Name: 'Support Desk', Email: `poc@${domain}` }]
  ),
]

// Issuer names + classifications mirror BIN Series so the demo flows
// end-to-end: resolve an issuer in BIN Series → open it here.
/* ------------------------------------------------------------------ *
 * Bulk synthetic issuers — simulates the real 400–600 merchant volume.
 * Rows are also scaled up so tables are stress-tested for the demo.
 * ------------------------------------------------------------------ */
const classifications = ['Digital Gift Card', 'Physical Gift Card', 'Corporate Gifting', 'Reward Card']
const editors = ['Ravi Kumar', 'Neha Shah', 'Arjun Rao', 'Priya Das', 'Dev Menon', 'Karthik Nair']

const pad = (n) => String(n).padStart(2, '0')
const editorStamp = (i) => ({
  updatedBy: editors[i % editors.length],
  updatedAt: `2026-09-${pad(1 + (i % 14))} ${pad(9 + (i % 8))}:${pad((i * 11) % 60)}`,
})
const cardStatuses = ['Created', 'Purchased', 'Activated', 'Deactivated', 'Expired']
const balances = ['NA', 'Zero', '>Zero']
const requesters = ['Brand POC', 'CES', 'All others apart from Brand POC']
const actions = ['Approve', 'Reject', 'Escalate', 'Hold']

// Deterministic pseudo-random so the dataset is stable across reloads.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function bulkSheets(label, domain, seed, rowCount) {
  const rand = mulberry32(seed)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]

  const blockRows = Array.from({ length: rowCount }, () => ({
    'Card Status': pick(cardStatuses),
    Balance: pick(balances),
    Requester: pick(requesters),
    'Need Reason?': rand() > 0.3 ? 'Yes' : 'NA',
    'Outlet (for blocking)': rand() > 0.3 ? 'Yes' : 'NA',
    'Activating Merchant Group': rand() > 0.5 ? 'Brand, Reseller and NAB' : 'GiftBig',
    CPG: rand() > 0.6 ? 'Yes' : 'NA',
    Action: pick(actions),
  }))

  return [
    sheet(
      'block',
      'Block',
      [
        { group: 'Prerequisites', columns: ['Card Status', 'Balance', 'Requester'] },
        { group: 'Input from the requester', columns: ['Need Reason?', 'Outlet (for blocking)'] },
        { group: 'Validations', columns: ['Activating Merchant Group', 'CPG', 'Action'] },
      ],
      blockRows
    ),
    sheet(
      'activation',
      'Activation',
      [{ group: 'Rule', columns: ['Channel', 'KYC', 'Action'] }],
      Array.from({ length: Math.ceil(rowCount / 2) }, () => ({
        Channel: rand() > 0.5 ? 'Online' : 'Branch',
        KYC: rand() > 0.4 ? 'Done' : 'Pending',
        Action: pick(actions),
      }))
    ),
    sheet(
      'poc',
      'POC',
      [{ group: 'Contacts', columns: ['Team', 'Name', 'Email'] }],
      [{ Team: `${label} POC`, Name: 'Support Desk', Email: `poc@${domain}` }]
    ),
  ]
}

// Curated issuers (mirroring BIN Series) with hand-built distinct sheets.
const curated = [
  { id: 'aurora', name: 'Aurora Retail', classification: 'Digital Gift Card', ...editorStamp(0), subsheets: hdfcSheets },
  { id: 'bluewave', name: 'Bluewave Stores', classification: 'Physical Gift Card', ...editorStamp(1), subsheets: iciciSheets },
  { id: 'cedar', name: 'Cedar Mart', classification: 'Corporate Gifting', ...editorStamp(2), subsheets: axisSheets },
  { id: 'delta', name: 'Delta Goods', classification: 'Digital Gift Card', ...editorStamp(3), subsheets: genericSheets('Delta', 'delta.example.in') },
  { id: 'everest', name: 'Everest Retail', classification: 'Reward Card', ...editorStamp(4), subsheets: genericSheets('Everest', 'everest.example.in') },
  { id: 'fusion', name: 'Fusion Mart', classification: 'Physical Gift Card', ...editorStamp(5), subsheets: genericSheets('Fusion', 'fusion.example.in') },
  { id: 'granite', name: 'Granite Stores', classification: 'Corporate Gifting', ...editorStamp(6), subsheets: genericSheets('Granite', 'granite.example.in') },
  { id: 'horizon', name: 'Horizon Retail', classification: 'Reward Card', ...editorStamp(7), subsheets: genericSheets('Horizon', 'horizon.example.in') },
  { id: 'ivory', name: 'Ivory Mart', classification: 'Digital Gift Card', ...editorStamp(8), subsheets: genericSheets('Ivory', 'ivory.example.in') },
  { id: 'jade', name: 'Jade Stores', classification: 'Corporate Gifting', ...editorStamp(9), subsheets: genericSheets('Jade', 'jade.example.in') },
]

// Generate ~500 additional issuers to simulate real volume.
const BULK_COUNT = 500
const bulk = Array.from({ length: BULK_COUNT }, (_, i) => {
  const n = i + 1
  const name = `Issuer ${String(n).padStart(3, '0')} Bank`
  const domain = `issuer${n}.example.in`
  return {
    id: `issuer-${n}`,
    name,
    classification: classifications[n % classifications.length],
    // Every 7th issuer is deactivated so the Inactive list has sample data.
    status: n % 7 === 0 ? 'Inactive' : 'Active',
    ...editorStamp(n),
    // vary row counts so some sheets are big (stress test)
    subsheets: bulkSheets(name, domain, n, 40 + (n % 12) * 30),
  }
})

export const merchants = [...curated, ...bulk]

// Alias — the domain term is now "issuer".
export const issuers = merchants

/* ------------------------------------------------------------------ *
 * Instances — an instance groups multiple issuers. The SOP Dashboard
 * lists instances first; selecting one loads that instance's issuers.
 * ------------------------------------------------------------------ */
const INSTANCE_NAMES = [
  'North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone',
  'Enterprise', 'SME', 'Retail Partners', 'Online Partners', 'Strategic Accounts',
  'Pilot Program', 'Legacy Migration', 'New Onboarding', 'Priority Tier', 'Standard Tier',
]

// Deterministically distribute issuers across instances (round-robin).
export const instances = INSTANCE_NAMES.map((name, i) => ({
  id: `inst-${i + 1}`,
  name,
  status: 'Active',
  // Ticket the instance was created/last revised under.
  ticket: `PL-${10200 + i * 13}`,
  ...editorStamp(i),
  issuerIds: merchants.filter((_, idx) => idx % INSTANCE_NAMES.length === i).map((m) => m.id),
}))

// Helper: get the issuers belonging to an instance.
export const issuersForInstance = (instance) => {
  const set = new Set(instance.issuerIds)
  return merchants.filter((m) => set.has(m.id))
}

// New instance created from the Instance Management screen.
export function createInstance({ name, status = 'Active', ticket = '' }) {
  const label = String(name || '').trim()
  return {
    id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: label,
    status,
    ticket: String(ticket || '').trim(),
    ...stampEditor(),
    issuerIds: [],
  }
}

export function createMerchant({ name, classification, manualEntry = false }) {
  const label = String(name || '').trim()
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'merchant'
  return {
    id: `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: label,
    classification: String(classification || 'Digital Gift Card').trim(),
    status: 'Active',
    manualEntry, // true when created via the manual "Create Merchant" form
    ...stampEditor(),
    // Manually created merchants start with NO SOP data — the detail page shows
    // an upload empty state until data is imported. Non-manual (upload) merchants
    // get generic starter sheets.
    subsheets: manualEntry ? [] : genericSheets(label, `${slug}.example.in`),
  }
}
