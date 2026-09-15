// SOP data model for the prototype.
// Issuer (workbook = issuer name, matching BIN Series) → subsheets
// (classifications/actions) → grouped columns + rows.
// BOTH the two-tier headers and the per-column filters are derived
// dynamically from each subsheet's `groups` + `rows`.
// Each issuer intentionally has DIFFERENT group/column structures and rows.

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
 * HDFC Bank
 * ------------------------------------------------------------------ */
const hdfcSheets = [
  sheet(
    'block',
    'Block',
    [
      { group: 'Prerequisites', columns: ['Card Status', 'Balance', 'Requester'] },
      { group: 'Input from the requester', columns: ['Need Reason?', 'Outlet (for blocking)'] },
      { group: 'Validations', columns: ['Activating Merchant Group', 'CPG', 'Descriptive Outlet', 'Action'] },
    ],
    [
      { 'Card Status': 'Created', Balance: 'NA', Requester: 'Brand POC', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Activating Merchant Group': 'NA', CPG: 'NA', 'Descriptive Outlet': 'NA', Action: 'Approve' },
      { 'Card Status': 'Purchased', Balance: 'NA', Requester: 'Brand POC', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Activating Merchant Group': 'Brand, Reseller and NAB', CPG: 'NA', 'Descriptive Outlet': 'NA', Action: 'Approve' },
      { 'Card Status': 'Activated', Balance: 'Zero', Requester: 'Brand POC', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Activating Merchant Group': 'Brand, Reseller and NAB', CPG: 'NA', 'Descriptive Outlet': 'NA', Action: 'Approve' },
      { 'Card Status': 'Activated', Balance: '>Zero', Requester: 'CES', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Activating Merchant Group': 'GiftBig', CPG: 'Yes', 'Descriptive Outlet': 'NA', Action: 'Escalate' },
      { 'Card Status': 'Deactivated', Balance: 'NA', Requester: 'Brand POC', 'Need Reason?': 'NA', 'Outlet (for blocking)': 'NA', 'Activating Merchant Group': 'Brand, Reseller and NAB', CPG: 'NA', 'Descriptive Outlet': 'NA', Action: 'Reject' },
      { 'Card Status': 'Expired', Balance: 'Zero', Requester: 'CES', 'Need Reason?': 'Yes', 'Outlet (for blocking)': 'Yes', 'Activating Merchant Group': 'GiftBig', CPG: 'Yes', 'Descriptive Outlet': 'Yes', Action: 'Approve' },
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
      { Team: 'Brand POC', Name: 'Ravi Kumar', Email: 'brand.poc@hdfcbank.in', SLA: '4h' },
      { Team: 'Escalation', Name: 'Neha Shah', Email: 'esc@hdfcbank.in', SLA: '2h' },
      { Team: 'CES', Name: 'Arjun Rao', Email: 'ces@hdfcbank.in', SLA: '8h' },
    ]
  ),
]

/* ------------------------------------------------------------------ *
 * ICICI Bank — different structure
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
      { 'Card Type': 'Coral', Status: 'Active', Region: 'North', 'Reason Required': 'Yes', 'Approval Level': 'L1', Action: 'Block' },
      { 'Card Type': 'Coral', Status: 'Active', Region: 'South', 'Reason Required': 'Yes', 'Approval Level': 'L2', Action: 'Block' },
      { 'Card Type': 'Rubyx', Status: 'Expired', Region: 'West', 'Reason Required': 'No', 'Approval Level': 'L1', Action: 'Reject' },
      { 'Card Type': 'Rubyx', Status: 'Active', Region: 'East', 'Reason Required': 'Yes', 'Approval Level': 'L3', Action: 'Escalate' },
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
 * Axis Bank — another structure
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
  { id: 'hdfc', name: 'HDFC Bank', classification: 'Digital Gift Card', subsheets: hdfcSheets },
  { id: 'icici', name: 'ICICI Bank', classification: 'Physical Gift Card', subsheets: iciciSheets },
  { id: 'axis', name: 'Axis Bank', classification: 'Corporate Gifting', subsheets: axisSheets },
  { id: 'sbi', name: 'State Bank of India', classification: 'Digital Gift Card', subsheets: genericSheets('SBI', 'sbi.co.in') },
  { id: 'kotak', name: 'Kotak Mahindra', classification: 'Reward Card', subsheets: genericSheets('Kotak', 'kotak.com') },
  { id: 'yes', name: 'Yes Bank', classification: 'Physical Gift Card', subsheets: genericSheets('Yes Bank', 'yesbank.in') },
  { id: 'pnb', name: 'Punjab National Bank', classification: 'Corporate Gifting', subsheets: genericSheets('PNB', 'pnb.co.in') },
  { id: 'indusind', name: 'IndusInd Bank', classification: 'Reward Card', subsheets: genericSheets('IndusInd', 'indusind.com') },
  { id: 'idfc', name: 'IDFC First Bank', classification: 'Digital Gift Card', subsheets: genericSheets('IDFC First', 'idfcfirstbank.com') },
  { id: 'citi', name: 'Citi Bank', classification: 'Corporate Gifting', subsheets: genericSheets('Citi', 'citi.com') },
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
    // vary row counts so some sheets are big (stress test)
    subsheets: bulkSheets(name, domain, n, 40 + (n % 12) * 30),
  }
})

export const merchants = [...curated, ...bulk]
