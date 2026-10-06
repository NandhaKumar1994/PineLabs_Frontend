// Sample users for the User Management screen (prototype).
// Roles: Admin (full access + user management), SME (add/edit/upload, no BIN Series),
// Automation (full data access, no user management), Viewer (view-only).
export const users = [
  { id: 'u1', name: 'Ravi Kumar', email: 'ravi.kumar@pinelabs.in', role: 'Admin', status: 'Active', lastActive: '2 min ago' },
  { id: 'u2', name: 'Neha Shah', email: 'neha.shah@pinelabs.in', role: 'SME', status: 'Active', lastActive: '18 min ago' },
  { id: 'u3', name: 'Arjun Rao', email: 'arjun.rao@pinelabs.in', role: 'SME', status: 'Active', lastActive: '1 hr ago' },
  { id: 'u4', name: 'Dev Menon', email: 'dev.menon@pinelabs.in', role: 'Automation', status: 'Active', lastActive: '3 hr ago' },
  { id: 'u5', name: 'Sana Iyer', email: 'sana.iyer@pinelabs.in', role: 'Viewer', status: 'Inactive', lastActive: '2 days ago' },
  { id: 'u6', name: 'Karthik Nair', email: 'karthik.nair@pinelabs.in', role: 'SME', status: 'Active', lastActive: '5 hr ago' },
  { id: 'u7', name: 'Priya Das', email: 'priya.das@pinelabs.in', role: 'Admin', status: 'Active', lastActive: '25 min ago' },
  { id: 'u8', name: 'Imran Sheikh', email: 'imran.sheikh@pinelabs.in', role: 'Viewer', status: 'Invited', lastActive: '—' },
]

// Current signed-in user (prototype placeholder used for audit stamping).
export const CURRENT_USER = 'Admin'

const pad = (n) => String(n).padStart(2, '0')

// Returns an audit stamp for the current edit: who and when.
export function stampEditor() {
  const d = new Date()
  return {
    updatedBy: CURRENT_USER,
    updatedAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

// Formats a stored timestamp for display. Accepts a Date, a pre-formatted
// "YYYY-MM-DD HH:mm" string (the old mock-data shape), or a real ISO-8601
// datetime string (what the backend sends, e.g.
// "2026-09-25T15:20:22.670178+05:30" — see PineLabs_Backend's
// InstanceResponse.updatedAt). ISO strings are parsed into a Date first
// so they render the same short form instead of the raw timestamp.
export function formatDateTime(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Splits a stored timestamp into separate date and time strings, for
// UIs that show them on two lines (e.g. the "UPDATED BY" column).
export function splitDateTime(value) {
  const formatted = formatDateTime(value)
  if (formatted === '—') return { date: '—', time: '' }
  const [date, time] = formatted.split(' ')
  return { date, time: time || '' }
}
