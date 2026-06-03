import { executeProcedure } from '../services/apiServices'
import { formatDisplayDate, toInputDateValue } from '../pages/new-booking/dateUtils.js'
import { EMPLOYEE_HOTEL_ID } from './GetEmployees'
import { normalizeFloorNumParam } from './GetMonthlyRoomsReport.js'

export const GET_ROOMS_STATUS_PROCEDURE = 'BRfc788n7ATIJwBjRuCVi2ipmPuHI2Mio9O7Im+c1I4='
export const ROOMS_PAGE_SIZE = 8
const STATS_FETCH_CAP = 500

function toIntOrDefault(value, fallback = -1) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function parseJsonList(value) {
  if (value == null) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/** Map API RoomStatus text to UI tone key. */
export function parseRoomStatusKey(roomStatus) {
  const s = String(roomStatus ?? '').toLowerCase()
  if (s.includes('available') || s.includes('فاض') || s.includes('متاح')) return 'available'
  if (s.includes('seated') || s.includes('مسكون') || s.includes('occupied') || s.includes('مشغول')) {
    return 'occupied'
  }
  if (s.includes('clean') || s.includes('تنظيف')) return 'cleaning'
  if (s.includes('book') || s.includes('reserv') || s.includes('محجوز')) return 'reserved'
  if (s.includes('maint') || s.includes('صيان')) return 'maintenance'
  return 'available'
}

function parseFeatureIds(raw) {
  const text = String(raw?.UnitAddFeature_Ids ?? raw?.unitAddFeature_Ids ?? '').trim()
  if (!text) return []
  return text
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isFinite(id) && id > 0)
}

function formatTransferTime(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function normalizeAssignment(raw) {
  if (!raw || typeof raw !== 'object') return null

  const customerNameAr = String(raw.CustomerNameA ?? raw.customerNameA ?? '').trim()
  const customerNameEn = String(raw.CustomerNameE ?? raw.customerNameE ?? '').trim()
  const featureNameAr = String(raw.FreatureNameA ?? raw.FeatureNameA ?? raw.featureNameA ?? '').trim()
  const featureNameEn = String(raw.FreatureNameE ?? raw.FeatureNameE ?? raw.featureNameE ?? '').trim()
  const fromDateIso = toInputDateValue(raw.FromDate ?? raw.fromDate)
  const toDateIso = toInputDateValue(raw.ToDate ?? raw.toDate)
  const reservationId = toIntOrDefault(raw.Reservation_Id ?? raw.reservation_Id, 0)

  if (!customerNameAr && !customerNameEn && !featureNameAr && !featureNameEn && !fromDateIso) {
    return null
  }

  return {
    reservationId,
    customerId: toIntOrDefault(raw.Customer_Id ?? raw.customer_Id, 0),
    customerNameAr,
    customerNameEn,
    featureId: toIntOrDefault(raw.UnitAddFeature_Id ?? raw.unitAddFeature_Id, 0),
    featureNameAr,
    featureNameEn,
    fromDateIso,
    toDateIso,
    fromDateLabel: formatDisplayDate(raw.FromDate ?? raw.fromDate),
    toDateLabel: formatDisplayDate(raw.ToDate ?? raw.toDate),
  }
}

export function isRoomSeated(room) {
  const key = room?.statusKey ?? parseRoomStatusKey(room?.roomStatusRaw)
  return key === 'occupied'
}

export function normalizeRoomStatusRow(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null

  const id = toIntOrDefault(raw.Id ?? raw.id, 0)
  if (!id) return null

  const reservationId = toIntOrDefault(raw.Reservation_Id ?? raw.reservation_Id, 0)
  const customerId = toIntOrDefault(raw.Customer_Id ?? raw.customer_Id, 0)
  const roomStatusRaw = String(raw.RoomStatus ?? raw.roomStatus ?? '').trim()
  const statusKey = parseRoomStatusKey(roomStatusRaw)
  const fromDate = raw.FromDate ?? raw.fromDate ?? null
  const toDate = raw.ToDate ?? raw.toDate ?? null
  const hasStay = Boolean(fromDate || toDate || reservationId)

  return {
    id,
    rowKey: `${id}-${reservationId}-${customerId}-${index}`,
    unitNameId: toIntOrDefault(raw.UnitName_Id ?? raw.unitName_Id, 0),
    unitNameAr: String(raw.UnitNameA ?? raw.unitNameA ?? '').trim(),
    unitNameEn: String(raw.UnitNameE ?? raw.unitNameE ?? '').trim(),
    floorNum: toIntOrDefault(raw.FloorNum ?? raw.floorNum, 0),
    maxPersonCount: Math.max(0, toIntOrDefault(raw.MaxPersonCount ?? raw.maxPersonCount, 0)),
    personsCount: Math.max(0, toIntOrDefault(raw.PersonsCount ?? raw.personsCount, 0)),
    unitPricePerNight: Number(raw.UnitPricePerNight ?? raw.unitPricePerNight) || 0,
    roomStatusRaw,
    statusKey,
    featureIds: parseFeatureIds(raw),
    reservationId,
    customerId,
    customerNameAr: String(raw.CustomerNameA ?? raw.customerNameA ?? '').trim(),
    customerNameEn: String(raw.CustomerNameE ?? raw.customerNameE ?? '').trim(),
    fromDateIso: toInputDateValue(fromDate),
    toDateIso: toInputDateValue(toDate),
    transferHint: hasStay
      ? {
          checkOut: formatTransferTime(fromDate) || formatDisplayDate(fromDate),
          checkIn: formatTransferTime(toDate) || formatDisplayDate(toDate),
        }
      : null,
    assignments: parseJsonList(raw.Assignments ?? raw.assignments)
      .map((item) => normalizeAssignment(item))
      .filter(Boolean),
  }
}

function parseRoomsPayload(payload) {
  const root = payload && typeof payload === 'object' ? payload : {}
  const roomsRaw = root.RoomsData ?? root.roomsData ?? root.Data ?? root.data
  const countRaw = root.RoomsCount ?? root.roomsCount ?? root.Count ?? root.count

  const list = parseJsonList(roomsRaw)
  const rooms = list.map((row, idx) => normalizeRoomStatusRow(row, idx)).filter(Boolean)
  const total = Number(countRaw) || rooms.length

  return { rooms, total }
}

export function buildRoomsStatusParams({
  hotelId = EMPLOYEE_HOTEL_ID,
  unitNameId = -1,
  floorNum = -1,
  startNum = 1,
  count = ROOMS_PAGE_SIZE,
} = {}) {
  const safeHotelId = Math.max(1, toIntOrDefault(hotelId, EMPLOYEE_HOTEL_ID))
  const safeUnitNameId = toIntOrDefault(unitNameId, -1)
  const safeFloorNum =
    typeof floorNum === 'string' ? normalizeFloorNumParam(floorNum) : toIntOrDefault(floorNum, -1)
  const safeStart = Math.max(1, toIntOrDefault(startNum, 1))
  const safeCount = Math.max(1, toIntOrDefault(count, ROOMS_PAGE_SIZE))

  return `${safeHotelId}#${safeUnitNameId}#${safeFloorNum}#${safeStart}#${safeCount}#$????`
}

export async function fetchRoomsStatus({
  hotelId = EMPLOYEE_HOTEL_ID,
  unitNameId = -1,
  floorNum = -1,
  page = 1,
  pageSize = ROOMS_PAGE_SIZE,
} = {}) {
  const safePage = Math.max(1, toIntOrDefault(page, 1))
  const safePageSize = Math.max(1, toIntOrDefault(pageSize, ROOMS_PAGE_SIZE))
  const startNum = (safePage - 1) * safePageSize + 1

  const params = buildRoomsStatusParams({
    hotelId,
    unitNameId,
    floorNum,
    startNum,
    count: safePageSize,
  })

  try {
    const response = await executeProcedure(GET_ROOMS_STATUS_PROCEDURE, params)
    if (!response?.success) {
      return {
        success: false,
        rooms: [],
        total: 0,
        error: response?.error ?? 'Request failed',
      }
    }

    const payload = response?.decrypted ?? response?.decryptedData ?? {}
    const { rooms, total } = parseRoomsPayload(payload)
    return { success: true, rooms, total, error: null }
  } catch (err) {
    return {
      success: false,
      rooms: [],
      total: 0,
      error: err?.message ?? 'Request failed',
    }
  }
}

export function computeRoomsStatusStats(rooms = []) {
  const counts = {
    total: rooms.length,
    available: 0,
    cleaning: 0,
    maintenance: 0,
    occupied: 0,
    reserved: 0,
  }

  rooms.forEach((room) => {
    if (room.statusKey === 'available') counts.available += 1
    else if (room.statusKey === 'cleaning') counts.cleaning += 1
    else if (room.statusKey === 'maintenance') counts.maintenance += 1
    else if (room.statusKey === 'occupied') counts.occupied += 1
    else if (room.statusKey === 'reserved') counts.reserved += 1
  })

  return counts
}

/** Load up to STATS_FETCH_CAP rooms (same filters) to compute summary cards. */
export async function fetchRoomsStatusStats({
  hotelId = EMPLOYEE_HOTEL_ID,
  unitNameId = -1,
  floorNum = -1,
} = {}) {
  const params = buildRoomsStatusParams({
    hotelId,
    unitNameId,
    floorNum,
    startNum: 1,
    count: STATS_FETCH_CAP,
  })

  try {
    const response = await executeProcedure(GET_ROOMS_STATUS_PROCEDURE, params)
    if (!response?.success) {
      return {
        success: false,
        stats: computeRoomsStatusStats([]),
        total: 0,
        error: response?.error ?? 'Request failed',
      }
    }

    const payload = response?.decrypted ?? response?.decryptedData ?? {}
    const { rooms, total } = parseRoomsPayload(payload)
    const stats = computeRoomsStatusStats(rooms)
    return {
      success: true,
      stats: { ...stats, total: Number(total) || rooms.length },
      total: Number(total) || rooms.length,
      error: null,
    }
  } catch (err) {
    return {
      success: false,
      stats: computeRoomsStatusStats([]),
      total: 0,
      error: err?.message ?? 'Request failed',
    }
  }
}
