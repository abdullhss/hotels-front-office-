import { toInputDateValue } from '../pages/new-booking/dateUtils.js'
import { executeProcedure } from '../services/apiServices'
import { getAuthHotelId } from '../utils/authStorage.js'

const MONTHLY_ROOMS_REPORT_PROCEDURE = 'HnC0WnzS1va393I8ZCldm+gEkklCHaWNaeE4dOUCJpc='

function toIntOrDefault(value, fallback = -1) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

/** Empty / whitespace → -1; otherwise numeric floor value. */
export function normalizeFloorNumParam(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return -1
  const n = Number(raw)
  return Number.isFinite(n) ? Math.trunc(n) : -1
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
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeRoomRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    unitNameId: toIntOrDefault(raw.UnitName_Id ?? raw.unitName_Id ?? raw.unitNameId, 0),
    unitNameAr: String(raw.UnitNameA ?? raw.unitNameA ?? '').trim(),
    unitNameEn: String(raw.UnitNameE ?? raw.unitNameE ?? '').trim(),
    totalRooms: Math.max(0, toIntOrDefault(raw.TotalRooms ?? raw.totalRooms, 0)),
    occupiedRooms: Math.max(0, toIntOrDefault(raw.OccupiedRooms ?? raw.occupiedRooms, 0)),
    bookedRooms: Math.max(0, toIntOrDefault(raw.BookedRooms ?? raw.bookedRooms, 0)),
    availableRooms: Math.max(0, toIntOrDefault(raw.AvailableRooms ?? raw.availableRooms, 0)),
  }
}

function normalizeDailyReport(raw) {
  if (!raw || typeof raw !== 'object') return null
  const reportDateIso = toInputDateValue(raw.ReportDate ?? raw.reportDate)
  if (!reportDateIso) return null
  const roomsRaw = Array.isArray(raw.Rooms) ? raw.Rooms : []
  return {
    reportDateIso,
    rooms: roomsRaw.map((room) => normalizeRoomRow(room)).filter(Boolean),
  }
}

function normalizeMonthlyPayload(payload) {
  const rows =
    payload?.Result ??
    payload?.result ??
    payload?.Data ??
    payload?.data ??
    payload?.Rows ??
    payload?.rows ??
    []

  const parsedRows = Array.isArray(rows) ? rows : []
  const reportData = parseChunkedJsonFromResultRows(parsedRows)
  return reportData.map((day) => normalizeDailyReport(day)).filter(Boolean)
}

export function buildMonthlyRoomsReportParams({
  hotelId = getAuthHotelId(),
  year,
  month,
  unitNameId = -1,
  floorNum = -1,
  featureId = -1,
} = {}) {
  const safeHotelId = Math.max(1, toIntOrDefault(hotelId, getAuthHotelId()))
  const safeYear = Math.max(2000, toIntOrDefault(year, new Date().getFullYear()))
  const safeMonth = Math.min(12, Math.max(1, toIntOrDefault(month, new Date().getMonth() + 1)))
  const safeUnitNameId = toIntOrDefault(unitNameId, -1)
  const safeFloorNum = normalizeFloorNumParam(floorNum)
  const safeFeatureId = toIntOrDefault(featureId, -1)

  return `${safeHotelId}#${safeYear}#${safeMonth}#${safeUnitNameId}#${safeFloorNum}#${safeFeatureId}`
}

export async function fetchMonthlyRoomsReport({
  hotelId = getAuthHotelId(),
  year,
  month,
  unitNameId = -1,
  floorNum = -1,
  featureId = -1,
} = {}) {
  const params = buildMonthlyRoomsReportParams({
    hotelId,
    year,
    month,
    unitNameId,
    floorNum,
    featureId,
  })

  try {
    const response = await executeProcedure(MONTHLY_ROOMS_REPORT_PROCEDURE, params)
    if (!response?.success) {
      return { success: false, rows: [], error: response?.error ?? 'Request failed' }
    }

    const payload = response?.decryptedData ?? response?.decrypted ?? {}
    const rows = normalizeMonthlyPayload(payload)
    return { success: true, rows, error: null }
  } catch (err) {
    return {
      success: false,
      rows: [],
      error: err?.message ?? 'Request failed',
    }
  }
}
