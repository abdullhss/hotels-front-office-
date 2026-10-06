import { AES256Encryption } from '../../../utils/encryption.js'
import { INACTIVITY_TIMEOUT_MS, USER_TOKEN_KEY, tokenField } from './constants.js'

const EMPTY_TOKENS = {
  jwtToken: null, refreshToken: null, tokenExpiry: null, tokenExpiryDate: null, jwtIssuedAt: null,
}
const SESSION_ENDED_DEBOUNCE_MS = 1500
const ENDPOINTS_WITHOUT_SESSION_HANDLING = new Set(['Checklogin', 'ExecuteAuthentication'])
// App-level keys written by the login page; cleared together with the session.
const APP_STORAGE_KEYS = ['isAuthenticated', 'userData', 'userRole', 'SessionID']

let cachedTokens = { ...EMPTY_TOKENS }
let currentSessionId = null
let currentUserId = null
let onSessionEnded = null
let lastSessionEndedAt = 0
let inactivityTimeoutId = null

function readStoredValue() {
  return sessionStorage.getItem(tokenField) || localStorage.getItem(tokenField)
}

function writeStoredValue(encrypted) {
  if (sessionStorage.getItem(tokenField)) sessionStorage.setItem(tokenField, encrypted)
  else localStorage.setItem(tokenField, encrypted)
}

function readStoredPayload() {
  const raw = readStoredValue()
  if (!raw) return null
  const decrypted = AES256Encryption.decrypt(raw, USER_TOKEN_KEY)
  return decrypted && typeof decrypted === 'object' ? decrypted : null
}

export function isValidSessionId(sessionId) {
  return sessionId != null && String(sessionId).trim() !== ''
}

export function sanitizeBearerToken(token) {
  if (token == null || token === '') return undefined
  let value = String(token).trim()
  if (value.toLowerCase().startsWith('bearer ')) value = value.slice(7).trim()
  return value.replace(/\s+/g, '')
}

export function getJwtAuthorizationHeader() {
  const sanitized = sanitizeBearerToken(cachedTokens.jwtToken)
  return sanitized ? `Bearer ${sanitized}` : undefined
}

function setCurrentSessionId(sessionId) { currentSessionId = isValidSessionId(sessionId) ? sessionId : null }
function setCurrentUserId(userId) { currentUserId = userId == null || userId === '' ? null : userId }

export function setOnSessionEnded(handler) { onSessionEnded = handler }
export function getAuthTokens() { return cachedTokens }

export function setAuthTokens(tokens = {}) {
  cachedTokens = {
    jwtToken: sanitizeBearerToken(tokens.jwtToken) ?? null,
    refreshToken: sanitizeBearerToken(tokens.refreshToken) ?? null,
    tokenExpiry: tokens.tokenExpiry ?? null,
    tokenExpiryDate: tokens.tokenExpiryDate ?? null,
    jwtIssuedAt: tokens.jwtIssuedAt ?? null,
  }
}

export function getStoredSessionId() {
  if (currentSessionId) return currentSessionId
  const payload = readStoredPayload()
  const sessionId = payload?.sessionId ?? payload?.SessionID ?? payload?.SessionId
  if (isValidSessionId(sessionId)) { setCurrentSessionId(sessionId); return sessionId }
  return undefined
}

export function getStoredUserId() {
  if (currentUserId) return currentUserId
  const payload = readStoredPayload()
  const userId = payload?.encryptedUserId ?? payload?.User_Id ?? payload?.UserId
  if (userId != null && userId !== '') { setCurrentUserId(userId); return userId }
  return undefined
}

export function isLoggedIn() {
  return isValidSessionId(getStoredSessionId())
}

/** Restores tokens/session ids from storage after a page reload. Returns true if a session exists. */
export function restoreSession() {
  const payload = readStoredPayload()
  if (!payload) return false
  setAuthTokens(payload)
  const sessionId = payload.sessionId ?? payload.SessionID ?? payload.SessionId
  if (isValidSessionId(sessionId)) setCurrentSessionId(sessionId)
  const userId = payload.encryptedUserId ?? payload.User_Id ?? payload.UserId
  if (userId != null && userId !== '') setCurrentUserId(userId)
  if (!isLoggedIn()) return false
  markUserActivity()
  return true
}

export function saveSession(
  { userData, jwtToken, refreshToken, tokenExpiry, tokenExpiryDate, sessionId, encryptedUserId },
  rememberMe = false,
) {
  const resolvedSessionId = isValidSessionId(sessionId) ? sessionId : undefined
  const resolvedUserId = encryptedUserId || undefined
  const cleanJwt = sanitizeBearerToken(jwtToken)

  const merged = {
    userData,
    jwtToken: cleanJwt,
    refreshToken: sanitizeBearerToken(refreshToken),
    tokenExpiry,
    tokenExpiryDate,
    jwtIssuedAt: cleanJwt ? Date.now() : undefined,
    ...(resolvedSessionId ? { sessionId: resolvedSessionId, SessionID: resolvedSessionId } : {}),
    ...(resolvedUserId ? { encryptedUserId: resolvedUserId, User_Id: resolvedUserId } : {}),
  }

  const encrypted = AES256Encryption.encrypt(merged, USER_TOKEN_KEY)
  sessionStorage.removeItem(tokenField)
  localStorage.removeItem(tokenField)
  if (rememberMe) localStorage.setItem(tokenField, encrypted)
  else sessionStorage.setItem(tokenField, encrypted)

  setAuthTokens(merged)
  if (resolvedSessionId) setCurrentSessionId(resolvedSessionId)
  if (resolvedUserId) setCurrentUserId(resolvedUserId)
  markUserActivity()
  return merged
}

function mergeIntoStoredPayload(updates) {
  const existing = readStoredPayload()
  if (!existing) return null
  const merged = { ...existing, ...updates }
  writeStoredValue(AES256Encryption.encrypt(merged, USER_TOKEN_KEY))
  return merged
}

export function persistRefreshedTokens({ jwtToken, refreshToken, tokenExpiry, tokenExpiryDate }) {
  const merged = mergeIntoStoredPayload({
    jwtToken, refreshToken, tokenExpiry, tokenExpiryDate,
    jwtIssuedAt: jwtToken ? Date.now() : undefined,
  })
  if (merged) setAuthTokens(merged)
}

export function persistSessionId(sessionId) {
  if (!isValidSessionId(sessionId)) return
  setCurrentSessionId(sessionId)
  mergeIntoStoredPayload({ sessionId, SessionID: sessionId })
}

function stopInactivityTimer() {
  if (inactivityTimeoutId) {
    clearTimeout(inactivityTimeoutId)
    inactivityTimeoutId = null
  }
}

function endSession() {
  clearSession()
  if (typeof onSessionEnded === 'function') onSessionEnded()
  else window.location.replace('/login')
}

function logoutFromInactivity() {
  inactivityTimeoutId = null
  if (isLoggedIn()) endSession()
}

/**
 * Resets the idle-logout window (45 min). Call on every request the logged-in
 * user actually makes - not on background token refreshes.
 */
export function markUserActivity() {
  stopInactivityTimer()
  if (!isLoggedIn()) return
  inactivityTimeoutId = setTimeout(logoutFromInactivity, INACTIVITY_TIMEOUT_MS)
}

export function clearSession() {
  stopInactivityTimer()
  cachedTokens = { ...EMPTY_TOKENS }
  setCurrentSessionId(null)
  setCurrentUserId(null)
  sessionStorage.removeItem(tokenField)
  localStorage.removeItem(tokenField)
  APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
}

function isDecryptFailure(value) {
  return value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'Decryption failed:')
}

export function normalizeSessionEndedValue(raw) {
  if (raw == null || raw === '') return undefined
  if (typeof raw === 'boolean' || typeof raw === 'number') return raw
  if (isDecryptFailure(raw)) return undefined
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    const lower = trimmed.toLowerCase()
    if (lower === 'true' || lower === 'false') return lower === 'true'
    if (trimmed === '1' || trimmed === '0') return trimmed === '1'
    const decrypted = AES256Encryption.decrypt(trimmed)
    if (isDecryptFailure(decrypted)) return trimmed
    if (decrypted !== trimmed) return normalizeSessionEndedValue(decrypted)
    return trimmed
  }
  return raw
}

export function isSessionEnded(value) {
  const normalized = normalizeSessionEndedValue(value)
  if (normalized === true || normalized === 1) return true
  if (normalized === false || normalized === 0 || normalized == null) return false
  const asString = String(normalized).trim().toLowerCase()
  return asString === 'true' || asString === '1'
}

export function parseSessionFields(data) {
  return {
    SessionID: data?.SessionID ?? data?.SessionId ?? undefined,
    IsSessionEnded: normalizeSessionEndedValue(data?.IsSessionEnded ?? data?.SessionEnded),
  }
}

export function shouldHandleSessionForEndpoint(endpoint) {
  return Boolean(endpoint) && !ENDPOINTS_WITHOUT_SESSION_HANDLING.has(endpoint)
}

/** Feeds any JWT/refresh/session fields found in a response back into the store. */
export function handleAuthResponse({
  JWTToken, RefreshToken, TokenExpiry, TokenExpiryDate, SessionId, SessionID, User_Id, UserId,
} = {}) {
  const sessionId = SessionId ?? SessionID
  const encryptedUserId = User_Id ?? UserId
  const hasAuthFields =
    JWTToken != null || RefreshToken != null || TokenExpiry != null || TokenExpiryDate != null ||
    isValidSessionId(sessionId) || (encryptedUserId != null && encryptedUserId !== '')
  if (!hasAuthFields) return

  const existing = readStoredPayload()
  if (!existing) {
    if (JWTToken) {
      setAuthTokens({
        jwtToken: JWTToken, refreshToken: RefreshToken, tokenExpiry: TokenExpiry,
        tokenExpiryDate: TokenExpiryDate, jwtIssuedAt: Date.now(),
      })
    }
    if (isValidSessionId(sessionId)) setCurrentSessionId(sessionId)
    if (encryptedUserId) setCurrentUserId(encryptedUserId)
    return
  }

  const merged = mergeIntoStoredPayload({
    ...(JWTToken != null ? { jwtToken: JWTToken, jwtIssuedAt: Date.now() } : {}),
    ...(RefreshToken != null ? { refreshToken: RefreshToken } : {}),
    ...(TokenExpiry != null ? { tokenExpiry: TokenExpiry } : {}),
    ...(TokenExpiryDate != null ? { tokenExpiryDate: TokenExpiryDate } : {}),
    ...(isValidSessionId(sessionId) ? { sessionId, SessionID: sessionId } : {}),
    ...(encryptedUserId ? { encryptedUserId, User_Id: encryptedUserId } : {}),
  })
  if (merged) setAuthTokens(merged)
  if (isValidSessionId(sessionId)) setCurrentSessionId(sessionId)
  if (encryptedUserId) setCurrentUserId(encryptedUserId)
}

/** Logs the user out when the backend reports IsSessionEnded; otherwise keeps the SessionID fresh. */
export function handleSessionResponse({ SessionID, IsSessionEnded } = {}) {
  if (isSessionEnded(IsSessionEnded)) {
    const now = Date.now()
    if (now - lastSessionEndedAt < SESSION_ENDED_DEBOUNCE_MS) return
    lastSessionEndedAt = now
    endSession()
    return
  }
  if (isValidSessionId(SessionID)) persistSessionId(SessionID)
}
