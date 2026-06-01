import { DoTransaction, executeProcedure } from '../services/apiServices'
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

const RESERVATION_TABLE_NAME = '1Xx5r4QVCRAA5fv+CZ63Fg=='
const RESERVATION_COLUMNS_NAMES =
  'Id#Hotel_Id#ReservationNum#ReservationDate#ReservationType_Id#Agent_Id#Customer_Id#FromDate#ToDate#PersonsCount#AudultsCount#ChildrenCount#RoomsCount#TotalReservationAmount#DownPayment#Status#StatusRemarks#IsApproved#ApprovedDate#ApprovedBy'

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
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '[]') return []
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
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

export function filterReservationsByStat(rows, statKey) {
  if (!Array.isArray(rows)) return []
  if (statKey === 'confirmed') return rows.filter((r) => r.isApproved)
  if (statKey === 'pending') return rows.filter((r) => !r.isApproved)
  return rows
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
  const columnsValues = [
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

  return DoTransaction(
    RESERVATION_TABLE_NAME,
    columnsValues,
    wantedAction,
    RESERVATION_COLUMNS_NAMES
  )
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

  const res = await saveReservation({
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
    wantedAction: 0,
  })

  if (!isDoTransactionSuccess(res)) {
    return {
      success: false,
      errorMessage: res?.errorMessage ?? res?.error ?? 'Reservation save failed',
      newId: res?.NewId,
    }
  }

  return { success: true, errorMessage: null, newId: res?.NewId }
}

export { RESERVATION_COLUMNS_NAMES, RESERVATION_TABLE_NAME }
