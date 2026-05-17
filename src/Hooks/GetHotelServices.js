import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'
import { HOTEL_PAGE_HOTEL_ID } from './GetHotelData.js'

const GET_HOTEL_SERVICE_PROCEDURE = 'VIlduaKaE0vwmEySXFdvMK1KDrBXgrO6YGOzFDM6Y0Q='
const HOTEL_SERVICE_TABLE_NAME = 'TB/BX4vGh+T7SAUYVXssKQ=='
const HOTEL_SERVICE_COLUMNS_NAMES =
  'Id#ServiceNameA#ServiceNameE#ServiceDescA#ServiceDescE#ServicePrice#imported'

function parseJsonMaybe(value) {
  if (value == null) return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return null
}

function coalesceListFromPayload(payload, dataKeys) {
  if (!payload || typeof payload !== 'object') return []
  for (const key of dataKeys) {
    let v = payload[key]
    if (v == null) continue
    if (typeof v === 'string') {
      const parsed = parseJsonMaybe(v)
      if (Array.isArray(parsed)) return parsed
      continue
    }
    if (Array.isArray(v)) return v
  }
  return []
}

export function normalizeHotelServiceRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.Id ?? raw.id ?? 0)
  const nameAr = String(raw.ServiceNameA ?? raw.serviceNameA ?? '').trim()
  const nameEnRaw = String(raw.ServiceNameE ?? raw.serviceNameE ?? '').trim()
  const descAr = String(raw.ServiceDescA ?? raw.serviceDescA ?? '').trim()
  const descEn = String(raw.ServiceDescE ?? raw.serviceDescE ?? '').trim()
  const basicPrice = Number(raw.ServicePrice ?? raw.servicePrice ?? 0)
  const imported =
    String(raw.imported ?? raw.Imported ?? 'False').toLowerCase() === 'true'
  return {
    id,
    nameAr,
    nameEn: nameEnRaw ? nameEnRaw.toUpperCase() : '',
    descAr,
    descEn: descEn ? descEn.toUpperCase() : '',
    basicPrice: Number.isFinite(basicPrice) && basicPrice >= 0 ? basicPrice : 0,
    imported,
  }
}

function parseHotelServiceListPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { rows: [], total: 0 }
  }

  const keys = Object.keys(payload)
  const dataKeys = [
    'HotelServiceData',
    'HotelServicesData',
    'ServiceData',
    'ServicesData',
    'Data',
    'data',
  ]
  let list = coalesceListFromPayload(payload, dataKeys)

  if (list.length === 0) {
    const dataKey = keys.find((k) => /data$/i.test(k) && k.length > 4)
    if (dataKey) {
      list = coalesceListFromPayload({ x: payload[dataKey] }, ['x'])
    }
  }

  let countRaw =
    payload.HotelServiceCount ??
    payload.HotelServicesCount ??
    payload.ServiceCount ??
    payload.Count ??
    payload.count

  if (countRaw == null) {
    const countKey = keys.find((k) => /count$/i.test(k))
    if (countKey) countRaw = payload[countKey]
  }

  const total = Number(countRaw ?? list.length ?? 0)
  const rows = list.map((item) => normalizeHotelServiceRow(item)).filter(Boolean)
  return { rows, total }
}

/**
 * GetHotelService — ParametersValues: id#Hotel_id#value#StartNum#Count
 */
export const fetchHotelServicesPage = async ({
  hotelId = HOTEL_PAGE_HOTEL_ID,
  id = -1,
  value = '',
  startNum = 1,
  count = 2000,
} = {}) => {
  try {
    const hid = Number(hotelId) || HOTEL_PAGE_HOTEL_ID
    const sid = Number(id)
    const nid = Number.isFinite(sid) ? sid : -1
    const start = Number(startNum) || 1
    const cnt = Number(count) || 2000
    const val = value == null ? '' : String(value)
    const params = `${nid}#${hid}#${val}#${start}#${cnt}`
    const response = await executeProcedure(GET_HOTEL_SERVICE_PROCEDURE, params)
    if (!response?.success) {
      return { rows: [], total: 0, error: response?.error }
    }
    return parseHotelServiceListPayload(response.decrypted ?? {})
  } catch (e) {
    return { rows: [], total: 0, error: e?.message ?? String(e) }
  }
}

export const saveHotelService = async ({
  id = 0,
  serviceNameA = '',
  serviceNameE = '',
  serviceDescA = '',
  serviceDescE = '',
  servicePrice = 0,
  imported = false,
  wantedAction = 0,
}) => {
  const normalizedId = Number(id) || 0
  const normalizedPrice = Number(servicePrice)
  const safePrice = Number.isFinite(normalizedPrice) && normalizedPrice >= 0 ? normalizedPrice : 0
  const normalizedImported = imported === true || imported === 'true' || imported === 'True'
  const importedValue = normalizedImported ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${String(serviceNameA).trim()}#${String(serviceNameE)
    .trim()
    .toUpperCase()}#${String(serviceDescA).trim()}#${String(serviceDescE).trim().toUpperCase()}#${safePrice}#${importedValue}`

  return DoTransaction(
    HOTEL_SERVICE_TABLE_NAME,
    columnsValues,
    wantedAction,
    HOTEL_SERVICE_COLUMNS_NAMES
  )
}

export const deleteHotelService = async (serviceId) => {
  const normalizedId = Number(serviceId) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid service id' }
  }
  return DoTransaction(HOTEL_SERVICE_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

/**
 * Loads hotel services for the current hotel (same hotel id as hotel data page).
 */
const useHotelServices = (
  hotelId = HOTEL_PAGE_HOTEL_ID,
  id = -1,
  value = '',
  startNum = 1,
  count = 2000
) => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const { rows, total, error: fetchErr } = await fetchHotelServicesPage({
          hotelId,
          id,
          value,
          startNum,
          count,
        })
        if (cancelled) return
        setServices(rows)
        setTotalCount(Number(total) || rows.length)
        if (fetchErr) setError(fetchErr)
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setServices([])
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
  }, [hotelId, id, value, startNum, count])

  return { services, totalCount, loading, error }
}

export default useHotelServices

export { HOTEL_SERVICE_COLUMNS_NAMES, HOTEL_SERVICE_TABLE_NAME }
