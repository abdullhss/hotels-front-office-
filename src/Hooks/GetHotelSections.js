import { DoTransaction, executeProcedure } from '../services/apiServices'
import { getAuthHotelId, resolveHotelId } from '../utils/authStorage.js'

const GET_HOTEL_SECTION_PROCEDURE = 'VIlduaKaE0vwmEySXFdvMF1wxBx4LhVoxJOcW/7DAf8='

const HOTEL_SECTION_TABLE_NAME = 'NarFh0MTDf1uTqzL/ozUsA=='
const HOTEL_SECTION_COLUMNS_NAMES = 'Id#Hotel_Id#SectionNameA#SectionNameE#Manager_Id#Role_Id'

export function normalizeHotelSectionRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const nameEnRaw = raw.SectionNameE ?? raw.sectionNameE ?? ''
  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    hotelId: Number(raw.Hotel_Id ?? raw.hotel_Id ?? getAuthHotelId()),
    nameAr: raw.SectionNameA ?? raw.sectionNameA ?? '',
    nameEn: String(nameEnRaw).trim() ? String(nameEnRaw).toUpperCase() : '',
    managerId: Number(raw.Manager_Id ?? raw.manager_Id ?? 0),
    roleId: Number(raw.Role_Id ?? raw.role_Id ?? 0),
  }
}

function parseHotelSectionListPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { rows: [], total: 0 }
  }

  const keys = Object.keys(payload)
  let dataRaw =
    payload.HotelSectionData ??
    payload.HotelSectionsData ??
    payload.SectionData ??
    payload.SectionsData ??
    payload.sectionData ??
    payload.Data ??
    payload.data

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /data$/i.test(k) && k.length > 4)
    if (dataKey) dataRaw = payload[dataKey]
  }

  let countRaw =
    payload.HotelSectionCount ??
    payload.HotelSectionsCount ??
    payload.SectionCount ??
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
  const rows = list.map((item) => normalizeHotelSectionRow(item)).filter(Boolean)
  return { rows, total }
}

/**
 * ParametersValues: id#Hotel_id#value#StartNum#Count
 * Use id = -1 to list by hotel + search (common pattern).
 */
export const fetchHotelSectionsPage = async (sectionIdFilter, hotelId, searchText, startNum, count) => {
  try {
    const hid = resolveHotelId(hotelId)
    const sid = Number(sectionIdFilter)
    const idParam = Number.isFinite(sid) ? sid : -1
    const params = `${idParam}#${hid}#${searchText ?? ''}#${startNum}#${count}`

    const response = await executeProcedure(GET_HOTEL_SECTION_PROCEDURE, params)

    if (!response?.success) {
      return { rows: [], total: 0, error: response?.error }
    }
    return parseHotelSectionListPayload(response.decrypted ?? {})
  } catch (e) {
    return { rows: [], total: 0, error: e?.message ?? String(e) }
  }
}

export const saveHotelSection = async ({
  id = 0,
  hotelId = getAuthHotelId(),
  sectionNameA = '',
  sectionNameE = '',
  managerId = 0,
  roleId = 0,
  wantedAction = 0,
}) => {
  const columnsValues = [
    Number(id) || 0,
    resolveHotelId(hotelId),
    sectionNameA.trim(),
    sectionNameE.trim().toUpperCase(),
    Number(managerId) || 0,
    Number(roleId) || 0,
  ].join('#')

  return DoTransaction(HOTEL_SECTION_TABLE_NAME, columnsValues, wantedAction, HOTEL_SECTION_COLUMNS_NAMES)
}

export const deleteHotelSection = async (sectionId) => {
  const normalizedId = Number(sectionId) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid section id' }
  }
  return DoTransaction(HOTEL_SECTION_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

export { HOTEL_SECTION_COLUMNS_NAMES, HOTEL_SECTION_TABLE_NAME }
