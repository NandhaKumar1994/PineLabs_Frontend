// Sample BIN series data for the prototype.
// A customer card gives a 9-digit prefix: first 6 digits = BIN / IIN Code,
// next 3 digits = Merchant Prefix. The helpdesk user searches with those
// 9 digits to find the matching Issuer.
// Columns are derived dynamically from these keys (in order).
// `id` is internal. `updatedBy` + `updatedAt` power the Updated By column.

const editors = ['Ravi Kumar', 'Neha Shah', 'Arjun Rao', 'Priya Das', 'Dev Menon', 'Karthik Nair']

const pad = (n) => String(n).padStart(2, '0')

const withAudit = (row, i) => ({
  id: `bin-${i}`,
  ...row,
  updatedBy: editors[i % editors.length],
  updatedAt: `2026-09-${pad(1 + (i % 14))} ${pad(9 + (i % 8))}:${pad((i * 11) % 60)}`,
})

const seed = [
  { issuer: 'HDFC Bank', cardProgramGroupName: 'HDFC Regalia', binIin: '401288', merchantPrefix: '001' },
  { issuer: 'ICICI Bank', cardProgramGroupName: 'ICICI Coral', binIin: '552461', merchantPrefix: '004' },
  { issuer: 'Axis Bank', cardProgramGroupName: 'Axis Magnus', binIin: '340000', merchantPrefix: '002' },
  { issuer: 'State Bank of India', cardProgramGroupName: 'SBI SimplyCLICK', binIin: '607469', merchantPrefix: '007' },
  { issuer: 'Kotak Mahindra', cardProgramGroupName: 'Kotak League', binIin: '453218', merchantPrefix: '009' },
  { issuer: 'Yes Bank', cardProgramGroupName: 'Yes Prosperity', binIin: '512345', merchantPrefix: '011' },
  { issuer: 'Punjab National Bank', cardProgramGroupName: 'PNB Rakshak', binIin: '655012', merchantPrefix: '003' },
  { issuer: 'IndusInd Bank', cardProgramGroupName: 'Indus Pinnacle', binIin: '486712', merchantPrefix: '015' },
  { issuer: 'IDFC First Bank', cardProgramGroupName: 'IDFC Wealth', binIin: '533012', merchantPrefix: '006' },
  { issuer: 'Citi Bank', cardProgramGroupName: 'Citi Rewards', binIin: '374512', merchantPrefix: '008' },
  { issuer: 'HDFC Bank', cardProgramGroupName: 'HDFC Millennia', binIin: '401288', merchantPrefix: '021' },
]

const issuerPool = [
  'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India', 'Kotak Mahindra',
  'Yes Bank', 'Punjab National Bank', 'IndusInd Bank', 'IDFC First Bank', 'Citi Bank',
]
const programSuffix = ['Regalia', 'Coral', 'Magnus', 'SimplyCLICK', 'League', 'Prosperity', 'Rakshak', 'Pinnacle', 'Wealth', 'Rewards', 'Platinum', 'Signature']

const bulkBins = Array.from({ length: 600 }, (_, i) => {
  const issuer = issuerPool[i % issuerPool.length]
  const bin = String(400000 + i * 137).slice(0, 6)
  const prefix = String((i * 7) % 1000).padStart(3, '0')
  return {
    issuer,
    cardProgramGroupName: `${issuer.split(' ')[0]} ${programSuffix[i % programSuffix.length]}`,
    binIin: bin,
    merchantPrefix: prefix,
  }
})

export const binSeries = [...seed, ...bulkBins].map(withAudit)

export const CURRENT_USER = 'Admin'

export function stampNow() {
  const d = new Date()
  return {
    updatedBy: CURRENT_USER,
    updatedAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}
