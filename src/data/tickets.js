// Prototype helpdesk tickets. Status totals feed the dashboard summary card;
// the expanded table lists every record.

export const ticketStatus = [
  { name: 'Resolved', count: 206, pct: 57, bar: 'bg-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { name: 'In Progress', count: 68, pct: 19, bar: 'bg-sky-500', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700' },
  { name: 'Open', count: 42, pct: 12, bar: 'bg-violet-500', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
  { name: 'Pending', count: 31, pct: 9, bar: 'bg-orange-400', dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700' },
  { name: 'Escalated', count: 12, pct: 3, bar: 'bg-red-500', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
]

const issuers = [
  'Aurora Retail',
  'Bluewave Stores',
  'Cedar Mart',
  'Delta Goods',
  'Everest Retail',
  'Fusion Mart',
  'Ivory Mart',
  'Jade Stores',
]

const agents = ['Ravi Kumar', 'Neha Shah', 'Arjun Rao', 'Priya Das', 'Dev Menon', 'Karthik Nair']

const subjects = [
  'Card block request',
  'Activation not completed',
  'Balance mismatch',
  'Expiry update',
  'KYC pending',
  'Refund not posted',
  'Duplicate transaction',
  'Merchant outlet mapping',
  'Card replacement',
  'Limit increase request',
  'Chargeback query',
  'OTP not received',
]

const classifications = ['Block', 'Activation', 'Update Expiry', 'Balance', 'Replacement']

const pad = (n) => String(n).padStart(2, '0')

const stamp = (i, hourOffset = 0) => {
  const day = 6 + (i % 10)
  const hour = (9 + ((i + hourOffset) % 11)) % 24
  const min = (i * 7) % 60
  return `2026-09-${pad(day)} ${pad(hour)}:${pad(min)}`
}

const priorityFor = (status, i) => {
  if (status === 'Escalated') return 'P1'
  if (status === 'Open') return i % 3 === 0 ? 'P1' : 'P2'
  if (status === 'In Progress') return i % 2 === 0 ? 'P2' : 'P3'
  if (status === 'Pending') return 'P3'
  return i % 5 === 0 ? 'P3' : 'P4'
}

const reasonsByStatus = {
  Resolved: [
    'Issuer confirmed the SOP action and the requester was notified. Ticket closed within TAT.',
    'Merchant validation passed against the workbook; no further action required.',
    'Replacement card issued and activation completed successfully.',
    'Balance mismatch reconciled with the issuer settlement file.',
  ],
  'In Progress': [
    'Agent is applying the SOP after a successful BIN series lookup.',
    'Waiting on the assigned agent to complete the remaining validations.',
    'Partial KYC received; processing the rest of the request.',
    'Outlet mapping is being updated in the merchant workbook.',
  ],
  Open: [
    'New ticket logged from the helpdesk queue; first response is pending.',
    'Awaiting assignment to a support agent for this issuer.',
    'Requester submitted the form; no agent has picked it up yet.',
    'Ticket created from the BIN lookup flow and is in the open queue.',
  ],
  Pending: [
    'Awaiting additional documents from the requester before the SOP can proceed.',
    'Issuer has asked for a confirmation screenshot; ticket on hold.',
    'Need Reason field is incomplete in the Block sheet; waiting on CES.',
    'Card status is Deactivated; waiting on Brand POC clarification.',
  ],
  Escalated: [
    'P1 TAT breached; moved to the next level in the escalation matrix.',
    'SOP action is Escalate for this classification; Ops Lead notified.',
    'Repeat failure on activation; routed to Support Head.',
    'High-value dispute flagged; transferred to the issuer operations team.',
  ],
}

let index = 0
export const tickets = ticketStatus.flatMap((s) =>
  Array.from({ length: s.count }, () => {
    const i = index++
    const pool = reasonsByStatus[s.name]
    return {
      id: `PL-${10001 + i}`,
      subject: subjects[i % subjects.length],
      issuer: issuers[i % issuers.length],
      classification: classifications[i % classifications.length],
      status: s.name,
      priority: priorityFor(s.name, i),
      assignee: agents[i % agents.length],
      created: stamp(i),
      updated: stamp(i, 2),
      reason: pool[i % pool.length],
    }
  })
)

export const ticketsByRecent = [...tickets].sort(
  (a, b) => b.updated.localeCompare(a.updated) || b.id.localeCompare(a.id)
)

export const recentTickets = ticketsByRecent.slice(0, 5)

export const statusBadge = Object.fromEntries(ticketStatus.map((s) => [s.name, s.badge]))
