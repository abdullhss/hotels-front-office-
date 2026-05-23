import { DoTransaction } from '../services/apiServices'
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

const RESERVATION_TABLE_NAME = '1Xx5r4QVCRAA5fv+CZ63Fg=='
const RESERVATION_COLUMNS_NAMES =
  'Id#Hotel_Id#ReservationNum#ReservationDate#ReservationType_Id#Agent_Id#Customer_Id#FromDate#ToDate#PersonsCount#AudultsCount#ChildrenCount#RoomsCount#TotalReservationAmount#DownPayment#Status#StatusRemarks#IsApproved#ApprovedDate#ApprovedBy'

const boolStr = (v) => (v ? 'True' : 'False')

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

  if (!String(form?.status ?? '').trim()) {
    errors.push(m.status ?? (isArabic ? 'الحالة مطلوبة' : 'Status is required'))
  }
  if (!String(form?.statusRemarks ?? '').trim()) {
    errors.push(m.statusRemarks ?? (isArabic ? 'ملاحظات الحالة مطلوبة' : 'Status remarks are required'))
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
}) {
  const isCompanies = bookingType === 'companies'
  let agentId = 0
  let customerId = 0

  if (isCompanies) {
    agentId = Number(selectedPartyId) || 0
  } else if (Number(selectedPartyId)) {
    customerId = Number(selectedPartyId)
  } else {
    const custRes = await saveCustomerFromForm(form, { wantedAction: 0 })
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
    status: form.status,
    statusRemarks: form.statusRemarks,
    isApproved: false,
    approvedDate: 'default',
    approvedBy: 0,
    wantedAction: 0,
  })
  console.log("res", res);
  

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
