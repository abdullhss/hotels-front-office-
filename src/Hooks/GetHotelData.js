import { DoTransaction, executeProcedure } from '../services/apiServices'
import { HandelFile } from '../services/HandelFile.js'
import { isDoTransactionSuccess } from './GetAgents.js'
import { getAuthHotelId, resolveHotelId } from '../utils/authStorage.js'

function isHandelUploadOk(res) {
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

/** Default hotel for `/hotels` integration */
const GET_HOTEL_DETAILS_PROCEDURE = '4DRAEi6rPpD2jIUjBd5oyMjt8IBXQBLuV9tIaKP5oPU='
const GET_HOTEL_FEATURES_PROCEDURE = 'KzoGCaafC5QP7ldZN9RZrr4uTYL6DBoOIjMRfhJWxaU='

const HOTEL_FEATURES_TABLE_NAME = 'rZP0e46GX+c9UaiEIEcvYA=='
const HOTEL_FEATURES_COLUMNS_NAMES = 'Id#Hotel_Id#Feature'

const HOTEL_IMAGES_TABLE_NAME = 'z40Qd4UfEYx2QPWD0iZkWw=='
const HOTEL_IMAGES_COLUMNS_NAMES = 'Id#Hotel_Id#ImageId#ImageDescA#ImageDescE'

const FEATURE_ICON_KEYS = ['chef-hat', 'snowflake', 'washer', 'tv', 'wifi', 'trees']

const parseBool = (v, defaultVal = true) => {
  if (v == null) return defaultVal
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase()
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0') return false
  return defaultVal
}

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

function firstNonEmpty(raw, keys) {
  if (!raw || typeof raw !== 'object') return ''
  for (const k of keys) {
    const v = raw[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

/** Stored in `Feature` as `nameAr|||nameEn` (see saveHotelFeature). */
export function parseHotelFeatureText(feature) {
  const s = String(feature ?? '').trim()
  if (!s) return { nameAr: '', nameEn: '' }
  const sep = '|||'
  if (s.includes(sep)) {
    const idx = s.indexOf(sep)
    const nameAr = s.slice(0, idx).trim()
    const nameEn = s.slice(idx + sep.length).trim().toUpperCase()
    return { nameAr, nameEn }
  }
  return { nameAr: s, nameEn: s }
}

export function normalizeHotelFeatureRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.Id ?? raw.id ?? 0)
  const hotelId = Number(raw.Hotel_Id ?? raw.hotel_Id ?? getAuthHotelId())
  const featureRaw = raw.Feature ?? raw.feature ?? ''
  const { nameAr, nameEn } = parseHotelFeatureText(featureRaw)
  const iconKey = FEATURE_ICON_KEYS[Math.abs(id) % FEATURE_ICON_KEYS.length]
  return { id, hotelId, featureRaw, nameAr, nameEn, iconKey }
}

function normalizeHotelImageRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const directUrl = firstNonEmpty(raw, ['HotelImage', 'hotelImage', 'ImageUrl', 'imageUrl', 'Url', 'url'])
  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    hotelId: Number(raw.Hotel_Id ?? raw.hotel_Id ?? getAuthHotelId()),
    imageId: raw.ImageId != null ? String(raw.ImageId) : String(raw.imageId ?? ''),
    descAr: raw.ImageDescA ?? raw.imageDescA ?? '',
    descEn: raw.ImageDescE ?? raw.imageDescE ?? '',
    imageUrl: directUrl,
  }
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

function parseHotelFeatureListPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { rows: [], total: 0 }
  }

  const keys = Object.keys(payload)
  const dataKeys = [
    'HotelFeatureData',
    'HotelFeaturesData',
    'FeatureData',
    'FeaturesData',
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
    payload.HotelFeatureCount ??
    payload.HotelFeaturesCount ??
    payload.FeatureCount ??
    payload.Count ??
    payload.count

  if (countRaw == null) {
    const countKey = keys.find((k) => /count$/i.test(k))
    if (countKey) countRaw = payload[countKey]
  }

  const total = Number(countRaw ?? list.length ?? 0)
  const rows = list.map((item) => normalizeHotelFeatureRow(item)).filter(Boolean)
  return { rows, total }
}

function extractImageList(detailObj, rootPayload) {
  if (detailObj && Array.isArray(detailObj.HotelImages) && detailObj.HotelImages.length) {
    return detailObj.HotelImages.map((item) => normalizeHotelImageRow(item)).filter(Boolean)
  }
  const sources = [detailObj, rootPayload].filter(Boolean)
  for (const obj of sources) {
    const list = coalesceListFromPayload(obj, [
      'HotelImagesData',
      'HotelImageData',
      'HotelImages',
      'ImagesData',
      'Images',
      'images',
    ])
    if (list.length) return list.map((item) => normalizeHotelImageRow(item)).filter(Boolean)
  }
  return []
}

function extractHotelFeaturesFromDetail(raw) {
  if (!raw || typeof raw !== 'object') return []
  if (Array.isArray(raw.HotelFeatures) && raw.HotelFeatures.length) {
    return raw.HotelFeatures.map((item) => normalizeHotelFeatureRow(item)).filter(Boolean)
  }
  return []
}

/**
 * GetHotelDetails returns `HotelsData`: JSON string of hotel object(s).
 */
function parseHotelsDataRow(root, hotelId) {
  if (!root || typeof root !== 'object') return null
  const hid = resolveHotelId(hotelId)
  const blob = root.HotelsData ?? root.hotelsData
  const parsed = parseJsonMaybe(blob)
  if (parsed == null) return null
  const arr = Array.isArray(parsed) ? parsed : [parsed]
  if (arr.length === 0) return null
  const hit = arr.find((row) => Number(row?.id ?? row?.Id ?? row?.Hotel_Id ?? row?.hotel_Id ?? 0) === hid)
  return hit ?? arr[0]
}

/**
 * Normalize hotel detail object returned by GetHotelDetails (shape may vary).
 */
export function normalizeHotelDetail(raw, rootPayload = {}) {
  if (!raw || typeof raw !== 'object') return null

  const cityNameAr = firstNonEmpty(raw, ['CityNameA', 'cityNameA'])
  const cityNameEn = firstNonEmpty(raw, ['CityNameE', 'cityNameE'])
  const countryNameAr = firstNonEmpty(raw, ['CountryNameA', 'countryNameA'])
  const countryNameEn = firstNonEmpty(raw, ['CountryNameE', 'countryNameE'])

  let nameAr = firstNonEmpty(raw, ['HotelNameA', 'NameA', 'HotelNameAr', 'nameAr', 'nameA'])
  let nameEnRaw = firstNonEmpty(raw, ['HotelNameE', 'NameE', 'HotelNameEn', 'nameEn', 'nameE'])

  if (!nameAr && (cityNameAr || countryNameAr)) {
    nameAr = [cityNameAr, countryNameAr].filter(Boolean).join(' · ')
  }
  if (!nameEnRaw && (cityNameEn || countryNameEn)) {
    nameEnRaw = [cityNameEn, countryNameEn].filter(Boolean).join(', ')
  }

  const starRating = (() => {
    const n = Number(
      raw.HotelStars ?? raw.hotelStars ?? raw.StarRating ?? raw.Stars ?? raw.stars ?? raw.Rating ?? 5
    )
    return Number.isFinite(n) && n > 0 ? Math.min(5, Math.max(1, Math.round(n))) : 5
  })()

  const hotelFeatures = extractHotelFeaturesFromDetail(raw)
  const images = extractImageList(raw, rootPayload)

  return {
    id: Number(raw.Id ?? raw.id ?? raw.Hotel_Id ?? raw.hotel_Id ?? getAuthHotelId()),
    nameAr,
    nameEn: nameEnRaw ? nameEnRaw.toUpperCase() : '',
    cityNameAr,
    cityNameEn: cityNameEn ? cityNameEn.toUpperCase() : '',
    countryNameAr,
    countryNameEn: countryNameEn ? countryNameEn.toUpperCase() : '',
    cityId: Number(raw.City_Id ?? raw.city_Id ?? 0) || 0,
    countryId: Number(raw.Country_Id ?? raw.country_Id ?? 0) || 0,
    descAr: firstNonEmpty(raw, [
      'DescriptionA',
      'DescA',
      'HotelDescriptionA',
      'descriptionA',
      'HotelDescA',
    ]),
    descEn: firstNonEmpty(raw, [
      'DescriptionE',
      'DescE',
      'HotelDescriptionE',
      'descriptionE',
      'HotelDescE',
    ]),
    phone: firstNonEmpty(raw, ['Phone', 'Telephon1', 'Mobile', 'Tel', 'telephone']),
    address: firstNonEmpty(raw, ['Address', 'address', 'HotelAddress']),
    email: firstNonEmpty(raw, ['Email', 'email']),
    webSite: firstNonEmpty(raw, ['WebSite', 'Website', 'webSite', 'website']),
    facebook: firstNonEmpty(raw, ['Facebook', 'facebook']),
    owner: firstNonEmpty(raw, ['Owner', 'owner']),
    latitude: firstNonEmpty(raw, ['Latitude', 'latitude']),
    longitude: firstNonEmpty(raw, ['Longitude', 'longitude']),
    agentIds: raw.Agent_Ids != null ? String(raw.Agent_Ids) : String(raw.agent_Ids ?? ''),
    agentList: Array.isArray(raw.AgentList) ? raw.AgentList : Array.isArray(raw.agentList) ? raw.agentList : [],
    isActive: parseBool(raw.IsActive ?? raw.isActive, true),
    starRating,
    images,
    hotelFeatures,
  }
}

/**
 * GetHotelDetails — ParametersValues: hotel_id#encrypt (`$????` placeholder).
 */
export const fetchHotelDetails = async (hotelId = getAuthHotelId()) => {
  try {
    const hid = resolveHotelId(hotelId)
    const params = `${hid}#$????`
    const response = await executeProcedure(GET_HOTEL_DETAILS_PROCEDURE, params)
    if (!response?.success) {
      return { success: false, detail: null, error: response?.error, raw: null }
    }

    const root = response.decrypted ?? {}
    let raw = parseHotelsDataRow(root, hid)

    if (!raw || typeof raw !== 'object') {
      raw =
        parseJsonMaybe(root.HotelDetails ?? root.hotelDetails) ??
        parseJsonMaybe(root.Details ?? root.details) ??
        parseJsonMaybe(root.Data ?? root.data)
    }

    if (Array.isArray(raw)) {
      raw = raw.find((row) => Number(row?.Hotel_Id ?? row?.Id ?? row?.id ?? 0) === hid) ?? raw[0]
    }

    if (!raw || typeof raw !== 'object') {
      if (root.Id != null || root.HotelNameA != null || root.HotelNameE != null) {
        raw = root
      }
    }

    const detail = normalizeHotelDetail(raw && typeof raw === 'object' ? raw : {}, root)
    return { success: true, detail, error: null, raw: root }
  } catch (e) {
    return { success: false, detail: null, error: e?.message ?? String(e), raw: null }
  }
}

/**
 * GetHotelFeatures — ParametersValues: Hotel_id#StartNum#Count
 */
export const fetchHotelFeaturesPage = async (
  hotelId = getAuthHotelId(),
  startNum = 0,
  count = 500
) => {
  try {
    const hid = resolveHotelId(hotelId)
    const start = Number(startNum) || 0
    const cnt = Number(count) || 500
    const params = `${hid}#${start}#${cnt}`

    const response = await executeProcedure(GET_HOTEL_FEATURES_PROCEDURE, params)

    if (!response?.success) {
      return { rows: [], total: 0, error: response?.error }
    }
    return parseHotelFeatureListPayload(response.decrypted ?? {})
  } catch (e) {
    return { rows: [], total: 0, error: e?.message ?? String(e) }
  }
}

export const saveHotelFeature = async ({
  id = 0,
  hotelId = getAuthHotelId(),
  nameAr = '',
  nameEn = '',
  wantedAction = 0,
}) => {
  const hid = resolveHotelId(hotelId)
  const featurePayload = `${String(nameAr).trim()}|||${String(nameEn).trim().toUpperCase()}`
  const columnsValues = [Number(id) || 0, hid, featurePayload].join('#')

  return DoTransaction(
    HOTEL_FEATURES_TABLE_NAME,
    columnsValues,
    wantedAction,
    HOTEL_FEATURES_COLUMNS_NAMES
  )
}

export const deleteHotelFeature = async (featureId) => {
  const normalizedId = Number(featureId) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid feature id' }
  }
  return DoTransaction(HOTEL_FEATURES_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

export const saveHotelImage = async ({
  id = 0,
  hotelId = getAuthHotelId(),
  imageId = '',
  imageDescA = '',
  imageDescE = '',
  wantedAction = 0,
}) => {
  const hid = resolveHotelId(hotelId)
  const columnsValues = [
    Number(id) || 0,
    hid,
    String(imageId ?? '').trim(),
    String(imageDescA ?? '').trim(),
    String(imageDescE ?? '').trim().toUpperCase(),
  ].join('#')

  return DoTransaction(
    HOTEL_IMAGES_TABLE_NAME,
    columnsValues,
    wantedAction,
    HOTEL_IMAGES_COLUMNS_NAMES
  )
}

export const deleteHotelImage = async (imageRowId) => {
  const normalizedId = Number(imageRowId) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid image row id' }
  }
  return DoTransaction(HOTEL_IMAGES_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

/**
 * Upload one image via HandelFile, then insert HotelImages row (ImageId = server file id).
 * SessionID is read from localStorage inside HandelFile.
 */
export async function uploadAndSaveHotelImage({
  file,
  hotelId = getAuthHotelId(),
  imageDescA = '',
  imageDescE = '',
}) {
  if (!file || !(file instanceof File) || file.size <= 0) {
    return { success: false, error: 'No file', fileName: '', imageId: '' }
  }

  const hf = new HandelFile()
  const hid = resolveHotelId(hotelId)

  const uploadRes = await hf.UploadFileWebSite({
    action: 'Add',
    file,
    fileId: '',
  })
  const fid = uploadRes?.id != null ? String(uploadRes.id).trim() : ''
  if (!isHandelUploadOk(uploadRes) || !fid) {
    return {
      success: false,
      error: uploadRes?.error != null ? String(uploadRes.error) : 'Upload failed',
      fileName: file.name,
      imageId: '',
    }
  }

  const base = (file.name || 'image').replace(/\.[^.]+$/i, '')
  const descA = String(imageDescA ?? '').trim() || base
  const descE = (String(imageDescE ?? '').trim() || base).toUpperCase()

  const rowRes = await saveHotelImage({
    id: 0,
    hotelId: hid,
    imageId: fid,
    imageDescA: descA,
    imageDescE: descE,
    wantedAction: 0,
  })

  const saved = isDoTransactionSuccess(rowRes)
  if (!saved) {
    return {
      success: false,
      error: rowRes?.errorMessage ?? rowRes?.error ?? 'Save failed',
      fileName: file.name,
      imageId: fid,
    }
  }

  return { success: true, error: null, fileName: file.name, imageId: fid }
}

/** Remove gallery row then delete stored file (best effort). */
export async function removeHotelGalleryImage({ imageRowId, imageId }) {
  const rowId = Number(imageRowId) || 0
  if (!rowId) {
    return { success: false, errorMessage: 'Invalid image row id' }
  }
  const delRow = await deleteHotelImage(rowId)
  if (!isDoTransactionSuccess(delRow)) {
    return delRow
  }
  const fid = String(imageId ?? '').trim()
  if (fid) {
    try {
      const hf = new HandelFile()
      await hf.DeleteFile({ fileId: fid })
    } catch {
      /* ignore storage cleanup errors */
    }
  }
  return delRow
}

export {
  HOTEL_FEATURES_COLUMNS_NAMES,
  HOTEL_FEATURES_TABLE_NAME,
  HOTEL_IMAGES_COLUMNS_NAMES,
  HOTEL_IMAGES_TABLE_NAME,
}
