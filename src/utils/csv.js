import * as XLSX from 'xlsx'

const csvEscape = (value) => {
  const s = String(value ?? '')
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const humanize = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()

export function identityValue(row, field = 'issuer') {
  const raw = row?.[field] ?? row?.issuer ?? row?.name ?? ''
  return String(raw)
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function issuerKey(row) {
  return identityValue(row, 'issuer')
}

const HEADER_HINTS = [
  { col: 'merchantPrefix', tests: [(n) => n.includes('merchant') && n.includes('prefix'), (n) => n === 'prefix'] },
  { col: 'binIin', tests: [(n) => n.includes('bin'), (n) => n === 'iin', (n) => n.includes('iincode')] },
  { col: 'cardProgramGroupName', tests: [(n) => n.includes('program')] },
  { col: 'classification', tests: [(n) => n.includes('classification')] },
  { col: 'name', tests: [(n) => n === 'name', (n) => n.includes('merchant'), (n) => n === 'issuer'] },
  { col: 'issuer', tests: [(n) => n === 'issuer', (n) => n.includes('issuer'), (n) => n === 'bank'] },
]

function detectDelimiter(text) {
  const line = String(text)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .find((l) => l.trim()) || ''
  const count = (d) => {
    let n = 0
    let q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') q = !q
      else if (!q && c === d) n += 1
    }
    return n
  }
  return [',', ';', '\t', '|'].sort((a, b) => count(b) - count(a))[0] || ','
}

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  const src = String(text || '').replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(src)

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    const next = src[i + 1]
    if (inQuotes) {
      if (c === '"' && next === '"') {
        cell += '"'
        i += 1
        continue
      }
      if (c === '"') {
        inQuotes = false
        continue
      }
      cell += c
      continue
    }
    if (c === '"') {
      inQuotes = true
      continue
    }
    if (c === delimiter) {
      row.push(cell)
      cell = ''
      continue
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && next === '\n') i += 1
      row.push(cell)
      if (row.some((v) => String(v).trim())) rows.push(row)
      row = []
      cell = ''
      continue
    }
    cell += c
  }

  if (cell.length || row.length) {
    row.push(cell)
    if (row.some((v) => String(v).trim())) rows.push(row)
  }

  return rows
}

export function serializeCsv(columns, labels, rows) {
  const header = columns.map((col) => csvEscape(labels[col] || humanize(col))).join(',')
  const body = rows.map((r) => columns.map((col) => csvEscape(r[col])).join(','))
  return [header, ...body].join('\r\n')
}

export function headerToColumn(header, columns, labels = {}) {
  const n = normalize(header)
  if (!n) return null
  const direct = columns.find(
    (col) =>
      normalize(col) === n ||
      normalize(labels[col]) === n ||
      normalize(humanize(col)) === n
  )
  if (direct) return direct
  const hinted = HEADER_HINTS.find((h) => columns.includes(h.col) && h.tests.some((t) => t(n)))
  return hinted?.col || null
}

function cellsToRow(cells, indexToCol, columns) {
  const row = Object.fromEntries(columns.map((col) => [col, '']))
  cells.forEach((value, i) => {
    const col = indexToCol[i]
    if (col) row[col] = String(value ?? '').trim()
  })
  return row
}

export function tableToRows(table, columns, labels = {}) {
  const clean = (table || [])
    .map((r) => (Array.isArray(r) ? r : []))
    .filter((r) => r.some((v) => String(v ?? '').trim()))
  if (!clean.length) return { rows: [], error: 'The file is empty.' }

  const header = clean[0].map((h) => String(h ?? ''))
  let indexToCol = header.map((h) => headerToColumn(h, columns, labels))
  let body = clean.slice(1)

  // If headers do not map at all, treat the first row as data.
  if (!indexToCol.some(Boolean)) {
    indexToCol = columns.map((_, i) => columns[i] || null)
    body = clean
  } else {
    // Fill any unmatched header with the same-position table column so
    // Issuer-only header matches still pick up program / BIN / prefix.
    indexToCol = indexToCol.map((col, i) => col || columns[i] || null)
  }

  const headerNames = new Set(
    columns.map((col) => normalize(labels[col] || humanize(col))).filter(Boolean)
  )
  const rows = body
    .map((cells) => cellsToRow(cells, indexToCol, columns))
    .filter((row) => !headerNames.has(normalize(row.issuer)))

  if (!rows.length) return { rows: [], error: 'No data rows found in the file.' }
  return { rows, error: null }
}

export function sheetToRows(csvText, columns, labels = {}) {
  return tableToRows(parseCsv(csvText), columns, labels)
}

export async function readSheetFile(file, columns, labels = {}) {
  const name = file?.name || ''
  if (/\.xlsx?$/i.test(name) || /sheet|excel/i.test(file?.type || '')) {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array', cellDates: false })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return { rows: [], error: 'The workbook has no sheets.' }
    const table = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
    return tableToRows(table, columns, labels)
  }
  const text = await file.text()
  return sheetToRows(text, columns, labels)
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
