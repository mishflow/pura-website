// Fetches and shapes the schedule from the published Google Sheet.
import { CSV_URL, BREAK_GAP_MINUTES } from './config'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FROM_LONG = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

// --- CSV parsing (handles quoted fields, escaped quotes, CRLF) ---
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* ignore */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

// --- class categorisation & display name ---
export function categoryOf(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('mat')) return 'mat'
  if (t === 'reformer' || t === 'reformer general' || (t.includes('reformer') && t.includes('community'))) return 'reformer'
  if (t.includes('yoga') || t.includes('yogalates')) return 'yoga'
  if (t.includes('reformer')) return 'special'
  return 'special'
}
const SHORT = {
  'Reformer General': 'Reformer',
  'Find your Match Reformer': 'Find your Match',
}
const shortName = (t) => SHORT[t] || t

export const toMinutes = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}
export function to12h(t) {
  let [h, m] = String(t).split(':').map(Number)
  const ap = h < 12 ? 'am' : 'pm'
  h = h % 12 || 12
  return `${h}:${String(m || 0).padStart(2, '0')}${ap}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtDay = (iso) => {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

// Fetch the sheet and group scheduled, public classes by week number.
export async function fetchSchedule() {
  // Cache-bust so we always read the current sheet, never a stale copy.
  const res = await fetch(`${CSV_URL}&_=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status})`)
  const rows = parseCSV(await res.text())
  const header = rows[0].map((h) => h.trim())
  const col = (name) => header.indexOf(name)
  const ci = {
    week: col('Week Number'), date: col('Date'), day: col('Day'),
    time: col('Start_Time'), type: col('Class_Type'), teacher: col('Teacher'),
    status: col('Status'),
  }

  const weeks = {}
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || !row[ci.date] || !/^\d{4}-\d{2}-\d{2}/.test(row[ci.date])) continue
    const status = (row[ci.status] || '').trim().toLowerCase()
    if (status !== 'scheduled') continue
    const type = (row[ci.type] || '').trim()
    if (type.startsWith('Private') || type.startsWith('Studio Rental')) continue
    const day = DAY_FROM_LONG[(row[ci.day] || '').trim()]
    if (!day) continue

    const w = (row[ci.week] || '').trim()
    if (!weeks[w]) weeks[w] = { num: w, items: [], dates: [] }
    weeks[w].items.push({
      day,
      date: row[ci.date].slice(0, 10),
      time: (row[ci.time] || '').trim(),
      cls: shortName(type),
      teacher: (row[ci.teacher] || '').trim(),
      cat: categoryOf(type),
    })
    weeks[w].dates.push(row[ci.date].slice(0, 10))
  }

  const order = Object.keys(weeks).sort((a, b) => Number(a) - Number(b))
  const byDate = {}
  for (const w of order) {
    const ds = weeks[w].dates.sort()
    weeks[w].start = ds[0]
    weeks[w].end = ds[ds.length - 1]
    weeks[w].label = `${fmtDay(weeks[w].start)} – ${fmtDay(weeks[w].end)}`
    for (const it of weeks[w].items) (byDate[it.date] ||= []).push(it)
  }
  return { weeks, order, byDate }
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const isoLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// The next `n` calendar days from `today`, each with that date's classes.
export function upcomingDays(data, n = 3, today = new Date()) {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const out = []
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const iso = isoLocal(d)
    const items = (data.byDate[iso] || []).slice().sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
    out.push({
      iso,
      dayLong: WEEKDAYS[d.getDay()],
      dateLabel: fmtDay(iso),
      badge: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : '',
      items,
    })
  }
  return out
}

// Pick the week whose range contains `today`, else the next upcoming week,
// else the most recent past week.
export function pickCurrentWeek({ weeks, order }, today = new Date()) {
  const iso = today.toISOString().slice(0, 10)
  const containing = order.find((w) => weeks[w].start <= iso && iso <= weeks[w].end)
  if (containing) return containing
  const upcoming = order.find((w) => weeks[w].start > iso)
  if (upcoming) return upcoming
  return order[order.length - 1]
}

// Build display rows for a week: ordered time rows with a `break` flag where
// there's a gap of BREAK_GAP_MINUTES or more between consecutive start times.
export function buildRows(items) {
  const times = [...new Set(items.map((i) => i.time))].sort((a, b) => toMinutes(a) - toMinutes(b))
  const byKey = {}
  items.forEach((i) => { byKey[`${i.time}|${i.day}`] = i })
  const rows = []
  let prev = null
  for (const t of times) {
    if (prev !== null && toMinutes(t) - toMinutes(prev) >= BREAK_GAP_MINUTES) {
      rows.push({ type: 'break' })
    }
    rows.push({
      type: 'time',
      time: t,
      cells: DAYS.map((d) => byKey[`${t}|${d}`] || null),
    })
    prev = t
  }
  const activeDays = DAYS.map((d) => items.some((i) => i.day === d))
  return { rows, activeDays, days: DAYS }
}

export { DAYS }
