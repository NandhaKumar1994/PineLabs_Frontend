// Prototype metrics for the Automation Dashboard.
// The external automation system consumes this application's SOP/BIN APIs and
// works tickets end-to-end. These figures model that run status.

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

const rand = mulberry32(99)

// Outcome of each automation run against a ticket.
export const runStatus = [
  { name: 'Auto Resolved', count: 184, dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { name: 'In Progress', count: 46, dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700' },
  { name: 'Awaiting SOP Data', count: 28, dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
  { name: 'Manual Review', count: 34, dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
  { name: 'Failed', count: 17, dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
]

export const totalRuns = runStatus.reduce((s, r) => s + r.count, 0)
export const autoResolved = runStatus[0].count
export const failedRuns = runStatus.find((r) => r.name === 'Failed').count
export const manualReview = runStatus.find((r) => r.name === 'Manual Review').count

// Automation rate = share of runs the bot closed without a human.
export const automationRate = Math.round((autoResolved / totalRuns) * 100)

// Runs per day for the last 7 days.
export const runsPerDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({
  label,
  value: 38 + Math.floor(rand() * 42) + (i === 4 ? 12 : 0),
}))

// Donut: run outcome mix.
export const outcomeMix = runStatus.map((r) => ({ label: r.name, value: r.count }))

// API consumption by endpoint — what the automation system calls.
export const apiUsage = [
  { endpoint: '/api/bin/resolve', calls: 4820, avgMs: 82, errorPct: 0.4 },
  { endpoint: '/api/sop/issuer', calls: 3610, avgMs: 118, errorPct: 0.9 },
  { endpoint: '/api/sop/classification', calls: 2740, avgMs: 104, errorPct: 0.6 },
  { endpoint: '/api/escalation/matrix', calls: 1180, avgMs: 76, errorPct: 0.2 },
  { endpoint: '/api/issuer/poc', calls: 940, avgMs: 71, errorPct: 0.3 },
]

export const totalApiCalls = apiUsage.reduce((s, a) => s + a.calls, 0)
export const avgLatency = Math.round(
  apiUsage.reduce((s, a) => s + a.avgMs * a.calls, 0) / totalApiCalls
)

// Top failure reasons — why a run could not complete automatically.
export const failureReasons = [
  { reason: 'SOP row not found for classification', count: 9 },
  { reason: 'BIN / IIN not present in reference table', count: 7 },
  { reason: 'Mandatory SOP column empty', count: 6 },
  { reason: 'Ambiguous merchant prefix match', count: 4 },
  { reason: 'Escalation owner not configured', count: 3 },
]

// Automation coverage by classification (% handled without a human).
export const coverageByClassification = [
  { label: 'Block', automated: 92 },
  { label: 'Activation', automated: 86 },
  { label: 'Update Expiry', automated: 74 },
  { label: 'Balance', automated: 61 },
  { label: 'Replacement', automated: 48 },
]

const pad = (n) => String(n).padStart(2, '0')
const issuers = ['Aurora Retail', 'Bluewave Stores', 'Cedar Mart', 'Delta Goods', 'Everest Retail', 'Fusion Mart']
const classifications = ['Block', 'Activation', 'Update Expiry', 'Balance', 'Replacement']
const statuses = runStatus.map((r) => r.name)

// Recent automation runs feeding the activity table.
export const recentRuns = Array.from({ length: 12 }, (_, i) => {
  const status = statuses[i % statuses.length]
  return {
    id: `RUN-${5001 + i}`,
    ticket: `PL-${10001 + i * 3}`,
    issuer: issuers[i % issuers.length],
    classification: classifications[i % classifications.length],
    status,
    durationMs: 600 + Math.floor(rand() * 2400),
    at: `2026-09-${pad(14 + (i % 5))} ${pad(9 + (i % 9))}:${pad((i * 13) % 60)}`,
  }
})

export const runBadge = Object.fromEntries(runStatus.map((r) => [r.name, r.badge]))
