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
