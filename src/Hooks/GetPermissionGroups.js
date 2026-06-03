import { DoTransaction, executeProcedure } from '../services/apiServices'
import { getAuthHotelId, resolveHotelId } from '../utils/authStorage.js'

const GET_GROUP_PERMISSION_DETAILS_PROCEDURE = 'rek2ydFmPKA2UVKCFHRxXwXAWiCRjiJsMw26Iz1jfJo='
const GET_HOTEL_GROUP_PROCEDURE = 'EHxewRDc1hdah34/BYd88H8JoIa0Dd0JEVG/Co1BAx8='
const GET_ROLES_PROCEDURE = 'vkviluKUW0awc++QVlGtQQ=='
const HOTEL_GROUP_TABLE_NAME = 'lolGTk7UHPQv08Nx4CTolQ=='
const HOTEL_GROUP_COLUMNS_NAMES = 'Id#Hotel_Id#HotelSection_Id#GroupNameA#GroupNameE#IsActive'

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

function firstExisting(obj, keys) {
  if (!obj || typeof obj !== 'object') return null
  for (const key of keys) {
    if (obj[key] != null) return obj[key]
  }
  return null
}

export function normalizePermissionGroupRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const nameAr = String(
    raw.GroupNameA ?? raw.PermissionGroupNameA ?? raw.NameA ?? raw.nameAr ?? ''
  ).trim()
  const nameEnRaw = String(
    raw.GroupNameE ?? raw.PermissionGroupNameE ?? raw.NameE ?? raw.nameEn ?? ''
  ).trim()
  return {
    id: Number(raw.Id ?? raw.Group_Id ?? raw.groupId ?? raw.id ?? 0),
    hotelRoleId: Number(raw.HotelRoleId ?? raw.RoleId ?? raw.roleId ?? 0),
    nameAr,
    nameEn: nameEnRaw ? nameEnRaw.toUpperCase() : '',
  }
}

function parseGroupListPayload(payload) {
  if (!payload || typeof payload !== 'object') return []

  const keys = Object.keys(payload)
  let dataRaw = firstExisting(payload, [
    'GroupPermissionsData',
    'GroupPermissionData',
    'PermissionGroupsData',
    'PermissionGroupData',
    'GroupsData',
    'Data',
    'data',
  ])

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /data$/i.test(k) && k.length > 4)
    if (dataKey) dataRaw = payload[dataKey]
  }

  let list = []
  if (typeof dataRaw === 'string') {
    const parsed = parseJsonMaybe(dataRaw)
    list = Array.isArray(parsed) ? parsed : []
  } else if (Array.isArray(dataRaw)) {
    list = dataRaw
  }

  return list.map((item) => normalizePermissionGroupRow(item)).filter(Boolean)
}

function parseHotelGroupListPayload(payload) {
  if (!payload || typeof payload !== 'object') return []

  const keys = Object.keys(payload)
  let dataRaw = firstExisting(payload, ['HotelGroupData', 'GroupData', 'Data', 'data'])

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /data$/i.test(k) && k.length > 4)
    if (dataKey) dataRaw = payload[dataKey]
  }

  let list = []
  if (typeof dataRaw === 'string') {
    const parsed = parseJsonMaybe(dataRaw)
    list = Array.isArray(parsed) ? parsed : []
  } else if (Array.isArray(dataRaw)) {
    list = dataRaw
  }

  return list.map((item) => normalizePermissionGroupRow(item)).filter(Boolean)
}

/**
 * ProcedureName: rek2ydFmPKA2UVKCFHRxXwXAWiCRjiJsMw26Iz1jfJo=
 * ParametersValues: group_Id#Hotel_id
 */
export async function fetchGroupPermissionDetails(groupId, hotelId = getAuthHotelId()) {
  const gid = Number(groupId)
  const hid = resolveHotelId(hotelId)
  const idParam = Number.isFinite(gid) ? gid : 0
  const params = `${idParam}#${hid}`

  try {
    const response = await executeProcedure(GET_GROUP_PERMISSION_DETAILS_PROCEDURE, params)
    if (!response?.success) {
      return { success: false, detail: null, groups: [], error: response?.error ?? 'Request failed' }
    }
    

    const payload = response.decrypted ?? {}
    const groups = parseGroupListPayload(payload)

    let detail = parseJsonMaybe(
      firstExisting(payload, ['PermissionDetailsData'])
    )
    if (Array.isArray(detail)) detail = detail[0] ?? null
    if (!detail || typeof detail !== 'object') {
      const hit = groups.find((g) => Number(g.id) === idParam)
      detail = hit ?? null
    }

    return { success: true, detail, groups, error: null, raw: payload }
  } catch (e) {
    return { success: false, detail: null, groups: [], error: e?.message ?? String(e) }
  }
}

/**
 * Attempts to load all permission groups by calling details proc with group_Id = -1.
 * Falls back to empty list if backend does not support list mode.
 */
export async function fetchPermissionGroups(hotelId = getAuthHotelId()) {
  const hid = resolveHotelId(hotelId)
  const params = `-1#${hid}#-1#1#1000`

  try {
    const response = await executeProcedure(GET_HOTEL_GROUP_PROCEDURE, params)
    if (!response?.success) {
      return { success: false, rows: [], error: response?.error ?? 'Request failed' }
    }

    const payload = response.decrypted ?? {}
    const rows = parseHotelGroupListPayload(payload)
    return { success: true, rows, error: null }
  } catch (e) {
    return { success: false, rows: [], error: e?.message ?? String(e) }
  }
}

export async function savePermissionGroup({
  id = 0,
  hotelId = getAuthHotelId(),
  hotelRoleId = 0,
  nameAr = '',
  nameEn = '',
  isActive = true,
  wantedAction = 0,
}) {
  const normalizedId = Number(id) || 0
  const normalizedHotelId = resolveHotelId(hotelId)
  const normalizedRoleId = Number(hotelRoleId) || 0
  const activeValue = isActive ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${normalizedHotelId}#${normalizedRoleId}#${String(nameAr)
    .trim()}#${String(nameEn)
    .trim()
    .toUpperCase()}#${activeValue}`

  return DoTransaction(HOTEL_GROUP_TABLE_NAME, columnsValues, wantedAction, HOTEL_GROUP_COLUMNS_NAMES)
}

export async function deletePermissionGroup(id) {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid group id' }
  }
  return DoTransaction(HOTEL_GROUP_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

export async function fetchPermissionRoles() {
  try {
    const response = await executeProcedure(GET_ROLES_PROCEDURE, '')
    if (!response?.success) {
      return { success: false, rows: [], error: response?.error ?? 'Request failed' }
    }

    const payload = response.decrypted ?? {}
    const rawRoles = parseJsonMaybe(payload.RoleData)
    const rows = Array.isArray(rawRoles)
      ? rawRoles
          .map((role) => ({
            id: Number(role?.id ?? role?.Id ?? 0),
            name: String(role?.name ?? role?.Name ?? '').trim(),
          }))
          .filter((role) => role.id > 0 && role.name)
      : []

    return { success: true, rows, error: null }
  } catch (e) {
    return { success: false, rows: [], error: e?.message ?? String(e) }
  }
}

