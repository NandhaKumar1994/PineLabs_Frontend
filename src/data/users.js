// Sample users for the User Management screen (prototype).
export const users = [
  { id: 'u1', name: 'Ravi Kumar', email: 'ravi.kumar@pinelabs.in', role: 'Admin', status: 'Active', lastActive: '2 min ago' },
  { id: 'u2', name: 'Neha Shah', email: 'neha.shah@pinelabs.in', role: 'Support Lead', status: 'Active', lastActive: '18 min ago' },
  { id: 'u3', name: 'Arjun Rao', email: 'arjun.rao@pinelabs.in', role: 'Support Agent', status: 'Active', lastActive: '1 hr ago' },
  { id: 'u4', name: 'Dev Menon', email: 'dev.menon@pinelabs.in', role: 'Support Agent', status: 'Active', lastActive: '3 hr ago' },
  { id: 'u5', name: 'Sana Iyer', email: 'sana.iyer@pinelabs.in', role: 'Auditor', status: 'Inactive', lastActive: '2 days ago' },
  { id: 'u6', name: 'Karthik Nair', email: 'karthik.nair@pinelabs.in', role: 'Support Agent', status: 'Active', lastActive: '5 hr ago' },
  { id: 'u7', name: 'Priya Das', email: 'priya.das@pinelabs.in', role: 'Support Lead', status: 'Active', lastActive: '25 min ago' },
  { id: 'u8', name: 'Imran Sheikh', email: 'imran.sheikh@pinelabs.in', role: 'Support Agent', status: 'Invited', lastActive: '—' },
]

export const CURRENT_USER = 'Admin'

const pad = (n) => String(n).padStart(2, '0')

export function formatDateTime(value) {
  if (!value) return ''
  const [date, time] = String(value).trim().split(/\s+/)
  if (!time) return date
  const [hStr, mStr = '00'] = time.split(':')
  let hour = Number(hStr)
  if (Number.isNaN(hour)) return String(value)
  const minute = pad(Number.parseInt(mStr, 10) || 0)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${date} | ${pad(hour)}:${minute} ${ampm}`
}

export function stampEditor() {
  const d = new Date()
  return {
    updatedBy: CURRENT_USER,
    updatedAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}
