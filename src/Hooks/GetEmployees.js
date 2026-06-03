import { DoTransaction, executeProcedure } from '../services/apiServices'
import { getAuthHotelId, resolveHotelId } from '../utils/authStorage.js'

const GET_EMPLOYEE_PROCEDURE = 'kWPTO4yA1SqfGAmtpqSvMiAbPz+cnwJFTJMWIqPD6Ec='
const GET_EMPLOYEE_DETAILS_PROCEDURE = 'kWPTO4yA1SqfGAmtpqSvMg4XtzgX8Qhf8984tAUVIKk='

const EMPLOYEE_TABLE_NAME = 'JpzjWnAp8WjlK4QK760mBw=='
const EMPLOYEE_COLUMNS_NAMES =
  'Id#Hotel_Id#EmployeeNameA#EmployeeNameE#HotelSection_Id#HotelGroup_Id#Email#Mobile#WhatsUp#Nationality_Id#IdNum#IdNum_Attach#PassportNum#PresidenceNum#PassportNum_Attach#PresidenceNum_Attach#IsActive#User_id#JobTitle#LoginName#Password'

const parseBool = (v, defaultVal = false) => {
  if (v == null) return defaultVal
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase()
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0') return false
  return defaultVal
}

export function normalizeEmployeeRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const nameEnRaw = raw.EmployeeNameE ?? raw.employeeNameE ?? ''
  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    hotelId: Number(raw.Hotel_Id ?? raw.hotel_Id ?? getAuthHotelId()),
    nameAr: raw.EmployeeNameA ?? raw.employeeNameA ?? '',
    nameEn: String(nameEnRaw).trim() ? String(nameEnRaw).toUpperCase() : '',
    hotelSectionId: Number(raw.HotelSection_Id ?? raw.hotelSection_Id ?? 0),
    hotelGroupId: Number(raw.HotelGroup_Id ?? raw.hotelGroup_Id ?? 0),
    email: raw.Email ?? raw.email ?? '',
    mobile: raw.Mobile ?? raw.mobile ?? '',
    whatsUp: raw.WhatsUp ?? raw.whatsUp ?? '',
    nationalityId: Number(raw.Nationality_Id ?? raw.nationality_Id ?? 0),
    nationalityNameAr: raw.NationalityNameA ?? raw.nationalityNameA ?? '',
    nationalityNameEn: String(raw.NationalityNameE ?? raw.nationalityNameE ?? '').trim()
      ? String(raw.NationalityNameE ?? raw.nationalityNameE ?? '').toUpperCase()
      : '',
    idNum: raw.IdNum != null ? String(raw.IdNum) : '',
    idNumAttach: raw.IdNum_Attach != null ? String(raw.IdNum_Attach) : '',
    passportNum: raw.PassportNum != null ? String(raw.PassportNum) : '',
    presidenceNum: raw.PresidenceNum != null ? String(raw.PresidenceNum) : '',
    passportNumAttach: raw.PassportNum_Attach != null ? String(raw.PassportNum_Attach) : '',
    presidenceNumAttach: raw.PresidenceNum_Attach != null ? String(raw.PresidenceNum_Attach) : '',
    isActive: parseBool(raw.IsActive ?? raw.isActive, true),
    userId: Number(raw.User_id ?? raw.User_Id ?? raw.user_id ?? 0),
    jobTitle: raw.JobTitle != null ? String(raw.JobTitle) : '',
    loginName: raw.LoginName != null ? String(raw.LoginName) : '',
    password: '',
  }
}

function parseEmployeeListPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { rows: [], total: 0 }
  }

  const keys = Object.keys(payload)
  let dataRaw =
    payload.EmployeeData ??
    payload.EmployeesData ??
    payload.employeeData ??
    payload.Data ??
    payload.data

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /data$/i.test(k) && k.length > 4)
    if (dataKey) dataRaw = payload[dataKey]
  }

  let countRaw =
    payload.EmployeeCount ??
    payload.EmployeesCount ??
    payload.employeeCount ??
    payload.Count ??
    payload.count

  if (countRaw == null) {
    const countKey = keys.find((k) => /count$/i.test(k))
    if (countKey) countRaw = payload[countKey]
  }

  let list = []
  if (typeof dataRaw === 'string') {
    try {
      list = JSON.parse(dataRaw)
    } catch {
      list = []
    }
  } else if (Array.isArray(dataRaw)) {
    list = dataRaw
  }

  const total = Number(countRaw ?? list.length ?? 0)
  const rows = list.map((item) => normalizeEmployeeRow(item)).filter(Boolean)
  return { rows, total }
}

/**
 * Server list: Hotel_Id#HotelSection_Id#Nationality_id#value#StartNum#Count#encrypt
 */
export const fetchEmployeesPage = async (
  hotelId,
  hotelSectionId,
  nationalityId,
  searchText,
  startNum,
  count
) => {
  try {
    const h = resolveHotelId(hotelId)
    const secRaw = Number(hotelSectionId)
    const sec = Number.isFinite(secRaw) ? secRaw : -1
    const natRaw = Number(nationalityId)
    const nat = Number.isFinite(natRaw) ? natRaw : -1
    const params = `${h}#${sec}#${nat}#${searchText ?? ''}#${startNum}#${count}#$????`

    const response = await executeProcedure(GET_EMPLOYEE_PROCEDURE, params)

    if (!response?.success) {
      return { rows: [], total: 0, error: response?.error }
    }
    return parseEmployeeListPayload(response.decrypted ?? {})
  } catch (e) {
    return { rows: [], total: 0, error: e?.message ?? String(e) }
  }
}

function parseEmployeeDetailObject(payload, requestedId) {
  let raw =
    payload.EmployeeDetails ??
    payload.employeeDetails ??
    payload.Details ??
    null

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      raw = null
    }
  }

  const dataRaw = payload.EmployeeData ?? payload.employeeData
  let list = []
  if (typeof dataRaw === 'string') {
    try {
      list = JSON.parse(dataRaw)
    } catch {
      list = []
    }
  } else if (Array.isArray(dataRaw)) {
    list = dataRaw
  }

  if (Array.isArray(list) && list.length) {
    const rid = Number(requestedId)
    const hit = list.find((item) => Number(item?.id ?? item?.Id ?? 0) === rid)
    raw = hit ?? list[0]
  }

  if (!raw && (payload.Id != null || payload.EmployeeNameA != null)) {
    raw = payload
  }

  return raw && typeof raw === 'object' ? normalizeEmployeeRow(raw) : null
}

/**
 * hotel_id#Employee_id#value#encrypt
 */
export const getEmployeeDetails = async (hotelId, employeeId, value = '') => {
  const hid = resolveHotelId(hotelId)
  const eid = Number(employeeId) || 0
  if (!eid) return { success: false, employee: null, error: 'Invalid employee id' }

  const params = `${hid}#${eid}#${value ?? ''}#$????`
  const response = await executeProcedure(GET_EMPLOYEE_DETAILS_PROCEDURE, params)

  if (!response?.success) {
    return { success: false, employee: null, error: response?.error }
  }

  const p = response.decrypted ?? {}
  const employee = parseEmployeeDetailObject(p, eid)

  if (!employee) {
    return { success: true, employee: null, error: null }
  }
  return { success: true, employee, error: null }
}

const boolStr = (v) => (v ? 'True' : 'False')

export const saveEmployee = async ({
  id = 0,
  hotelId = getAuthHotelId(),
  employeeNameA = '',
  employeeNameE = '',
  hotelSectionId = 0,
  hotelGroupId = 0,
  email = '',
  mobile = '',
  whatsUp = '',
  nationalityId = 0,
  idNum = '',
  idNumAttach = '',
  passportNum = '',
  presidenceNum = '',
  passportNumAttach = '',
  presidenceNumAttach = '',
  isActive = true,
  userId = 0,
  jobTitle = '',
  loginName = '',
  password = '',
  wantedAction = 0,
}) => {
  const columnsValues = [
    Number(id) || 0,
    resolveHotelId(hotelId),
    employeeNameA.trim(),
    employeeNameE.trim().toUpperCase(),
    Number(hotelSectionId) || 0,
    Number(hotelGroupId) || 0,
    email.trim(),
    mobile.trim(),
    whatsUp.trim(),
    Number(nationalityId) || 0,
    idNum.trim(),
    String(idNumAttach ?? '').trim(),
    passportNum.trim(),
    presidenceNum.trim(),
    String(passportNumAttach ?? '').trim(),
    String(presidenceNumAttach ?? '').trim(),
    boolStr(isActive),
    Number(userId) || 0,
    jobTitle.trim(),
    loginName.trim(),
    password,
  ].join('#')

  return DoTransaction(EMPLOYEE_TABLE_NAME, columnsValues, wantedAction, EMPLOYEE_COLUMNS_NAMES)
}

export const deleteEmployee = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid employee id' }
  }
  return DoTransaction(EMPLOYEE_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

export { EMPLOYEE_COLUMNS_NAMES, EMPLOYEE_TABLE_NAME }
