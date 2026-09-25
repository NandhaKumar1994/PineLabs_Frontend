// BIN series reference data for the prototype.
//
// There are TWO BIN types, each with its own column structure:
//   Gift Card (GC) — Instance, Issuer, Merchant, Card Program Group Name, BIN,
//                    Merchant Prefix, Card Program Group Type, Card Type, Ticket Number
//   Wallet         — Instance, Issuer, Merchant, Wallet Program Name, BIN,
//                    Merchant Prefix, Wallet Program Group Type, Ticket Number
//
// Lookup key in both cases is BIN (6) + Merchant Prefix (3) = the 9-digit
// prefix taken from the customer's card number.
// `id` is internal. `updatedBy` + `updatedAt` power the Updated By column.

import { instances } from './sopData'

const editors = ['Ravi Kumar', 'Neha Shah', 'Arjun Rao', 'Priya Das', 'Dev Menon', 'Karthik Nair']

const pad = (n) => String(n).padStart(2, '0')

/* ------------------------------------------------------------------ *
 * Type definitions — drive the table columns, forms and upload samples
 * ------------------------------------------------------------------ */
const SHARED_LABELS = {
  instance: 'Instance',
  issuer: 'Issuer',
  merchant: 'Merchant',
  binIin: 'BIN',
  merchantPrefix: 'Merchant Prefix',
  ticketNumber: 'Ticket Number',
}

export const BIN_TYPES = {
  giftCard: {
    key: 'giftCard',
    label: 'Gift Card',
    short: 'GC',
    columns: [
      'instance',
      'issuer',
      'merchant',
      'cardProgramGroupName',
      'binIin',
      'merchantPrefix',
      'cardProgramGroupType',
      'cardType',
      'ticketNumber',
    ],
    labels: {
      ...SHARED_LABELS,
      cardProgramGroupName: 'Card Program Group Name',
      cardProgramGroupType: 'Card Program Group Type',
      cardType: 'Card Type',
    },
    // shown as the programme name in lookup results
    programField: 'cardProgramGroupName',
  },
  wallet: {
    key: 'wallet',
    label: 'Wallet',
    short: 'Wallet',
    columns: [
      'instance',
      'issuer',
      'merchant',
      'walletProgramName',
      'binIin',
      'merchantPrefix',
      'walletProgramGroupType',
      'ticketNumber',
    ],
    labels: {
      ...SHARED_LABELS,
      walletProgramName: 'Wallet Program Name',
      walletProgramGroupType: 'Wallet Program Group Type',
    },
    programField: 'walletProgramName',
  },
}

export const BIN_TYPE_LIST = Object.values(BIN_TYPES)

/* ------------------------------------------------------------------ *
 * Sample values
 * ------------------------------------------------------------------ */
const issuerPool = [
  'Aurora Retail', 'Bluewave Stores', 'Cedar Mart', 'Delta Goods', 'Everest Retail',
  'Fusion Mart', 'Granite Stores', 'Horizon Retail', 'Ivory Mart', 'Jade Stores',
]
const merchantPool = [
  'Aurora Outlets', 'Bluewave Online', 'Cedar Superstore', 'Delta Bazaar', 'Everest Hyper',
  'Fusion Express', 'Granite Depot', 'Horizon Plaza', 'Ivory Emporium', 'Jade Market',
]
const programSuffix = [
  'Elite', 'Plus', 'Prime', 'Select', 'League', 'Prosper',
  'Guard', 'Pinnacle', 'Wealth', 'Rewards', 'Platinum', 'Signature',
]
const cardProgramGroupTypes = ['Closed Loop', 'Semi Closed Loop', 'Open Loop']
const cardTypes = ['Physical', 'Digital', 'Virtual']
const walletProgramGroupTypes = ['Closed Wallet', 'Semi Closed Wallet', 'Prepaid Wallet']
const instanceNames = instances.map((i) => i.name)

const ticketRef = (i) => `PL-${10000 + ((i * 17) % 9000)}`

const withAudit = (row, i, type) => ({
  id: `${type}-${i}`,
  binType: type,
  ...row,
  // Every 9th record is deactivated so the Inactive list has sample data.
  status: i > 0 && i % 9 === 0 ? 'Inactive' : 'Active',
  updatedBy: editors[i % editors.length],
  updatedAt: `2026-09-${pad(1 + (i % 14))} ${pad(9 + (i % 8))}:${pad((i * 11) % 60)}`,
})

/* ------------------------------------------------------------------ *
 * Gift Card records
 * ------------------------------------------------------------------ */
const giftCardSeed = [
  { issuer: 'Aurora Retail', merchant: 'Aurora Outlets', cardProgramGroupName: 'Aurora Elite', binIin: '401288', merchantPrefix: '001', cardProgramGroupType: 'Closed Loop', cardType: 'Physical' },
  { issuer: 'Bluewave Stores', merchant: 'Bluewave Online', cardProgramGroupName: 'Bluewave Plus', binIin: '552461', merchantPrefix: '004', cardProgramGroupType: 'Semi Closed Loop', cardType: 'Digital' },
  { issuer: 'Cedar Mart', merchant: 'Cedar Superstore', cardProgramGroupName: 'Cedar Prime', binIin: '340000', merchantPrefix: '002', cardProgramGroupType: 'Closed Loop', cardType: 'Physical' },
  { issuer: 'Delta Goods', merchant: 'Delta Bazaar', cardProgramGroupName: 'Delta Select', binIin: '607469', merchantPrefix: '007', cardProgramGroupType: 'Open Loop', cardType: 'Virtual' },
  { issuer: 'Everest Retail', merchant: 'Everest Hyper', cardProgramGroupName: 'Everest League', binIin: '453218', merchantPrefix: '009', cardProgramGroupType: 'Closed Loop', cardType: 'Digital' },
  { issuer: 'Fusion Mart', merchant: 'Fusion Express', cardProgramGroupName: 'Fusion Prosper', binIin: '512345', merchantPrefix: '011', cardProgramGroupType: 'Semi Closed Loop', cardType: 'Physical' },
  { issuer: 'Granite Stores', merchant: 'Granite Depot', cardProgramGroupName: 'Granite Guard', binIin: '655012', merchantPrefix: '003', cardProgramGroupType: 'Closed Loop', cardType: 'Physical' },
  { issuer: 'Horizon Retail', merchant: 'Horizon Plaza', cardProgramGroupName: 'Horizon Pinnacle', binIin: '486712', merchantPrefix: '015', cardProgramGroupType: 'Open Loop', cardType: 'Digital' },
  { issuer: 'Ivory Mart', merchant: 'Ivory Emporium', cardProgramGroupName: 'Ivory Wealth', binIin: '533012', merchantPrefix: '006', cardProgramGroupType: 'Semi Closed Loop', cardType: 'Virtual' },
  { issuer: 'Jade Stores', merchant: 'Jade Market', cardProgramGroupName: 'Jade Rewards', binIin: '374512', merchantPrefix: '008', cardProgramGroupType: 'Closed Loop', cardType: 'Physical' },
  { issuer: 'Aurora Retail', merchant: 'Aurora Outlets', cardProgramGroupName: 'Aurora Everyday', binIin: '401288', merchantPrefix: '021', cardProgramGroupType: 'Closed Loop', cardType: 'Digital' },
]

const giftCardBulk = Array.from({ length: 420 }, (_, i) => {
  const issuer = issuerPool[i % issuerPool.length]
  return {
    issuer,
    merchant: merchantPool[i % merchantPool.length],
    cardProgramGroupName: `${issuer.split(' ')[0]} ${programSuffix[i % programSuffix.length]}`,
    binIin: String(400000 + i * 137).slice(0, 6),
    merchantPrefix: String((i * 7) % 1000).padStart(3, '0'),
    cardProgramGroupType: cardProgramGroupTypes[i % cardProgramGroupTypes.length],
    cardType: cardTypes[i % cardTypes.length],
  }
})

/* ------------------------------------------------------------------ *
 * Wallet records
 * ------------------------------------------------------------------ */
const walletSeed = [
  { issuer: 'Aurora Retail', merchant: 'Aurora Outlets', walletProgramName: 'Aurora Pay', binIin: '621501', merchantPrefix: '101', walletProgramGroupType: 'Closed Wallet' },
  { issuer: 'Bluewave Stores', merchant: 'Bluewave Online', walletProgramName: 'Bluewave Wallet', binIin: '621502', merchantPrefix: '104', walletProgramGroupType: 'Semi Closed Wallet' },
  { issuer: 'Cedar Mart', merchant: 'Cedar Superstore', walletProgramName: 'Cedar Cash', binIin: '621503', merchantPrefix: '102', walletProgramGroupType: 'Prepaid Wallet' },
  { issuer: 'Delta Goods', merchant: 'Delta Bazaar', walletProgramName: 'Delta Purse', binIin: '621504', merchantPrefix: '107', walletProgramGroupType: 'Closed Wallet' },
  { issuer: 'Everest Retail', merchant: 'Everest Hyper', walletProgramName: 'Everest Money', binIin: '621505', merchantPrefix: '109', walletProgramGroupType: 'Semi Closed Wallet' },
]

const walletBulk = Array.from({ length: 180 }, (_, i) => {
  const issuer = issuerPool[i % issuerPool.length]
  return {
    issuer,
    merchant: merchantPool[i % merchantPool.length],
    walletProgramName: `${issuer.split(' ')[0]} ${['Pay', 'Wallet', 'Cash', 'Purse', 'Money'][i % 5]}`,
    binIin: String(620000 + i * 211).slice(0, 6),
    merchantPrefix: String(100 + ((i * 11) % 900)).padStart(3, '0'),
    walletProgramGroupType: walletProgramGroupTypes[i % walletProgramGroupTypes.length],
  }
})

// Attach an instance + ticket to every row, then stamp audit fields.
const decorate = (rows, type) =>
  rows.map((row, i) =>
    withAudit(
      {
        instance: instanceNames[i % instanceNames.length],
        ...row,
        ticketNumber: ticketRef(i),
      },
      i,
      type
    )
  )

export const giftCardBins = decorate([...giftCardSeed, ...giftCardBulk], 'giftCard')
export const walletBins = decorate([...walletSeed, ...walletBulk], 'wallet')

// Combined set — used by the resolver and the dashboard KPI counts.
export const binSeries = [...giftCardBins, ...walletBins]

export const binsForType = (type) => (type === 'wallet' ? walletBins : giftCardBins)

export const CURRENT_USER = 'Admin'

export function stampNow() {
  const d = new Date()
  return {
    updatedBy: CURRENT_USER,
    updatedAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}
