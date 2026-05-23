import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'
import { HandelFile } from '../services/HandelFile.js'
import { isDoTransactionSuccess } from './GetAgents.js'
import { EMPLOYEE_HOTEL_ID } from './GetEmployees.js'

export const CUSTOMER_HOTEL_ID = EMPLOYEE_HOTEL_ID

const GET_CUSTOMERS_PROCEDURE = 'ihIfdD5vRL7vZUbbCCBxKAsRdZJZBB0hf3V7Gd52SJ0='

const CUSTOMER_TABLE_NAME = 'DEYAHkEIviEOHk46+hBdWg=='
const CUSTOMER_COLUMNS_NAMES =
  'Id#Hotel_Id#CustomerNameA#CustomerNameE#Email#Mobile#WhatsUp#Nationality_Id#IdNum#IdNum_Attach#PassportNum#PresidenceNum#PassportNum_Attach#PresidenceNum_Attach#Customer_Id#IsBlacklist#Gender_Id'

const GENDER_IDS = { male: 1, female: 2 }

const parseBool = (v, defaultVal = false) => {
  if (v == null) return defaultVal
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase()
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0') return false
  return defaultVal
}

function isUploadOk(res) {
  if (!res) return false
  const s = res.status
  if (s === true || s === 200) return true
  if (typeof s === 'string') {
    const t = s.trim().toLowerCase()
    return t === 'true' || t === '200'
  }
  if (typeof s === 'number' && s === 200) return true
  return false
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

function resolveIdTypeFields(raw) {
  const passport = String(raw.PassportNum ?? raw.passportNum ?? '').trim()
  const presidence = String(raw.PresidenceNum ?? raw.presidenceNum ?? '').trim()
  const idNum = String(raw.IdNum ?? raw.idNum ?? '').trim()

  if (passport) {
    return {
      idType: 'passport',
      idTypeAr: 'جواز',
      idTypeEn: 'Passport',
      idNumber: passport,
      idAttach: String(raw.PassportNum_Attach ?? raw.passportNum_Attach ?? '').trim(),
    }
  }
  if (presidence) {
    return {
      idType: 'residency',
      idTypeAr: 'إقامة',
      idTypeEn: 'Residency',
      idNumber: presidence,
      idAttach: String(raw.PresidenceNum_Attach ?? raw.presidenceNum_Attach ?? '').trim(),
    }
  }
  return {
    idType: 'national_id',
    idTypeAr: 'هوية',
    idTypeEn: 'National ID',
    idNumber: idNum,
    idAttach: String(raw.IdNum_Attach ?? raw.idNum_Attach ?? '').trim(),
  }
}

/** Normalize Hotel_GetCustomers row for UI. */
export function normalizeCustomerRow(raw) {
  if (!raw || typeof raw !== 'object') return null

  const nameEnRaw = raw.CustomerNameE ?? raw.customerNameE ?? ''
  const idFields = resolveIdTypeFields(raw)
  const genderId = Number(raw.Gender_Id ?? raw.gender_Id ?? 0)
  const bookingsCount = Number(
    raw.BookingsCount ?? raw.bookingsCount ?? raw.BookingCount ?? raw.bookingCount ?? 0
  )

  let lastVisitRaw =
    raw.LastVisit ?? raw.lastVisit ?? raw.LastVisitDate ?? raw.lastVisitDate ?? ''
  if (lastVisitRaw && typeof lastVisitRaw === 'object') {
    lastVisitRaw = String(lastVisitRaw)
  }

  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    hotelId: Number(raw.Hotel_Id ?? raw.hotel_Id ?? CUSTOMER_HOTEL_ID),
    nameAr: raw.CustomerNameA ?? raw.customerNameA ?? '',
    nameEn: String(nameEnRaw).trim() ? String(nameEnRaw).toUpperCase() : '',
    email: raw.Email ?? raw.email ?? '',
    mobile: raw.Mobile ?? raw.mobile ?? '',
    whatsUp: raw.WhatsUp ?? raw.whatsUp ?? '',
    nationalityId: Number(raw.Nationality_Id ?? raw.nationality_Id ?? 0),
    nationalityNameAr: raw.NationalityNameA ?? raw.nationalityNameA ?? '',
    nationalityNameEn: String(raw.NationalityNameE ?? raw.nationalityNameE ?? '').trim()
      ? String(raw.NationalityNameE ?? raw.nationalityNameE ?? '').toUpperCase()
      : '',
    genderId,
    genderKey: genderId === GENDER_IDS.female ? 'female' : genderId === GENDER_IDS.male ? 'male' : '',
    customerParentId: Number(raw.Customer_Id ?? raw.customer_Id ?? 0),
    isBlacklist: parseBool(raw.IsBlacklist ?? raw.isBlacklist, false),
    bookingsCount,
    lastVisitRaw: lastVisitRaw ? String(lastVisitRaw) : '',
    isCurrentGuest: parseBool(
      raw.IsCurrentGuest ?? raw.isCurrentGuest ?? raw.InHotel ?? raw.inHotel,
      false
    ),
    isLocal: parseBool(raw.IsLocal ?? raw.isLocal ?? raw.IsLocalCustomer ?? raw.isLocalCustomer, false),
    ...idFields,
  }
}

export function mapCustomerToTableRow(row, isArabic) {
  if (!row) return null
  const status =
    row.bookingsCount > 1 || row.customerParentId > 0 ? 'repeat' : 'new'

  return {
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    email: row.email,
    idTypeAr: row.idTypeAr,
    idTypeEn: row.idTypeEn,
    idNumber: row.idNumber,
    idImageAttach: row.idAttach,
    whatsappPhone: row.whatsUp,
    localPhone: row.mobile,
    nationalityAr: row.nationalityNameAr,
    nationalityEn: row.nationalityNameEn,
    bookingsCount: row.bookingsCount,
    lastVisitAr: row.lastVisitRaw,
    lastVisitEn: row.lastVisitRaw,
    status,
    isLocal: row.isLocal,
    isCurrentGuest: row.isCurrentGuest,
    isBlacklist: row.isBlacklist,
  }
}

function parseCustomerListPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { rows: [], total: 0 }
  }

  const keys = Object.keys(payload)
  let dataRaw =
    payload.CustomerData ??
    payload.CustomersData ??
    payload.customerData ??
    payload.Data ??
    payload.data

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /data$/i.test(k) && k.length > 4)
    if (dataKey) dataRaw = payload[dataKey]
  }

  let countRaw =
    payload.CustomerCount ??
    payload.CustomersCount ??
    payload.customerCount ??
    payload.Count ??
    payload.count

  if (countRaw == null) {
    const countKey = keys.find((k) => /count$/i.test(k))
    if (countKey) countRaw = payload[countKey]
  }

  const list = parseJsonList(dataRaw)
  const total = Number(countRaw ?? list.length ?? 0)
  const rows = list.map((item) => normalizeCustomerRow(item)).filter(Boolean)
  return { rows, total }
}

/**
 * Hotel_GetCustomers — @id#@hotel_id#@Nationality_id#@gender_id#@value#@StartNum#@Count#@encrypt
 */
export const fetchCustomersPage = async ({
  id = -1,
  hotelId = CUSTOMER_HOTEL_ID,
  nationalityId = -1,
  genderId = -1,
  searchText = '',
  startNum = 1,
  count = 10,
} = {}) => {
  try {
    const cid = Number(id)
    const normalizedId = Number.isFinite(cid) ? cid : -1
    const hid = Number(hotelId) || CUSTOMER_HOTEL_ID
    const natRaw = Number(nationalityId)
    const nat = Number.isFinite(natRaw) ? natRaw : -1
    const genRaw = Number(genderId)
    const gen = Number.isFinite(genRaw) ? genRaw : -1
    const start = Math.max(1, Number(startNum) || 1)
    const cnt = Math.max(1, Number(count) || 10)

    const params = `${normalizedId}#${hid}#${nat}#${gen}#${searchText ?? ''}#${start}#${cnt}#$????`
    const response = await executeProcedure(GET_CUSTOMERS_PROCEDURE, params)

    if (!response?.success) {
      return { rows: [], total: 0, error: response?.error }
    }

    return parseCustomerListPayload(response.decrypted ?? {})
  } catch (e) {
    return { rows: [], total: 0, error: e?.message ?? String(e) }
  }
}

export const getCustomerDetails = async (customerId) => {
  const id = Number(customerId) || 0
  if (!id) return { success: false, customer: null, error: 'Invalid customer id' }

  const { rows, error } = await fetchCustomersPage({ id, startNum: 1, count: 1 })
  if (error) {
    return { success: false, customer: null, error }
  }

  const customer = rows?.[0] ?? null
  if (!customer) {
    return { success: false, customer: null, error: 'Customer not found' }
  }

  return { success: true, customer, error: null }
}

export function computeCustomerStats(rows = [], total = 0) {
  return {
    total: total || rows.length,
    local: rows.filter((r) => r.isLocal).length,
    currentGuests: rows.filter((r) => r.isCurrentGuest).length,
    repeat: rows.filter((r) => (r.bookingsCount ?? 0) > 1 || (r.customerParentId ?? 0) > 0).length,
  }
}

const boolStr = (v) => (v ? 'True' : 'False')

function buildIdColumns(idType, idNumber, idNumAttach, passportAttach, presidenceAttach) {
  const type = idType || 'national_id'
  const num = String(idNumber ?? '').trim()

  return {
    idNum: type === 'national_id' ? num : '',
    idNumAttach: type === 'national_id' ? idNumAttach : '',
    passportNum: type === 'passport' ? num : '',
    passportNumAttach: type === 'passport' ? passportAttach : '',
    presidenceNum: type === 'residency' ? num : '',
    presidenceNumAttach: type === 'residency' ? presidenceAttach : '',
  }
}

export async function uploadCustomerIdFile(file) {
  if (!file || !(file instanceof File) || file.size <= 0) {
    return { success: false, fileId: '', error: 'No file' }
  }
  const hf = new HandelFile()
  const uploadRes = await hf.UploadFileWebSite({ action: 'Add', file, fileId: '' })
  const fid = uploadRes?.id != null ? String(uploadRes.id).trim() : ''
  if (!isUploadOk(uploadRes) || !fid) {
    return {
      success: false,
      fileId: '',
      error: uploadRes?.error != null ? String(uploadRes.error) : 'Upload failed',
    }
  }
  return { success: true, fileId: fid, error: null }
}

export const saveCustomer = async ({
  id = 0,
  hotelId = CUSTOMER_HOTEL_ID,
  customerNameA = '',
  customerNameE = '',
  email = '',
  mobile = '',
  whatsUp = '',
  nationalityId = 0,
  idType = 'national_id',
  idNumber = '',
  idNumAttach = '',
  passportNum = '',
  presidenceNum = '',
  passportNumAttach = '',
  presidenceNumAttach = '',
  customerParentId = 0,
  isBlacklist = false,
  genderId = 0,
  wantedAction = 0,
}) => {
  const idCols = buildIdColumns(
    idType,
    idNumber,
    idNumAttach,
    passportNumAttach,
    presidenceNumAttach
  )

  const columnsValues = [
    Number(id) || 0,
    Number(hotelId) || CUSTOMER_HOTEL_ID,
    String(customerNameA ?? '').trim(),
    String(customerNameE ?? '').trim().toUpperCase(),
    String(email ?? '').trim(),
    String(mobile ?? '').trim(),
    String(whatsUp ?? '').trim(),
    Number(nationalityId) || 0,
    idCols.idNum,
    String(idCols.idNumAttach ?? '').trim(),
    idCols.passportNum,
    idCols.presidenceNum,
    String(idCols.passportNumAttach ?? '').trim(),
    String(idCols.presidenceNumAttach ?? '').trim(),
    Number(customerParentId) || 0,
    boolStr(isBlacklist),
    Number(genderId) || 0,
  ].join('#')

  return DoTransaction(CUSTOMER_TABLE_NAME, columnsValues, wantedAction, CUSTOMER_COLUMNS_NAMES)
}

export async function saveCustomerFromForm(form, { id = 0, idFile = null, wantedAction = 0 } = {}) {
  let idNumAttach = ''
  let passportNumAttach = ''
  let presidenceNumAttach = ''

  if (idFile && idFile instanceof File) {
    const up = await uploadCustomerIdFile(idFile)
    if (!up.success) {
      return { success: false, errorMessage: up.error ?? 'ID upload failed' }
    }
    if (form.idType === 'passport') passportNumAttach = up.fileId
    else if (form.idType === 'residency') presidenceNumAttach = up.fileId
    else idNumAttach = up.fileId
  }

  const genderId = GENDER_IDS[form.gender] ?? 0
  const nameA = String(form.fullName ?? '').trim()
  const nameE = nameA.toUpperCase()

  const res = await saveCustomer({
    id,
    customerNameA: nameA,
    customerNameE: nameE,
    email: form.email ?? '',
    mobile: form.localPhone ?? '',
    whatsUp: form.whatsappPhone ?? '',
    nationalityId: Number(form.nationality) || 0,
    idType: form.idType || 'national_id',
    idNumber: form.idNumber ?? '',
    idNumAttach,
    passportNumAttach,
    presidenceNumAttach,
    isBlacklist: false,
    genderId,
    wantedAction,
  })

  if (!isDoTransactionSuccess(res)) {
    return {
      success: false,
      errorMessage: res?.errorMessage ?? res?.error ?? 'Save failed',
      newId: res?.NewId,
    }
  }

  return { success: true, errorMessage: null, newId: res?.NewId }
}

export const deleteCustomer = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid customer id' }
  }
  return DoTransaction(CUSTOMER_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

/** Pull-all hook for existing-customer dropdowns */
const useCustomersSimple = (startNum = 1, count = 5000) => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const { rows, total, error: fetchError } = await fetchCustomersPage({
          startNum,
          count,
        })
        if (cancelled) return
        if (fetchError) {
          setError(fetchError)
          setCustomers([])
          setTotalCount(0)
          return
        }
        setCustomers(rows ?? [])
        setTotalCount(total ?? 0)
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setCustomers([])
          setTotalCount(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [startNum, count])

  return { customers, totalCount, loading, error }
}

export default useCustomersSimple

export {
  CUSTOMER_COLUMNS_NAMES,
  CUSTOMER_TABLE_NAME,
  GENDER_IDS,
}
