import { DoMultiTransaction, DoTransaction, executeProcedure } from '../services/apiServices'
import { isDoTransactionSuccess } from './GetAgents.js'
import { EMPLOYEE_HOTEL_ID } from './GetEmployees.js'
import { saveCustomerFromForm } from './GetCustomers.js'
import {
  compareIsoDates,
  formatDisplayDate,
  isArrivalBeforeDeparture,
  toInputDateValue,
} from '../pages/new-booking/dateUtils.js'

export const RESERVATION_HOTEL_ID = EMPLOYEE_HOTEL_ID

const LIST_RESERVATIONS_PROCEDURE = 'FJlxEMmpZTAV9nftZApHGnsiDJk+FL4DKOBOXxJf0p4='
const GET_RESERVATION_DETAILS_PROCEDURE = 'FJlxEMmpZTAV9nftZApHGgvcdAIR6Vkt10kBcufW0js='
/** Hotel_SearchForReservation — hotel_id#value#encrypt */
const SEARCH_FOR_RESERVATION_PROCEDURE = 'h6uuUAX0zwHfm21Jp2Rvt/kmz0u7+7fHR7Ug6X6HWO8='
/** Hotel_GetAvailableRooms — Hotel_Id#Reservation_Id#UnitName_Id#FromDate#ToDate#StartNum#Count */
const GET_AVAILABLE_ROOMS_PROCEDURE = 'YVUU47P3dlraloAMRyrZCJpS94lWg96d5cvNxaJ4UiM='

const RESERVATION_TABLE_NAME = '1Xx5r4QVCRAA5fv+CZ63Fg=='
const RESERVATION_COLUMNS_NAMES =
  'Id#Hotel_Id#ReservationNum#ReservationDate#ReservationType_Id#Agent_Id#Customer_Id#FromDate#ToDate#PersonsCount#AudultsCount#ChildrenCount#RoomsCount#TotalReservationAmount#DownPayment#Status#StatusRemarks#IsApproved#ApprovedDate#ApprovedBy'

const RESERVATION_UNIT_TABLE_NAME = 'DPvCLQgCzv1ahaFcgjj8f4a69yg/NIQmIIe2PaDHtN0='
const RESERVATION_UNIT_COLUMNS_NAMES =
  'Id#Reservation_Id#UnitName_Id#UnitAddFeature_Id#PersonsCountPerUnit#UnitsCount#UnitPricePerNight#TotalNightsCount#TotalPrice#FromDate#ToDate#Hotel_id'
const UNIT_ASSIGNMENT_TABLE_NAME = 'oo0xSUDBgNmqRfwvq1Hmwg=='
const UNIT_ASSIGNMENT_COLUMNS_NAMES =
  'Id#Hotel_Id#AssignmentNum#AssignDate#AssignType#Reservation_Id#ReservationType_Id#Agent_Id#Customer_Id#FromDate#ToDate#PersonsCount#AudultsCount#ChildrenCount#RoomsCount#TotalReservationAmount#DownPayment#Status#StatusRemarks'
const UNIT_ASSIGNMENT_UNITS_TABLE_NAME = 'ZAjqiId7hr6wIs6Z9Dba/T7z+0Mi1Sv9bhnytqOyHeA='
const UNIT_ASSIGNMENT_PERSONS_TABLE_NAME = 'iN4+CZDtKgmrQ7/eBznsICXGVnYNL5rKWNvyBWP//iY='

const boolStr = (v) => (v ? 'True' : 'False')

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

function parseNestedJson(value) {
  if (value == null) return []
  if (Array.isArray(value)) return value

  let current = value
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (current == null) return []
    if (Array.isArray(current)) return current
    if (typeof current === 'object') return [current]

    if (typeof current !== 'string') return []

    const trimmed = current.trim()
    if (!trimmed || trimmed === '[]') return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
      if (typeof parsed === 'string') {
        current = parsed
        continue
      }
      if (parsed && typeof parsed === 'object') return [parsed]
      return []
    } catch {
      return []
    }
  }
  return []
}

/** Match CustomerData row to reservation Customer_Id when present. */
export function getReservationCustomer(row) {
  const customers = row?.customerData ?? []
  if (!customers.length) return null

  const customerId = Number(row?.customerId) || 0
  if (customerId) {
    const match = customers.find((c) => {
      const cid = Number(c.id ?? c.Id ?? c.Customer_Id ?? c.customer_Id ?? 0)
      return cid === customerId
    })
    if (match) return match
  }

  return customers[0]
}

/** Normalize reservation row from list/search procedures. */
export function normalizeReservationRow(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    reservationNum: String(raw.ReservationNum ?? raw.reservationNum ?? ''),
    reservationDate: raw.ReservationDate ?? raw.reservationDate ?? '',
    fromDate: raw.FromDate ?? raw.fromDate ?? '',
    toDate: raw.ToDate ?? raw.toDate ?? '',
    reservationTypeId: Number(raw.ReservationType_Id ?? raw.reservationType_Id ?? 0),
    typeNameAr: raw.TypeNameA ?? raw.typeNameA ?? '',
    typeNameEn: raw.TypeNameE ?? raw.typeNameE ?? '',
    agentId: Number(raw.Agent_Id ?? raw.agent_Id ?? 0),
    customerId: Number(raw.Customer_Id ?? raw.customer_Id ?? 0),
    adultsCount: Number(raw.AudultsCount ?? raw.audultsCount ?? raw.AdultsCount ?? 0),
    childrenCount: Number(raw.ChildrenCount ?? raw.childrenCount ?? 0),
    personsCount: Number(raw.PersonsCount ?? raw.personsCount ?? 0),
    roomsCount: Number(raw.RoomsCount ?? raw.roomsCount ?? 0),
    daysCount: Number(raw.DaysCount ?? raw.daysCount ?? 0),
    totalAmount: Number(raw.TotalReservationAmount ?? raw.totalReservationAmount ?? 0),
    downPayment: Number(raw.DownPayment ?? raw.downPayment ?? 0),
    status: Number(raw.Status ?? raw.status ?? 0),
    statusRemarks: String(raw.StatusRemarks ?? raw.statusRemarks ?? ''),
    isApproved:
      raw.IsApproved === true ||
      raw.IsApproved === 'true' ||
      raw.IsApproved === 'True' ||
      raw.isApproved === true,
    approvedBy: Number(raw.ApprovedBy ?? raw.approvedBy ?? 0),
    hotelId: Number(raw.Hotel_Id ?? raw.hotel_Id ?? 0),
    customerData: parseNestedJson(raw.CustomerData ?? raw.customerData),
    reservationUnits: parseNestedJson(raw.ReservationUnits ?? raw.reservationUnits),
  }
}

/**
 * Hotel_GetReservationDetails — hotel_id#Reservation_id#encrypt
 */
export async function getReservationDetails(reservationId, hotelId = RESERVATION_HOTEL_ID) {
  const id = Number(reservationId) || 0
  if (!id) {
    return { success: false, reservation: null, error: 'Invalid reservation id' }
  }

  const hid = Number(hotelId) || RESERVATION_HOTEL_ID
  const params = `${hid}#${id}#$????`

  try {
    const response = await executeProcedure(GET_RESERVATION_DETAILS_PROCEDURE, params)

    if (!response?.success) {
      return {
        success: false,
        reservation: null,
        error: response?.error ?? 'Request failed',
      }
    }

    const { rows } = parseReservationListPayload(response.decrypted ?? {})
    return {
      success: true,
      reservation: rows[0] ?? null,
      error: rows[0] ? null : 'Reservation not found',
    }
  } catch (err) {
    return {
      success: false,
      reservation: null,
      error: err?.message ?? 'Request failed',
    }
  }
}

function parseReservationListPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      rows: [],
      total: 0,
      stats: { all: 0, done: 0, pending: 0 },
    }
  }

  const keys = Object.keys(payload)
  let dataRaw =
    payload.ReservationData ??
    payload.reservationData ??
    payload.Data ??
    payload.data

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /reservationdata$/i.test(k))
    if (dataKey) dataRaw = payload[dataKey]
  }

  let countRaw =
    payload.ReservationCount ??
    payload.reservationCount ??
    payload.Count ??
    payload.count

  const list = parseJsonList(dataRaw)
  const rows = list.map((item) => normalizeReservationRow(item)).filter(Boolean)
  const total = Number(countRaw ?? rows.length ?? 0)

  const stats = {
    all: Number(payload.allReservationCount ?? payload.AllReservationCount ?? total) || 0,
    done: Number(payload.doneReservationCount ?? payload.DoneReservationCount ?? 0) || 0,
    pending: Number(payload.pendingReservationCount ?? payload.PendingReservationCount ?? 0) || 0,
  }

  return { rows, total, stats }
}

function normalizeAvailableRoomRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    unitNum: String(raw.UnitNum ?? raw.unitNum ?? '').trim(),
    unitNameId: Number(raw.UnitName_Id ?? raw.unitName_Id ?? 0),
    unitNameAr: String(raw.UnitNameA ?? raw.unitNameA ?? '').trim(),
    unitNameEn: String(raw.UnitNameE ?? raw.unitNameE ?? '').trim(),
    floorNum: Number(raw.FloorNum ?? raw.floorNum ?? 0),
    maxPersonCount: Number(raw.MaxPersonCount ?? raw.maxPersonCount ?? 0),
    personsCount: Number(raw.PersonsCount ?? raw.personsCount ?? 0),
    unitAddFeatureId: Number(raw.UnitAddFeature_Id ?? raw.unitAddFeature_Id ?? 0),
    featureNameAr: String(raw.FreatureNameA ?? raw.FeatureNameA ?? '').trim(),
    featureNameEn: String(raw.FreatureNameE ?? raw.FeatureNameE ?? '').trim(),
    featurePrice: Number(raw.FeaturePrice ?? raw.featurePrice ?? 0),
    unitPricePerNight: Number(raw.UnitPricePerNight ?? raw.unitPricePerNight ?? 0),
    raw,
  }
}

function parseAvailableRoomsPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { rooms: [], total: 0 }
  }

  const keys = Object.keys(payload)
  let dataRaw =
    payload.AvailableRoomsData ??
    payload.availableRoomsData ??
    payload.Data ??
    payload.data

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /availableroomsdata$/i.test(k))
    if (dataKey) dataRaw = payload[dataKey]
  }

  let countRaw =
    payload.AvailableRoomsCount ??
    payload.availableRoomsCount ??
    payload.Count ??
    payload.count

  const list = parseJsonList(dataRaw)
  const rooms = list.map((item) => normalizeAvailableRoomRow(item)).filter(Boolean)
  const total = Number(countRaw ?? rooms.length ?? 0)

  return { rooms, total }
}

function formatApiDateDdMmYyyy(value) {
  const iso = toInputDateValue(value)
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Strip leading # — values are joined with # and must not contain that character. */
function normalizeAssignmentNum(value) {
  return String(value ?? '')
    .trim()
    .replace(/^#+/, '')
}

export async function getAvailableRoomsForReservationUnit({
  reservationId,
  id,
  unitNameId,
  fromDate,
  toDate,
  hotelId = RESERVATION_HOTEL_ID,
  startNum = 1,
  count = 200,
} = {}) {
  const hid = Number(hotelId) || RESERVATION_HOTEL_ID
  const rid = Number(reservationId) || 0
  const uid = Number(id ?? unitNameId) || 0
  const fromIso = toInputDateValue(fromDate)
  const toIso = toInputDateValue(toDate)
  const start = Math.max(1, Number(startNum) || 1)
  const limit = Math.max(1, Number(count) || 200)

  if (!rid) {
    return { success: false, rooms: [], total: 0, error: 'Invalid reservation id' }
  }
  if (!uid) {
    return { success: false, rooms: [], total: 0, error: 'Invalid unit name id' }
  }
  if (!fromIso || !toIso) {
    return { success: false, rooms: [], total: 0, error: 'Invalid date range' }
  }

  const params = `${hid}#${rid}#${uid}#${fromIso}#${toIso}#${start}#${limit}`

  try {
    const response = await executeProcedure(GET_AVAILABLE_ROOMS_PROCEDURE, params)
    if (!response?.success) {
      return {
        success: false,
        rooms: [],
        total: 0,
        error: response?.error ?? 'Request failed',
      }
    }

    const { rooms, total } = parseAvailableRoomsPayload(response.decrypted ?? {})
    return {
      success: true,
      rooms,
      total,
      error: null,
    }
  } catch (err) {
    return {
      success: false,
      rooms: [],
      total: 0,
      error: err?.message ?? 'Request failed',
    }
  }
}

export function filterReservationsByStat(rows, statKey) {
  if (!Array.isArray(rows)) return []
  if (statKey === 'confirmed') return rows.filter((r) => r.isApproved)
  if (statKey === 'pending') return rows.filter((r) => !r.isApproved)
  return rows
}

export function getReservationPartyName(row, isArabic) {
  if (!row) return ''
  const c = getReservationCustomer(row)
  if (c) {
    const nameAr = String(c.CustomerNameA ?? c.customerNameA ?? '').trim()
    const nameEn = String(c.CustomerNameE ?? c.customerNameE ?? '').trim()
    return isArabic ? nameAr || nameEn : nameEn || nameAr
  }
  if (row.agentId > 0) {
    return isArabic
      ? row.typeNameAr || row.typeNameEn || `شركة #${row.agentId}`
      : row.typeNameEn || row.typeNameAr || `Agent #${row.agentId}`
  }
  return isArabic ? `عميل #${row.customerId}` : `Customer #${row.customerId}`
}

export function getReservationPhone(row) {
  const c = getReservationCustomer(row)
  if (!c) return ''
  return String(c.Mobile ?? c.mobile ?? c.WhatsUp ?? c.whatsUp ?? '').trim()
}

/** One allocation row per room when RoomsCount > 1. */
export function expandReservationsForAllocation(rows) {
  if (!Array.isArray(rows)) return []
  const expanded = []
  rows.forEach((row) => {
    const totalRooms = Math.max(1, Number(row.roomsCount) || 1)
    for (let roomIndex = 1; roomIndex <= totalRooms; roomIndex += 1) {
      expanded.push({ row, roomIndex, totalRooms })
    }
  })
  return expanded
}

function formatMoneyAmount(amount, currencyLabel) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return `0.00 ${currencyLabel}`
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currencyLabel}`
}

function nightsLabel(nights, isArabic) {
  const n = Number(nights) || 0
  return isArabic
    ? `${n} ${n === 1 ? 'ليلة' : 'ليالي'}`
    : `${n} ${n === 1 ? 'night' : 'nights'}`
}

function nightsBetweenDates(fromIso, toIso) {
  if (!fromIso || !toIso) return 0
  const start = new Date(`${fromIso}T00:00:00`)
  const end = new Date(`${toIso}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function distributeCount(total, slots) {
  const count = Math.max(0, Number(total) || 0)
  const n = Math.max(1, slots)
  const base = Math.floor(count / n)
  const remainder = count % n
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0))
}

/** Detect #999, 999, or reservation id style search → open check-in detail. */
export function normalizeAllocationSearchQuery(query) {
  const raw = String(query ?? '').trim()
  if (!raw) return { kind: 'list', value: '' }

  const withoutHash = raw.replace(/^#+/, '').trim()
  if (!withoutHash) return { kind: 'list', value: '' }

  if (/^#/.test(raw) || /^\d+$/.test(withoutHash)) {
    return { kind: 'lookup', value: withoutHash }
  }

  if (/^[a-zA-Z0-9_-]+$/.test(withoutHash)) {
    return { kind: 'lookup', value: withoutHash }
  }

  return { kind: 'list', value: raw }
}

export function isReservationLookupQuery(query) {
  return normalizeAllocationSearchQuery(query).kind === 'lookup'
}

/** Resolve a single reservation from search / id for allocation check-in. */
export async function resolveReservationForCheckIn(searchValue) {
  const parsed = normalizeAllocationSearchQuery(searchValue)
  if (parsed.kind !== 'lookup') {
    return { success: false, reservation: null, error: 'Not a reservation lookup' }
  }

  const value = parsed.value
  const searchResult = await searchReservationsForAllocation({ searchText: value })

  if (searchResult.success && searchResult.reservations.length > 0) {
    const exact = searchResult.reservations.filter(
      (r) =>
        String(r.id) === value ||
        String(r.reservationNum).toLowerCase() === value.toLowerCase()
    )
    const pick = exact.length === 1 ? exact[0] : searchResult.reservations[0]
    if (pick) {
      const details = await getReservationDetails(pick.id)
      if (details.success && details.reservation) {
        return { success: true, reservation: details.reservation, error: null }
      }
      return { success: true, reservation: pick, error: null }
    }
  }

  const numericId = Number(value)
  if (numericId > 0) {
    const details = await getReservationDetails(numericId)
    if (details.success && details.reservation) {
      return { success: true, reservation: details.reservation, error: null }
    }
  }

  return {
    success: false,
    reservation: null,
    error: searchResult.error ?? 'Reservation not found',
  }
}

export function mapReservationToCheckInBooking(row, isArabic, currencyLabel = 'د.ل.') {
  if (!row) return null

  const customer = getReservationCustomer(row)
  const total = Number(row.totalAmount) || 0
  const down = Number(row.downPayment) || 0
  const remaining = Math.max(0, total - down)
  const units = row.reservationUnits ?? []
  const roomSlots = Math.max(1, Number(row.roomsCount) || 1)
  const nights = Number(row.daysCount) || 0
  const fromIso = toInputDateValue(row.fromDate)
  const toIso = toInputDateValue(row.toDate)
  const adultSplit = distributeCount(row.adultsCount, roomSlots)
  const childSplit = distributeCount(row.childrenCount, roomSlots)
  const perRoomPrice = roomSlots > 0 ? total / roomSlots : total

  const dash = '—'

  let rooms = []

  if (units.length > 0) {
    rooms = units.map((unit, idx) => {
      const unitFrom = toInputDateValue(unit.FromDate ?? unit.fromDate) || fromIso
      const unitTo = toInputDateValue(unit.ToDate ?? unit.toDate) || toIso
      const unitNights =
        Number(
          unit.TotalNightsCount ??
            unit.totalNightsCount ??
            unit.DaysCount ??
            unit.daysCount
        ) ||
        nightsBetweenDates(unitFrom, unitTo) ||
        nights
      const price =
        Number(
          unit.TotalPrice ??
            unit.totalPrice ??
            unit.Price ??
            unit.price ??
            unit.UnitPricePerNight ??
            unit.unitPricePerNight
        ) || perRoomPrice
      const personsPerUnit = Number(
        unit.PersonsCountPerUnit ?? unit.personsCountPerUnit ?? 0
      )
      const unitAdults =
        Number(unit.AdultsCount ?? unit.adultsCount ?? unit.AudultsCount) ||
        (personsPerUnit > 0 ? personsPerUnit : 0)
      const unitChildren = Number(unit.ChildrenCount ?? unit.childrenCount) || 0
      const featureAr = String(
        unit.FreatureNameA ?? unit.freatureNameA ?? unit.FeatureNameA ?? unit.featureNameA ?? ''
      ).trim()
      const featureEn = String(
        unit.FreatureNameE ?? unit.freatureNameE ?? unit.FeatureNameE ?? unit.featureNameE ?? ''
      ).trim()
      const unitsCount = Math.max(1, Number(unit.UnitsCount ?? unit.unitsCount) || 1)

      return {
        id: Number(unit.Id ?? unit.id) || idx + 1,
        unitNameId: Number(unit.UnitName_Id ?? unit.unitName_Id ?? 0),
        typeAr:
          unit.UnitNameA ??
          unit.unitNameA ??
          unit.UnitTypeNameA ??
          unit.unitTypeNameA ??
          unit.TypeNameA ??
          dash,
        typeEn:
          unit.UnitNameE ??
          unit.unitNameE ??
          unit.UnitTypeNameE ??
          unit.unitTypeNameE ??
          unit.TypeNameE ??
          dash,
        adults: unitAdults,
        children: unitChildren,
        unitsCount,
        featureAr: featureAr || dash,
        featureEn: featureEn || dash,
        fromDate: unitFrom,
        toDate: unitTo,
        nights: unitNights,
        nightsAr: nightsLabel(unitNights, true),
        nightsEn: nightsLabel(unitNights, false),
        priceAr: formatMoneyAmount(price, currencyLabel),
        priceEn: formatMoneyAmount(price, currencyLabel),
      }
    })
  } else {
    rooms = Array.from({ length: roomSlots }, (_, idx) => {
      const index = idx + 1
      return {
        id: index,
        unitNameId: 0,
        typeAr: isArabic ? `غرفة ${index}` : `Room ${index}`,
        typeEn: `Room ${index}`,
        adults: adultSplit[idx] ?? 0,
        children: childSplit[idx] ?? 0,
        fromDate: fromIso,
        toDate: toIso,
        nights,
        nightsAr: nightsLabel(nights, true),
        nightsEn: nightsLabel(nights, false),
        priceAr: formatMoneyAmount(perRoomPrice, currencyLabel),
        priceEn: formatMoneyAmount(perRoomPrice, currencyLabel),
      }
    })
  }

  const totalRoomNights = rooms.reduce((sum, room) => sum + (Number(room.nights) || 0), 0)
  const totalRoomsPrice = rooms.reduce((sum, room) => {
    const price = Number(String(room.priceEn).replace(/[^\d.]/g, ''))
    return sum + (Number.isFinite(price) ? price : 0)
  }, 0)
  const totalRoomsFromUnits =
    units.length > 0
      ? units.reduce(
          (sum, unit) => sum + Math.max(1, Number(unit.UnitsCount ?? unit.unitsCount) || 1),
          0
        )
      : roomSlots

  return {
    id: row.id,
    reservationNum: row.reservationNum,
    guestNameAr: getReservationPartyName(row, true),
    guestNameEn: getReservationPartyName(row, false),
    clientTypeAr: row.typeNameAr || 'عميل',
    clientTypeEn: row.typeNameEn || 'Customer',
    phone: getReservationPhone(row) || dash,
    idNumber: String(customer?.IdNum ?? customer?.idNum ?? dash),
    bookingDate: toInputDateValue(row.reservationDate),
    arrivalDate: fromIso,
    departureDate: toIso,
    totalAmountAr: formatMoneyAmount(total, currencyLabel),
    totalAmountEn: formatMoneyAmount(total, currencyLabel),
    paidAmountAr: formatMoneyAmount(down, currencyLabel),
    paidAmountEn: formatMoneyAmount(down, currencyLabel),
    remainingAmountAr: formatMoneyAmount(remaining, currencyLabel),
    remainingAmountEn: formatMoneyAmount(remaining, currencyLabel),
    nationalityAr: customer?.NationalityNameA ?? customer?.nationalityNameA ?? dash,
    nationalityEn: customer?.NationalityNameE ?? customer?.nationalityNameE ?? dash,
    professionAr: dash,
    professionEn: dash,
    birthDate: dash,
    visitPurposeAr: dash,
    visitPurposeEn: dash,
    genderAr: customer?.genderName ?? dash,
    genderEn: customer?.genderName ?? dash,
    source: row.typeNameEn || row.typeNameAr || dash,
    sourceEn: row.typeNameEn || dash,
    notesAr: row.statusRemarks || dash,
    notesEn: row.statusRemarks || dash,
    totalRooms: units.length > 0 ? totalRoomsFromUnits : rooms.length,
    adults: Number(row.adultsCount) || 0,
    children: Number(row.childrenCount) || 0,
    rooms,
    totalNightsAr: nightsLabel(units.length > 0 ? totalRoomNights : nights, true),
    totalNightsEn: nightsLabel(units.length > 0 ? totalRoomNights : nights, false),
    totalRoomsPriceAr: formatMoneyAmount(totalRoomsPrice || total, currencyLabel),
    totalRoomsPriceEn: formatMoneyAmount(totalRoomsPrice || total, currencyLabel),
    raw: row,
  }
}

export function mapReservationToAllocationArrival(
  { row, roomIndex, totalRooms },
  isArabic,
  currencyLabel = 'د.ل.'
) {
  if (!row) return null
  const total = row.totalAmount
  const price = `${total.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currencyLabel}`

  return {
    key: `${row.id}-${roomIndex}`,
    id: row.id,
    reservationId: row.id,
    reservationNum: row.reservationNum,
    roomIndex,
    totalRooms,
    roomCount: 1,
    guestNameAr: getReservationPartyName(row, true),
    guestNameEn: getReservationPartyName(row, false),
    phone: getReservationPhone(row),
    startDateAr: formatDisplayDate(row.fromDate),
    startDateEn: formatDisplayDate(row.fromDate),
    endDateAr: formatDisplayDate(row.toDate),
    endDateEn: formatDisplayDate(row.toDate),
    priceAr: price,
    priceEn: price,
    raw: row,
  }
}

/**
 * Hotel_SearchForReservation — hotel_id#value#encrypt
 */
export async function searchReservationsForAllocation({
  hotelId = RESERVATION_HOTEL_ID,
  searchText = '',
} = {}) {
  const hid = Number(hotelId) || RESERVATION_HOTEL_ID
  const value = String(searchText ?? '').trim()
  const params = `${hid}#${value}#$????`

  try {
    const response = await executeProcedure(SEARCH_FOR_RESERVATION_PROCEDURE, params)

    if (!response?.success) {
      return {
        success: false,
        reservations: [],
        total: 0,
        error: response?.error ?? 'Request failed',
      }
    }

    const { rows, total } = parseReservationListPayload(response.decrypted ?? {})
    return {
      success: true,
      reservations: rows,
      total,
      error: null,
    }
  } catch (err) {
    return {
      success: false,
      reservations: [],
      total: 0,
      error: err?.message ?? 'Request failed',
    }
  }
}

export function mapReservationToTableRow(row, isArabic, currencyLabel = 'د.ل.') {
  if (!row) return null
  const total = row.totalAmount
  const down = row.downPayment
  const paid = total > 0 && down >= total
  const nights = row.daysCount || 0
  const nightsLabel = isArabic
    ? `${nights} ${nights === 1 ? 'ليلة' : 'ليالي'}`
    : `${nights} ${nights === 1 ? 'night' : 'nights'}`

  const partyLabel = row.agentId > 0
    ? isArabic
      ? row.typeNameAr || row.typeNameEn
      : row.typeNameEn || row.typeNameAr
    : isArabic
      ? `عميل #${row.customerId}`
      : `Customer #${row.customerId}`

  return {
    id: row.id,
    bookingNumber: row.reservationNum,
    bookingDateAr: formatDisplayDate(row.reservationDate),
    bookingDateEn: formatDisplayDate(row.reservationDate),
    customerNameAr: partyLabel,
    customerNameEn: partyLabel,
    phone: '',
    unitCategoryAr: row.typeNameAr || '—',
    unitCategoryEn: row.typeNameEn || row.typeNameAr || '—',
    checkInAr: formatDisplayDate(row.fromDate),
    checkInEn: formatDisplayDate(row.fromDate),
    checkOutAr: formatDisplayDate(row.toDate),
    checkOutEn: formatDisplayDate(row.toDate),
    durationAr: nightsLabel,
    durationEn: nightsLabel,
    amount: `${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyLabel}`,
    paymentStatus: paid ? 'paid' : 'unpaid',
    statusAr: row.isApproved ? 'مؤكد' : 'في الانتظار',
    statusEn: row.isApproved ? 'Confirmed' : 'Pending',
    isApproved: row.isApproved,
    raw: row,
  }
}

/**
 * Hotel list reservations — hotel_id#value#Date#StartNum#Count#encrypt
 * Date: "" when not filtering by date; otherwise dd / mm / yyyy
 */
export async function fetchReservationsPage({
  hotelId = RESERVATION_HOTEL_ID,
  searchText = '',
  date = '',
  startNum = 1,
  count = 50,
} = {}) {
  const hid = Number(hotelId) || RESERVATION_HOTEL_ID
  const value = String(searchText ?? '').trim()
  const dateParam = String(date ?? '').trim()
  const start = Math.max(1, Number(startNum) || 1)
  const pageSize = Math.max(1, Number(count) || 50)
  const params = `${hid}#${value}#${dateParam}#${start}#${pageSize}#$????`

  try {
    const response = await executeProcedure(LIST_RESERVATIONS_PROCEDURE, params)

    if (!response?.success) {
      return {
        success: false,
        reservations: [],
        total: 0,
        stats: { all: 0, done: 0, pending: 0 },
        error: response?.error ?? 'Request failed',
      }
    }

    const { rows, total, stats } = parseReservationListPayload(response.decrypted ?? {})
    return {
      success: true,
      reservations: rows,
      total,
      stats,
      error: null,
    }
  } catch (err) {
    return {
      success: false,
      reservations: [],
      total: 0,
      stats: { all: 0, done: 0, pending: 0 },
      error: err?.message ?? 'Request failed',
    }
  }
}

function parseAmount(value) {
  const n = Number(String(value ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Nights between arrival and departure (exclusive checkout day). */
function computeNightsCount(arrival, departure) {
  const from = toInputDateValue(arrival)
  const to = toInputDateValue(departure)
  if (!from || !to) return 0
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

export function aggregateStayRows(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      fromDate: '',
      toDate: '',
      adultsCount: 0,
      childrenCount: 0,
      roomsCount: 0,
      personsCount: 0,
    }
  }

  let adultsCount = 0
  let childrenCount = 0
  let roomsCount = 0
  let fromDate = String(rows[0].arrivalDate ?? '').trim()
  let toDate = String(rows[0].departureDate ?? '').trim()

  rows.forEach((row) => {
    adultsCount += Number(row.adults) || 0
    childrenCount += Number(row.children) || 0
    roomsCount += Number(row.unitsCount) || 0
    const arrival = toInputDateValue(row.arrivalDate)
    const departure = toInputDateValue(row.departureDate)
    if (arrival && (!fromDate || compareIsoDates(arrival, fromDate) < 0)) fromDate = arrival
    if (departure && (!toDate || compareIsoDates(departure, toDate) > 0)) toDate = departure
  })

  return {
    fromDate,
    toDate,
    adultsCount,
    childrenCount,
    roomsCount,
    personsCount: adultsCount + childrenCount,
  }
}

export function validateReservationBooking(
  {
    form,
    bookingType,
    selectedPartyId,
    stayRows,
    stayGrandTotal,
    downPayment,
    idFile,
    isArabic,
  },
  messages
) {
  const errors = []
  const m = messages ?? {}
  const total = Number(stayGrandTotal) || 0
  const down = parseAmount(downPayment)
  const stay = aggregateStayRows(stayRows)
  const isCompanies = bookingType === 'companies'

  if (!String(form?.bookingNumber ?? '').trim()) {
    errors.push(m.bookingNumber ?? (isArabic ? 'رقم الحجز مطلوب' : 'Booking number is required'))
  }
  if (!String(form?.bookingDate ?? '').trim()) {
    errors.push(m.bookingDate ?? (isArabic ? 'تاريخ الحجز مطلوب' : 'Booking date is required'))
  }
  if (!String(form?.reservationTypeId ?? '').trim()) {
    errors.push(
      m.reservationType ?? (isArabic ? 'نوع الحجز مطلوب' : 'Reservation type is required')
    )
  }

  if (isCompanies) {
    if (!Number(selectedPartyId)) {
      errors.push(m.agent ?? (isArabic ? 'اختر الشركة' : 'Select a company'))
    }
  } else if (!Number(selectedPartyId)) {
    if (!String(form?.fullName ?? '').trim()) {
      errors.push(m.fullName ?? (isArabic ? 'الاسم الكامل مطلوب' : 'Full name is required'))
    }
    if (!String(form?.idNumber ?? '').trim()) {
      errors.push(m.idNumber ?? (isArabic ? 'رقم الهوية مطلوب' : 'ID number is required'))
    }
    if (!String(form?.gender ?? '').trim()) {
      errors.push(m.gender ?? (isArabic ? 'الجنس مطلوب' : 'Gender is required'))
    }
    if (!String(form?.nationality ?? '').trim()) {
      errors.push(m.nationality ?? (isArabic ? 'الجنسية مطلوبة' : 'Nationality is required'))
    }
    const hasIdFile = idFile && idFile instanceof File && idFile.size > 0
    if (!hasIdFile) {
      errors.push(
        m.idPhoto ?? (isArabic ? 'صورة الهوية مطلوبة' : 'ID photo is required')
      )
    }
  }

  if (!stayRows?.length) {
    errors.push(m.stayLines ?? (isArabic ? 'أضف تفاصيل إقامة واحدة على الأقل' : 'Add at least one stay line'))
  }
  if (!stay.fromDate) {
    errors.push(m.fromDate ?? (isArabic ? 'تاريخ الوصول مطلوب' : 'Arrival date is required'))
  }
  if (!stay.toDate) {
    errors.push(m.toDate ?? (isArabic ? 'تاريخ المغادرة مطلوب' : 'Departure date is required'))
  }
  if (stay.fromDate && stay.toDate && !isArrivalBeforeDeparture(stay.fromDate, stay.toDate)) {
    errors.push(
      m.dateOrder ??
        (isArabic
          ? 'تاريخ الوصول يجب أن يكون قبل تاريخ المغادرة'
          : 'Arrival date must be before departure date')
    )
  }
  if (stay.adultsCount <= 0) {
    errors.push(m.adults ?? (isArabic ? 'عدد البالغين مطلوب' : 'Adults count is required'))
  }
  if (stay.roomsCount <= 0) {
    errors.push(m.rooms ?? (isArabic ? 'عدد الوحدات مطلوب' : 'Rooms count is required'))
  }

  if (total <= 0) {
    errors.push(m.total ?? (isArabic ? 'إجمالي السعر مطلوب' : 'Total price is required'))
  }
  if (String(downPayment ?? '').trim() === '') {
    errors.push(m.downPayment ?? (isArabic ? 'الدفعة المقدمة مطلوبة' : 'Down payment is required'))
  } else if (down < 0) {
    errors.push(m.downPaymentInvalid ?? (isArabic ? 'الدفعة المقدمة غير صالحة' : 'Invalid down payment'))
  } else if (total > 0 && down >= total) {
    errors.push(
      m.downPaymentTooHigh ??
        (isArabic
          ? 'يجب أن تكون الدفعة المقدمة أقل من إجمالي السعر'
          : 'Down payment must be less than total price')
    )
  }

  return { valid: errors.length === 0, errors, stay, total, down }
}

function buildReservationColumnsValues({
  id = 0,
  hotelId = RESERVATION_HOTEL_ID,
  reservationNum = '',
  reservationDate = '',
  reservationTypeId = 0,
  agentId = 0,
  customerId = 0,
  fromDate = '',
  toDate = '',
  personsCount = 0,
  adultsCount = 0,
  childrenCount = 0,
  roomsCount = 0,
  totalReservationAmount = 0,
  downPayment = 0,
  status = '',
  statusRemarks = '',
  isApproved = false,
  approvedDate = '',
  approvedBy = 0,
} = {}) {
  return [
    Number(id) || 0,
    Number(hotelId) || RESERVATION_HOTEL_ID,
    String(reservationNum ?? '').trim(),
    String(reservationDate ?? '').trim(),
    Number(reservationTypeId) || 0,
    Number(agentId) || 0,
    Number(customerId) || 0,
    String(fromDate ?? '').trim(),
    String(toDate ?? '').trim(),
    Number(personsCount) || 0,
    Number(adultsCount) || 0,
    Number(childrenCount) || 0,
    Number(roomsCount) || 0,
    Number(totalReservationAmount) || 0,
    Number(downPayment) || 0,
    String(status ?? '').trim(),
    String(statusRemarks ?? '').trim(),
    boolStr(isApproved === true || isApproved === 'true'),
    String(approvedDate ?? '').trim(),
    Number(approvedBy) || 0,
  ].join('#')
}

/** First generated Id from DoMultiTransaction MultiIdinties (reservation row). */
export function parseFirstMultiId(multiIdinties) {
  if (multiIdinties == null) return 0
  const raw = String(multiIdinties).trim()
  if (!raw) return 0
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const first = Number(parsed[0])
      return Number.isFinite(first) && first > 0 ? first : 0
    }
  } catch {
    /* not JSON */
  }
  const parts = raw.split(/[\^#,;]+/).map((p) => p.trim()).filter(Boolean)
  for (const part of parts) {
    const n = Number(part)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

export function parseDoTransactionNewId(newIdValue) {
  if (newIdValue == null) return 0
  const raw = String(newIdValue).trim()
  if (!raw) return 0

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const first = Number(parsed[0])
      return Number.isFinite(first) && first > 0 ? first : 0
    }
    if (typeof parsed === 'number') {
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }
    if (typeof parsed === 'string') {
      const n = Number(parsed.trim())
      return Number.isFinite(n) && n > 0 ? n : 0
    }
  } catch {
    /* not JSON */
  }

  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const saveReservation = async ({
  id = 0,
  hotelId = RESERVATION_HOTEL_ID,
  reservationNum = '',
  reservationDate = '',
  reservationTypeId = 0,
  agentId = 0,
  customerId = 0,
  fromDate = '',
  toDate = '',
  personsCount = 0,
  adultsCount = 0,
  childrenCount = 0,
  roomsCount = 0,
  totalReservationAmount = 0,
  downPayment = 0,
  status = '',
  statusRemarks = '',
  isApproved = false,
  approvedDate = '',
  approvedBy = 0,
  wantedAction = 0,
}) => {
  const columnsValues = buildReservationColumnsValues({
    id,
    hotelId,
    reservationNum,
    reservationDate,
    reservationTypeId,
    agentId,
    customerId,
    fromDate,
    toDate,
    personsCount,
    adultsCount,
    childrenCount,
    roomsCount,
    totalReservationAmount,
    downPayment,
    status,
    statusRemarks,
    isApproved,
    approvedDate,
    approvedBy,
  })

  return DoTransaction(
    RESERVATION_TABLE_NAME,
    columnsValues,
    wantedAction,
    RESERVATION_COLUMNS_NAMES
  )
}

function buildUnitAssignmentColumnsValues({
  id = 0,
  hotelId = RESERVATION_HOTEL_ID,
  assignmentNum = '',
  assignDate = '',
  assignType = 0,
  reservationId = 0,
  reservationTypeId = 0,
  agentId = 0,
  customerId = 0,
  fromDate = '',
  toDate = '',
  personsCount = 0,
  adultsCount = 0,
  childrenCount = 0,
  roomsCount = 0,
  totalReservationAmount = 0,
  downPayment = 0,
  status = 0,
  statusRemarks = '',
}) {
  return [
    Number(id) || 0,
    Number(hotelId) || RESERVATION_HOTEL_ID,
    normalizeAssignmentNum(assignmentNum),
    formatApiDateDdMmYyyy(assignDate),
    Number(assignType) || 0,
    Number(reservationId) || 0,
    Number(reservationTypeId) || 0,
    Number(agentId) || 0,
    Number(customerId) || 0,
    formatApiDateDdMmYyyy(fromDate),
    formatApiDateDdMmYyyy(toDate),
    Number(personsCount) || 0,
    Number(adultsCount) || 0,
    Number(childrenCount) || 0,
    Number(roomsCount) || 0,
    Number(totalReservationAmount) || 0,
    Number(downPayment) || 0,
    Number(status) || 0,
    String(statusRemarks ?? '').trim(),
  ].join('#')
}

export const saveUnitAssignmentHeader = async ({
  id = 0,
  hotelId = RESERVATION_HOTEL_ID,
  assignmentNum = '',
  assignDate = '',
  assignType = 0,
  reservationId = 0,
  reservationTypeId = 0,
  agentId = 0,
  customerId = 0,
  fromDate = '',
  toDate = '',
  personsCount = 0,
  adultsCount = 0,
  childrenCount = 0,
  roomsCount = 0,
  totalReservationAmount = 0,
  downPayment = 0,
  status = 0,
  statusRemarks = '',
  wantedAction = 0,
} = {}) => {
  const columnsValues = buildUnitAssignmentColumnsValues({
    id,
    hotelId,
    assignmentNum,
    assignDate,
    assignType,
    reservationId,
    reservationTypeId,
    agentId,
    customerId,
    fromDate,
    toDate,
    personsCount,
    adultsCount,
    childrenCount,
    roomsCount,
    totalReservationAmount,
    downPayment,
    status,
    statusRemarks,
  })

  console.group('[Allocation][UnitAssignment][Header] Request')
  console.log('TableName:', UNIT_ASSIGNMENT_TABLE_NAME)
  console.log('ColumnsNames:', UNIT_ASSIGNMENT_COLUMNS_NAMES)
  console.log('ColumnsValues:', columnsValues)
  console.groupEnd()

  const res = await DoTransaction(
    UNIT_ASSIGNMENT_TABLE_NAME,
    columnsValues,
    wantedAction,
    UNIT_ASSIGNMENT_COLUMNS_NAMES
  )

  return {
    ...res,
    assignmentId: parseDoTransactionNewId(res?.NewId),
  }
}

export const deleteUnitAssignmentHeader = async (unitAssignmentId) => {
  const id = Number(unitAssignmentId) || 0
  if (!id) {
    return { success: false, errorMessage: 'Invalid UnitAssignment id' }
  }
  return DoTransaction(UNIT_ASSIGNMENT_TABLE_NAME, String(id), 2, 'Id')
}

const UNIT_ASSIGNMENT_PERSON_ID_TYPES = {
  national_id: 1,
  passport: 2,
  residency: 3,
}

const UNIT_ASSIGNMENT_PERSON_GENDERS = {
  male: 1,
  female: 2,
}

function buildUnitAssignmentUnitColumnsValues({
  id = 0,
  unitAssignmentId = 0,
  hotelUnitId = 0,
  unitAddFeatureId = 0,
  personsCountPerUnit = 0,
  fromDate = '',
  toDate = '',
  unitPricePerNight = 0,
  totalNightsCount = 0,
  totalPricce = 0,
}) {
  return [
    Number(id) || 0,
    Number(unitAssignmentId) || 0,
    Number(hotelUnitId) || 0,
    Number(unitAddFeatureId) || 0,
    Number(personsCountPerUnit) || 0,
    formatApiDateDdMmYyyy(fromDate),
    formatApiDateDdMmYyyy(toDate),
    Number(unitPricePerNight) || 0,
    Number(totalNightsCount) || 0,
    Number(totalPricce) || 0,
  ].join('#')
}

function buildUnitAssignmentPersonColumnsValues({
  id = 0,
  unitAssignmentUnitsId = 0,
  customerName = '',
  idType = 0,
  idNum = '',
  nationalityId = 0,
  birthDate = '',
  genderId = 0,
  job = '',
}) {
  return [
    Number(id) || 0,
    Number(unitAssignmentUnitsId) || 0,
    String(customerName ?? '').trim(),
    Number(idType) || 0,
    String(idNum ?? '').trim(),
    Number(nationalityId) || 0,
    formatApiDateDdMmYyyy(birthDate),
    Number(genderId) || 0,
    String(job ?? '').trim(),
  ].join('#')
}

function normalizeUnitAssignmentPerson(person) {
  if (!person || typeof person !== 'object') return null
  const idType = String(person.idType ?? '').trim().toLowerCase()
  const gender = String(person.gender ?? '').trim().toLowerCase()
  return {
    customerName: person.fullName ?? '',
    idType: UNIT_ASSIGNMENT_PERSON_ID_TYPES[idType] ?? 0,
    idNum: person.idNumber ?? '',
    nationalityId: Number(person.nationality) || 0,
    birthDate: person.birthDate,
    genderId: UNIT_ASSIGNMENT_PERSON_GENDERS[gender] ?? 0,
    job: person.profession ?? '',
  }
}

/**
 * Save one assignment unit row + its persons in one DoMultiTransaction.
 * UnitAssignmentUnits_Id is set to 0 in persons rows so backend can link to the inserted unit row.
 */
export const saveUnitAssignmentRowMulti = async ({
  unitAssignmentId = 0,
  unit = {},
  persons = [],
  wantedAction = 0,
} = {}) => {
  const assignmentId = Number(unitAssignmentId) || 0
  const hotelUnitId = Number(unit?.hotelUnitId) || 0
  if (!assignmentId) {
    return { success: false, errorMessage: 'Invalid UnitAssignment_Id', MultiIdinties: null }
  }
  if (!hotelUnitId) {
    return { success: false, errorMessage: 'Hotel unit is required', MultiIdinties: null }
  }

  const unitCols = buildUnitAssignmentUnitColumnsValues({
    unitAssignmentId: assignmentId,
    hotelUnitId,
    unitAddFeatureId: Number(unit?.unitAddFeatureId) || 0,
    personsCountPerUnit: Number(unit?.personsCountPerUnit) || 0,
    fromDate: unit?.fromDate,
    toDate: unit?.toDate,
    unitPricePerNight: Number(unit?.unitPricePerNight) || 0,
    totalNightsCount: Number(unit?.totalNightsCount) || 0,
    totalPricce: Number(unit?.totalPricce) || 0,
  })

  const normalizedPersons = (Array.isArray(persons) ? persons : [])
    .map((p) => normalizeUnitAssignmentPerson(p))
    .filter(Boolean)

  const personCols = normalizedPersons.map((p) =>
    buildUnitAssignmentPersonColumnsValues({
      unitAssignmentUnitsId: 0,
      customerName: p.customerName,
      idType: p.idType,
      idNum: p.idNum,
      nationalityId: p.nationalityId,
      birthDate: p.birthDate,
      genderId: p.genderId,
      job: p.job,
    })
  )

  const multiTableName = joinMultiSegments([
    UNIT_ASSIGNMENT_UNITS_TABLE_NAME,
    ...personCols.map(() => UNIT_ASSIGNMENT_PERSONS_TABLE_NAME),
  ])
  const multiColumnsValues = joinMultiSegments([unitCols, ...personCols])

  console.group('[Allocation][UnitAssignment][RowMulti] Request')
  console.log('UnitAssignment_Id:', assignmentId)
  console.log('Unit payload:', unit)
  console.log('Persons payload:', normalizedPersons)
  console.log('MultiTableName:', multiTableName)
  console.log('MultiColumnsValues:', multiColumnsValues)
  console.groupEnd()

  const res = await DoMultiTransaction(multiTableName, multiColumnsValues, wantedAction)
  return {
    ...res,
    unitAssignmentUnitId: parseFirstMultiId(res?.MultiIdinties),
  }
}

function buildReservationUnitColumnsValues({
  id = 0,
  reservationId = 0,
  unitNameId = 0,
  unitAddFeatureId = 0,
  personsCountPerUnit = 0,
  unitsCount = 0,
  unitPricePerNight = 0,
  totalNightsCount = 0,
  totalPrice = 0,
  fromDate = '',
  toDate = '',
  hotelId = RESERVATION_HOTEL_ID,
}) {
  return [
    Number(id) || 0,
    Number(reservationId) || 0,
    Number(unitNameId) || 0,
    Number(unitAddFeatureId) || 0,
    Number(personsCountPerUnit) || 0,
    Number(unitsCount) || 0,
    Number(unitPricePerNight) || 0,
    Number(totalNightsCount) || 0,
    Number(totalPrice) || 0,
    String(fromDate ?? '').trim(),
    String(toDate ?? '').trim(),
    Number(hotelId) || RESERVATION_HOTEL_ID,
  ].join('#')
}

function stayRowNightlyRate(row) {
  const combined = parseAmount(row?.unitPrice)
  if (combined > 0) return combined
  const unitOnly = parseAmount(row?.unitBasePrice ?? row?.unitPrice)
  const service = parseAmount(row?.servicePrice)
  return unitOnly + service
}

function stayRowToUnitColumnsValues(row, reservationId) {
  const adults = Number(row?.adults) || 0
  const children = Number(row?.children) || 0
  return buildReservationUnitColumnsValues({
    reservationId,
    unitNameId: Number(row?.unitType) || 0,
    unitAddFeatureId: Number(row?.serviceId) || 0,
    personsCountPerUnit: adults + children,
    unitsCount: Number(row?.unitsCount) || 1,
    unitPricePerNight: stayRowNightlyRate(row),
    totalNightsCount: computeNightsCount(row?.arrivalDate, row?.departureDate),
    totalPrice: Number(row?.total) || 0,
    fromDate: formatDisplayDate(toInputDateValue(row?.arrivalDate)),
    toDate: formatDisplayDate(toInputDateValue(row?.departureDate)),
    hotelId: RESERVATION_HOTEL_ID,
  })
}

/** DoMultiTransaction segments: part1^part2^part3 (^ separator only, none after last). */
function joinMultiSegments(parts = []) {
  if (!Array.isArray(parts) || parts.length === 0) return ''
  return parts.join('^')
}

/**
 * Reservation + units in one DoMultiTransaction:
 * MultiTableName: reservation^unit^unit^…
 * MultiColumnsValues: res#cols^unit#cols^…
 * Unit rows use Reservation_Id 0; server links to the inserted reservation.
 */
export function buildReservationBookingMultiPayload({
  reservation = {},
  stayRows = [],
} = {}) {
  const rows = Array.isArray(stayRows) ? stayRows : []
  const reservationCols = buildReservationColumnsValues(reservation)
  const unitCols = rows.map((row) => stayRowToUnitColumnsValues(row, 0))
  const tableParts = [RESERVATION_TABLE_NAME, ...rows.map(() => RESERVATION_UNIT_TABLE_NAME)]
  const valueParts = [reservationCols, ...unitCols]
  const multiTableName = joinMultiSegments(tableParts)
  const multiColumnsValues = joinMultiSegments(valueParts)

  return { multiTableName, multiColumnsValues }
}

export const saveReservationBookingMulti = async ({
  reservation = {},
  stayRows = [],
  wantedAction = 0,
}) => {
  const { multiTableName, multiColumnsValues } = buildReservationBookingMultiPayload({
    reservation,
    stayRows,
  })
  if (!multiTableName || !multiColumnsValues) {
    return {
      success: false,
      errorMessage: 'No reservation data to save',
      MultiIdinties: null,
    }
  }

  return DoMultiTransaction(multiTableName, multiColumnsValues, wantedAction)
}

/** Build DoMultiTransaction payload: table^table^… and row#cols^row#cols^… */
export function buildReservationUnitsMultiPayload(stayRows = [], reservationId) {
  const rows = Array.isArray(stayRows) ? stayRows : []
  const resId = Number(reservationId) || 0
  if (!rows.length || !resId) {
    return { multiTableName: '', multiColumnsValues: '' }
  }

  const rowValues = rows.map((row) => stayRowToUnitColumnsValues(row, resId))
  const multiTableName = joinMultiSegments(rows.map(() => RESERVATION_UNIT_TABLE_NAME))
  const multiColumnsValues = joinMultiSegments(rowValues)

  return { multiTableName, multiColumnsValues }
}

export const saveReservationUnitsMulti = async ({
  stayRows = [],
  reservationId = 0,
  wantedAction = 0,
}) => {
  const { multiTableName, multiColumnsValues } = buildReservationUnitsMultiPayload(
    stayRows,
    reservationId
  )
  if (!multiTableName || !multiColumnsValues) {
    return {
      success: false,
      errorMessage: 'No reservation units to save',
      MultiIdinties: null,
    }
  }

  return DoMultiTransaction(multiTableName, multiColumnsValues, wantedAction)
}

export const saveReservationUnit = async ({
  id = 0,
  reservationId = 0,
  unitNameId = 0,
  unitAddFeatureId = 0,
  personsCountPerUnit = 0,
  unitsCount = 0,
  unitPricePerNight = 0,
  totalNightsCount = 0,
  totalPrice = 0,
  fromDate = '',
  toDate = '',
  hotelId = RESERVATION_HOTEL_ID,
  wantedAction = 0,
}) => {
  const multiTableName = joinMultiSegments([RESERVATION_UNIT_TABLE_NAME])
  const multiColumnsValues = joinMultiSegments([
    buildReservationUnitColumnsValues({
      id,
      reservationId,
      unitNameId,
      unitAddFeatureId,
      personsCountPerUnit,
      unitsCount,
      unitPricePerNight,
      totalNightsCount,
      totalPrice,
      fromDate,
      toDate,
      hotelId,
    }),
  ])

  return DoMultiTransaction(multiTableName, multiColumnsValues, wantedAction)
}

export async function saveReservationUnitsFromStayRows(stayRows = [], reservationId) {
  const resId = Number(reservationId) || 0
  if (!resId) {
    return { success: false, errorMessage: 'Invalid reservation id for units' }
  }
  if (!Array.isArray(stayRows) || stayRows.length === 0) {
    return { success: true, errorMessage: null, multiIdinties: null }
  }

  const unitRes = await saveReservationUnitsMulti({ stayRows, reservationId: resId, wantedAction: 0 })

  if (!isDoTransactionSuccess(unitRes)) {
    return {
      success: false,
      errorMessage:
        unitRes?.errorMessage ?? unitRes?.error ?? 'Failed to save reservation units',
      multiIdinties: unitRes?.MultiIdinties ?? null,
    }
  }

  return {
    success: true,
    errorMessage: null,
    multiIdinties: unitRes?.MultiIdinties ?? null,
  }
}

export async function saveReservationFromBooking({
  form,
  bookingType,
  selectedPartyId,
  stayRows,
  stayGrandTotal,
  downPayment,
  idFile = null,
}) {
  const isCompanies = bookingType === 'companies'
  let agentId = 0
  let customerId = 0

  if (isCompanies) {
    agentId = Number(selectedPartyId) || 0
  } else if (Number(selectedPartyId)) {
    customerId = Number(selectedPartyId)
  } else {
    const custRes = await saveCustomerFromForm(form, { idFile, wantedAction: 0 })
    if (!custRes.success) {
      return {
        success: false,
        errorMessage: custRes.errorMessage ?? 'Failed to save customer',
        newId: null,
      }
    }
    customerId = Number(custRes.newId) || 0
    if (!customerId) {
      return {
        success: false,
        errorMessage: 'Customer saved but no Id returned',
        newId: null,
      }
    }
  }

  const stay = aggregateStayRows(stayRows)
  const total = Number(stayGrandTotal) || 0
  const down = parseAmount(downPayment)

  const multiRes = await saveReservationBookingMulti({
    reservation: {
      hotelId: RESERVATION_HOTEL_ID,
      reservationNum: form.bookingNumber,
      reservationDate: formatDisplayDate(toInputDateValue(form.bookingDate)),
      reservationTypeId: Number(form.reservationTypeId) || 0,
      agentId,
      customerId,
      fromDate: formatDisplayDate(stay.fromDate),
      toDate: formatDisplayDate(stay.toDate),
      personsCount: stay.personsCount,
      adultsCount: stay.adultsCount,
      childrenCount: stay.childrenCount,
      roomsCount: stay.roomsCount,
      totalReservationAmount: total,
      downPayment: down,
      status: '1',
      statusRemarks: '',
      isApproved: false,
      approvedDate: 'default',
      approvedBy: 0,
    },
    stayRows,
    wantedAction: 0,
  })

  if (!isDoTransactionSuccess(multiRes)) {
    return {
      success: false,
      errorMessage:
        multiRes?.errorMessage ?? multiRes?.error ?? 'Failed to save reservation',
      newId: parseFirstMultiId(multiRes?.MultiIdinties) || null,
    }
  }

  const reservationId = parseFirstMultiId(multiRes?.MultiIdinties)
  if (!reservationId) {
    return {
      success: false,
      errorMessage: 'Reservation saved but no Id returned',
      newId: null,
    }
  }

  return { success: true, errorMessage: null, newId: reservationId }
}

export {
  RESERVATION_COLUMNS_NAMES,
  RESERVATION_TABLE_NAME,
  RESERVATION_UNIT_COLUMNS_NAMES,
  RESERVATION_UNIT_TABLE_NAME,
}
