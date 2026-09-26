// Revision history for the prototype.
//
// Column structure mirrors the source workbook:
//   Instance | Issuer | Version | Date | Revised By | Description of Changes |
//   Reviewer | Ticket Number
//
// `migrated` marks rows brought in from the previous SharePoint/Excel process
// so they stay distinguishable from entries this application recorded itself.

const instancePool = [
  'North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone',
  'Enterprise', 'Retail Partners', 'Priority Tier',
]

const issuerPool = [
  'Aurora Retail', 'Bluewave Stores', 'Cedar Mart', 'Delta Goods',
  'Everest Retail', 'Fusion Mart', 'Granite Stores', 'Horizon Retail',
]

const revisers = ['Girish', 'Ravi Kumar', 'Neha Shah', 'Arjun Rao', 'Priya Das']
const reviewers = ['Chandru', 'Dev Menon', 'Karthik Nair', 'Sana Iyer']

const changeDescriptions = [
  'Initial SOP baseline published for the issuer.',
  'Added reason code FRD-01 to the Block sheet.',
  'Updated escalation owner for P1 tickets.',
  'Revised TAT for activation requests from 8h to 4h.',
  'Added Risk Level column to the Block conditions.',
  'Corrected POC email for the escalation matrix.',
  'Removed obsolete Cancel Redeem condition row.',
  'Updated approval level for high-value disputes.',
  'Added Outlet mapping requirement for blocking.',
  'Amended balance check threshold for refunds.',
  'Introduced new Update Expiry condition set.',
  'Reviewed and confirmed no change required.',
]

const pad = (n) => String(n).padStart(2, '0')

// Version numbers step 1 -> 1.1 -> 1.2 ... per issuer.
const versionFor = (seq) => (seq === 0 ? '1' : `1.${seq}`)

const dateFor = (i) => {
  const d = 24 - (i % 24)
  const m = 9 - Math.floor(i / 24) % 3
  return `${pad(d)}/${pad(m)}/2026`
}

// Detailed change sets behind a revision. A single revision can cover many
// edits across SOP sheets, so `changes` holds the itemised breakdown that the
// eye icon in the Description column reveals.
//   type: create | update | delete | upload | column | rename
const detailPool = [
  [
    { type: 'upload', sheet: 'Block', summary: 'Sheet replaced from uploaded file (46 rows)' },
    { type: 'column', sheet: 'Block', summary: 'Column added', field: 'Risk Level', after: 'Low' },
  ],
  [
    { type: 'update', sheet: 'Block', summary: 'Condition updated', field: 'Action', before: 'Approve', after: 'Escalate' },
    { type: 'update', sheet: 'Block', summary: 'Condition updated', field: 'Approval Level', before: 'L1', after: 'L2' },
    { type: 'create', sheet: 'Block', summary: 'Row added', field: 'Reason Code', after: 'FRD-01' },
  ],
  [
    { type: 'update', sheet: 'Escalation Matrix', summary: 'Owner reassigned', field: 'Owner', before: 'Support Manager', after: 'Ops Lead' },
    { type: 'update', sheet: 'Escalation Matrix', summary: 'TAT revised', field: 'TAT', before: '8h', after: '4h' },
  ],
  [
    { type: 'delete', sheet: 'Cancel Redeem', summary: 'Obsolete row removed', field: 'Txn Status', before: 'Pending' },
  ],
  [
    { type: 'rename', sheet: 'Activation', summary: 'Column renamed', field: 'Column', before: 'KYC', after: 'KYC Status' },
    { type: 'update', sheet: 'Activation', summary: 'Condition updated', field: 'Action', before: 'Hold', after: 'Activate' },
  ],
  [
    { type: 'update', sheet: 'POC', summary: 'Contact corrected', field: 'Email', before: 'poc@old.example.in', after: 'poc@aurora.example.in' },
  ],
]

let id = 0
const build = ({ instance, issuer, seq, reviser, reviewer, description, ticket, migrated, changes }) => {
  const n = ++id
  return {
    id: `rev-${n}`,
    instance,
    issuer,
    version: versionFor(seq),
    date: dateFor(n),
    revisedBy: reviser,
    description,
    reviewer,
    ticket,
    migrated: !!migrated,
    // Migrated rows carry no itemised detail — only what the old sheet recorded.
    changes: migrated ? [] : changes || detailPool[n % detailPool.length],
  }
}

// Curated rows matching the sample sheet.
const curated = [
  build({
    instance: 'North Zone',
    issuer: 'Aurora Retail',
    seq: 0,
    reviser: 'Girish',
    reviewer: 'Chandru',
    description: 'Initial SOP baseline published for the issuer.',
    ticket: 'HD-123456',
    migrated: true,
  }),
  build({
    instance: 'North Zone',
    issuer: 'Aurora Retail',
    seq: 1,
    reviser: 'Girish',
    reviewer: 'Chandru',
    description: 'Added reason code FRD-01 to the Block sheet.',
    ticket: 'PL-123456',
    migrated: true,
  }),
  build({
    instance: 'South Zone',
    issuer: 'Bluewave Stores',
    seq: 0,
    reviser: 'Ravi Kumar',
    reviewer: 'Chandru',
    description: 'Initial SOP baseline published for the issuer.',
    ticket: 'PL-100234',
    changes: [
      { type: 'upload', sheet: 'Block', summary: 'Sheet imported from source workbook (38 rows)' },
      { type: 'upload', sheet: 'Activation', summary: 'Sheet imported from source workbook (12 rows)' },
      { type: 'upload', sheet: 'POC', summary: 'Sheet imported from source workbook (3 rows)' },
    ],
  }),
]

// Additional rows so the table, filters and pagination have volume.
const generated = Array.from({ length: 45 }, (_, i) => {
  const issuer = issuerPool[i % issuerPool.length]
  return build({
    instance: instancePool[i % instancePool.length],
    issuer,
    seq: (i % 4) + 1,
    reviser: revisers[i % revisers.length],
    reviewer: reviewers[i % reviewers.length],
    description: changeDescriptions[i % changeDescriptions.length],
    ticket: `PL-${10500 + i * 7}`,
    migrated: i % 5 === 0,
  })
})

export const revisions = [...curated, ...generated]

// Column definition shared by the table, the export and the import template.
export const REVISION_COLUMNS = [
  'instance',
  'issuer',
  'version',
  'date',
  'revisedBy',
  'description',
  'reviewer',
  'ticket',
]

export const REVISION_LABELS = {
  instance: 'Instance',
  issuer: 'Issuer',
  version: 'Version',
  date: 'Date',
  revisedBy: 'Revised By',
  description: 'Description of Changes',
  reviewer: 'Reviewer',
  ticket: 'Ticket Number',
}
