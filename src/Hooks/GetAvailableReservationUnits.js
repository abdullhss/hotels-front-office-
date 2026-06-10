import { executeProcedure } from '../services/apiServices'
import { toInputDateValue } from '../pages/new-booking/dateUtils.js'
import { getAuthHotelId } from '../utils/authStorage.js'

/** Hotel_GetAvailableReservationUnits — hotelid#from_date#to_date#unitjson */
const GET_AVAILABLE_RESERVATION_UNITS_PROCEDURE =
  'YVUU47P3dlraloAMRyrZCKZdA1gux9KH1tF5tbz0neICZBUbtqXKYwa0FZcGSR9D'

function toIntOrDefault(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function parseChunkedJsonFromResultRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  let merged = ''
  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return
    const chunk = Object.values(row).find((v) => typeof v === 'string' && v.length > 0)
    if (typeof chunk === 'string') merged += chunk
  })

  if (!merged.trim()) return []

  try {
    const parsed = JSON.parse(merged)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return [parsed]
    return []
  } catch {
    return []
  }
}

function isAvailabilityRow(raw) {
  if (!raw || typeof raw !== 'object') return false
  return (
    raw.UnitName_Id != null ||
    raw.unitName_Id != null ||
    raw.AvailableRoomsCount != null ||
    raw.availableRoomsCount != null
  )
}

function parseJsonAvailabilityValue(raw) {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object') return [parsed]
    } catch {
      return []
    }
  }
  if (typeof raw === 'object') return [raw]
  return []
}

function parseAvailabilityPayload(payload) {
  if (!payload || typeof payload !== 'object') return []

  if (isAvailabilityRow(payload)) return [payload]

  const directKeys = [
    'UnitAvailabilityData',
    'unitAvailabilityData',
    'AvailableUnitsData',
    'availableUnitsData',
    'AvailableReservationUnitsData',
    'availableReservationUnitsData',
    'Data',
    'data',
  ]

  for (const key of directKeys) {
    const parsed = parseJsonAvailabilityValue(payload[key])
    if (parsed.length > 0) return parsed
  }

  const rows =
    payload?.Result ??
    payload?.result ??
    payload?.Rows ??
    payload?.rows ??
    []

  if (Array.isArray(rows) && rows.length > 0) {
    if (rows.some(isAvailabilityRow)) {
      return rows.filter(isAvailabilityRow)
    }
    const fromChunks = parseChunkedJsonFromResultRows(rows)
    if (fromChunks.length > 0) return fromChunks
  }

  return []
}

function extractAvailabilityRows(response) {
  const decryptedRow = response?.decrypted ?? null
  const payload = response?.decryptedData ?? {}

  const sources = [decryptedRow, payload]
  for (const source of sources) {
    const rows = parseAvailabilityPayload(source)
    if (rows.length > 0) return rows
  }

  return []
}

export function normalizeAvailableReservationUnit(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    unitNameId: toIntOrDefault(raw.UnitName_Id ?? raw.unitName_Id ?? raw.unitNameId, 0),
    unitNameAr: String(raw.UnitNameA ?? raw.unitNameA ?? '').trim(),
    unitNameEn: String(raw.UnitNameE ?? raw.unitNameE ?? '').trim(),
    unitAddFeatureId: toIntOrDefault(
      raw.UnitAddFeature_Id ?? raw.unitAddFeature_Id ?? raw.unitAddFeatureId,
      0
    ),
    featureNameAr: String(raw.FreatureNameA ?? raw.FeatureNameA ?? raw.featureNameA ?? '').trim(),
    featureNameEn: String(raw.FreatureNameE ?? raw.FeatureNameE ?? raw.featureNameE ?? '').trim(),
    featurePrice: Number(raw.FeaturePrice ?? raw.featurePrice ?? 0) || 0,
    totalRoomsCount: Math.max(0, toIntOrDefault(raw.TotalRoomsCount ?? raw.totalRoomsCount, 0)),
    bookedRoomsCount: Math.max(0, toIntOrDefault(raw.BookedRoomsCount ?? raw.bookedRoomsCount, 0)),
    availableRoomsCount: Math.max(
      0,
      toIntOrDefault(raw.AvailableRoomsCount ?? raw.availableRoomsCount, 0)
    ),
  }
}

export function buildAvailableReservationUnitsParams({
  hotelId = getAuthHotelId(),
  fromDate,
  toDate,
  unitNameId,
  unitAddFeatureId,
} = {}) {
  const safeHotelId = Math.max(1, toIntOrDefault(hotelId, getAuthHotelId()))
  const fromIso = toInputDateValue(fromDate)
  const toIso = toInputDateValue(toDate)
  const unitJson = JSON.stringify({
    UnitName_Id: toIntOrDefault(unitNameId, 0),
    UnitAddFeature_Id: toIntOrDefault(unitAddFeatureId, 0),
  })

  return `${safeHotelId}#${fromIso}#${toIso}#${unitJson}`
}

export async function fetchAvailableReservationUnits({
  hotelId = getAuthHotelId(),
  fromDate,
  toDate,
  unitNameId,
  unitAddFeatureId,
} = {}) {
  const fromIso = toInputDateValue(fromDate)
  const toIso = toInputDateValue(toDate)
  const uid = toIntOrDefault(unitNameId, 0)

  if (!fromIso || !toIso) {
    return { success: false, unit: null, error: 'Invalid date range' }
  }
  if (!uid) {
    return { success: false, unit: null, error: 'Invalid unit type' }
  }

  const params = buildAvailableReservationUnitsParams({
    hotelId,
    fromDate: fromIso,
    toDate: toIso,
    unitNameId: uid,
    unitAddFeatureId,
  })

  try {
    const response = await executeProcedure(GET_AVAILABLE_RESERVATION_UNITS_PROCEDURE, params)
    if (!response?.success) {
      return {
        success: false,
        unit: null,
        error: response?.error ?? 'Request failed',
      }
    }

    const list = extractAvailabilityRows(response)
    const unit = normalizeAvailableReservationUnit(list[0] ?? null)

    if (!unit) {
      return {
        success: false,
        unit: null,
        error: 'No availability data returned',
      }
    }

    return {
      success: true,
      unit,
      error: null,
    }
  } catch (err) {
    return {
      success: false,
      unit: null,
      error: err?.message ?? 'Request failed',
    }
  }
}
