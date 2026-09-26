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

// Formats a stored timestamp for display. Accepts a string or Date.
export function formatDateTime(value) {
  if (!value) return '—'
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`
  }
  return String(value)
}
