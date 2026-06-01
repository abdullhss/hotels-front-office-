/** Normalize to yyyy-mm-dd for HTML date inputs */
export function toInputDateValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const slash = raw.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/)
  if (slash) {
    const d = slash[1].padStart(2, '0')
    const m = slash[2].padStart(2, '0')
    return `${slash[3]}-${m}-${d}`
  }
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return ''
}

/** Display / API: dd / mm / yyyy */
export function formatDisplayDate(value) {
  const iso = toInputDateValue(value)
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d} / ${m} / ${y}`
}

export function compareIsoDates(a, b) {
  const isoA = toInputDateValue(a)
  const isoB = toInputDateValue(b)
  if (!isoA || !isoB) return 0
  if (isoA < isoB) return -1
  if (isoA > isoB) return 1
  return 0
}

export function isArrivalBeforeDeparture(arrival, departure) {
  return compareIsoDates(arrival, departure) < 0
}

/** Nights between arrival and departure (exclusive checkout day). */
export function computeNightsCount(arrival, departure) {
  const from = toInputDateValue(arrival)
  const to = toInputDateValue(departure)
  if (!from || !to) return 0
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

/** (nightly unit rate + feature rate) × nights × units count */
export function computeStayLineTotal({
  unitPricePerNight = 0,
  servicePrice = 0,
  nights = 0,
  unitsCount = 1,
}) {
  const nightly = (Number(unitPricePerNight) || 0) + (Number(servicePrice) || 0)
  const nightsNum = Math.max(0, Number(nights) || 0)
  const units = Math.max(1, Number(unitsCount) || 1)
  return nightly * nightsNum * units
}
