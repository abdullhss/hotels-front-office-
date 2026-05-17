import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'

const GET_AGENTS_PROCEDURE = 'IcSUPwDY6gxZhW1Xj7qpGA=='
const GET_AGENT_DETAILS_PROCEDURE = 'nnLAFXzhyLQzuj/3gQiBnQ=='
const AGENT_TABLE_NAME = '92tKXvc7U1xyYi5UhbBvPA=='
const AGENT_COLUMNS_NAMES =
  'Id#AgentNameA#AgentNameE#Nationality_Id#DescriptionA#DescriptionE#Address#Telephon1#Telephon2#Telephon3#Telephon4#Telephon5#WebSite#Email#Facebook#Owner#ResponibleName#ResponibleMobile#IsActive#IsBlocked#WhatsUp#imported'

/** DoTransaction returns `success` from decrypted Result — may be true, "True", or HTTP-style 200 */
export function isDoTransactionSuccess(res) {
  if (!res) return false
  if (res.errorMessage && String(res.errorMessage).trim() !== '') return false
  const s = res.success
  if (s === true) return true
  if (s === false) return false
  if (s === 200) return true
  if (typeof s === 'number' && Number(s) === 200) return true
  if (typeof s === 'string') {
    const t = s.trim().toLowerCase()
    if (t === 'true') return true
    if (t === '200') return true
    const n = Number(s.trim())
    if (!Number.isNaN(n) && n === 200) return true
    return false
  }
  return Boolean(s)
}

const parseBool = (v, defaultVal = false) => {
  if (v == null) return defaultVal
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase()
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0') return false
  return defaultVal
}

export function normalizeAgentRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const nameEnRaw = raw.AgentNameE ?? raw.agentNameE ?? ''
  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    nameAr: raw.AgentNameA ?? raw.agentNameA ?? '',
    nameEn: String(nameEnRaw).trim() ? String(nameEnRaw).toUpperCase() : '',
    nationalityId: Number(raw.Nationality_Id ?? raw.nationalityId ?? 0),
    nationalityNameAr: raw.NationalityNameA ?? raw.nationalityNameA ?? '',
    nationalityNameEn: String(raw.NationalityNameE ?? raw.nationalityNameE ?? '').trim()
      ? String(raw.NationalityNameE ?? raw.nationalityNameE ?? '').toUpperCase()
      : '',
    descAr: raw.DescriptionA ?? raw.descriptionA ?? '',
    descEn: raw.DescriptionE ?? raw.descriptionE ?? '',
    address: raw.Address ?? raw.address ?? '',
    phone1: raw.Telephon1 ?? raw.telephon1 ?? '',
    phone2: raw.Telephon2 ?? raw.telephon2 ?? '',
    phone3: raw.Telephon3 ?? raw.telephon3 ?? '',
    phone4: raw.Telephon4 ?? raw.telephon4 ?? '',
    phone5: raw.Telephon5 ?? raw.telephon5 ?? '',
    website: raw.WebSite ?? raw.webSite ?? '',
    email: raw.Email ?? raw.email ?? '',
    facebookUrl: raw.Facebook ?? raw.facebook ?? '',
    owner: raw.Owner ?? raw.owner ?? '',
    managerName: raw.ResponibleName ?? raw.responibleName ?? '',
    managerPhone: raw.ResponibleMobile ?? raw.responibleMobile ?? '',
    isActive: parseBool(raw.IsActive ?? raw.isActive, true),
    isBlocked: parseBool(raw.IsBlocked ?? raw.isBlocked, false),
    whatsapp: raw.WhatsUp ?? raw.whatsUp ?? '',
    imported: parseBool(raw.imported ?? raw.Imported, false),
  }
}

function parseAgentListPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { rows: [], total: 0, stats: { all: 0, active: 0, blocked: 0 } }
  }

  const keys = Object.keys(payload)
  let dataRaw =
    payload.AgentData ??
    payload.AgentsData ??
    payload.agentsData ??
    payload.Data ??
    payload.data

  if (dataRaw == null) {
    const dataKey = keys.find((k) => /data$/i.test(k) && k.length > 4)
    if (dataKey) dataRaw = payload[dataKey]
  }

  let countRaw =
    payload.AgentCount ??
    payload.AgentsCount ??
    payload.agentCount ??
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
  const rows = list.map((item) => normalizeAgentRow(item)).filter(Boolean)
  const stats = {
    all: Number(payload.allAgentCount ?? total) || 0,
    active: Number(payload.activeAgentCount ?? 0) || 0,
    blocked: Number(payload.blockedAgentCount ?? 0) || 0,
  }
  return { rows, total, stats }
}

/** Server-side list: Nationality_id # value (search) # StartNum # Count */
export const fetchAgentsPage = async (nationalityId, searchText, startNum, count) => {
  const nid = Number(nationalityId)
  const params = `${Number.isFinite(nid) ? nid : -1}#${searchText ?? ''}#${startNum}#${count}#$????`
  const response = await executeProcedure(GET_AGENTS_PROCEDURE, params)

  if (!response?.success) {
    return {
      rows: [],
      total: 0,
      stats: { all: 0, active: 0, blocked: 0 },
      error: response?.error,
    }
  }
  return parseAgentListPayload(response.decrypted ?? {})
}

function parseAgentDataArray(payload, requestedId) {
  const rawData = payload.AgentData ?? payload.agentData
  if (rawData == null) return null

  let list = []
  if (typeof rawData === 'string') {
    try {
      list = JSON.parse(rawData)
    } catch {
      return null
    }
  } else if (Array.isArray(rawData)) {
    list = rawData
  }

  if (!Array.isArray(list) || list.length === 0) return null

  const rid = Number(requestedId)
  const hit = list.find((item) => Number(item?.id ?? item?.Id ?? 0) === rid)
  return hit ?? list[0]
}

/** Detail proc may return AgentDetails or the same AgentData JSON array shape as the list. */
export const getAgentDetails = async (agentId) => {
  const id = Number(agentId) || 0
  if (!id) return { success: false, agent: null, error: 'Invalid agent id' }

  const response = await executeProcedure(GET_AGENT_DETAILS_PROCEDURE, `${String(id)}#$????`)

  if (!response?.success) {
    return { success: false, agent: null, error: response?.error }
  }

  const p = response.decrypted ?? {}

  let raw =
    p.AgentDetails ??
    p.agentDetails ??
    null

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      raw = null
    }
  }

  if (!raw && (p.AgentData != null || p.agentData != null)) {
    raw = parseAgentDataArray(p, id)
  }

  if (!raw) {
    raw = p.Details ?? p.Data ?? p.data
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch {
        raw = null
      }
    }
  }

  if (Array.isArray(raw) && raw.length) {
    raw = raw.find((item) => Number(item?.id ?? item?.Id ?? 0) === id) ?? raw[0]
  }

  if (raw && typeof raw === 'object') {
    return { success: true, agent: normalizeAgentRow(raw), error: null }
  }

  if (p.Id != null || p.id != null || p.AgentNameA != null) {
    return { success: true, agent: normalizeAgentRow(p), error: null }
  }

  return { success: true, agent: null, error: null }
}

export const saveAgent = async ({
  id = 0,
  agentNameA = '',
  agentNameE = '',
  nationalityId = 0,
  descriptionA = '',
  descriptionE = '',
  address = '',
  telephon1 = '',
  telephon2 = '',
  telephon3 = '',
  telephon4 = '',
  telephon5 = '',
  webSite = '',
  email = '',
  facebook = '',
  owner = '',
  responibleName = '',
  responibleMobile = '',
  isActive = true,
  isBlocked = false,
  whatsUp = '',
  imported = false,
  wantedAction = 0,
}) => {
  const boolStr = (v) => (v ? 'True' : 'False')
  const normImported = imported === true || imported === 'true' || imported === 'True'
  const columnsValues = [
    Number(id) || 0,
    agentNameA.trim(),
    agentNameE.trim().toUpperCase(),
    Number(nationalityId) || 0,
    descriptionA.trim(),
    descriptionE.trim(),
    address.trim(),
    telephon1.trim(),
    telephon2.trim(),
    telephon3.trim(),
    telephon4.trim(),
    telephon5.trim(),
    webSite.trim(),
    email.trim(),
    facebook.trim(),
    owner.trim(),
    responibleName.trim(),
    responibleMobile.trim(),
    boolStr(isActive),
    boolStr(isBlocked),
    whatsUp.trim(),
    normImported ? 'True' : 'False',
  ].join('#')

  return DoTransaction(AGENT_TABLE_NAME, columnsValues, wantedAction, AGENT_COLUMNS_NAMES)
}

export const deleteAgent = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid agent id' }
  }
  return DoTransaction(AGENT_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

/** Pull-all hook for nationality dropdown options — uses wide count */
const useAgentsSimple = (nationalityId = -1, value = '', startNum = 1, count = 5000) => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const { rows, total } = await fetchAgentsPage(nationalityId, value, startNum, count)
        if (cancelled) return
        setAgents(rows ?? [])
        setTotalCount(total ?? 0)
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setAgents([])
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
  }, [nationalityId, value, startNum, count])

  return { agents, totalCount, loading, error }
}

export default useAgentsSimple
