import { API_TOKEN } from './constants.js'
import { getOrCreateDeviceSerial } from './deviceSerial.js'
import {
  getJwtAuthorizationHeader,
  getStoredSessionId,
  getStoredUserId,
  handleSessionResponse,
  markUserActivity,
  parseSessionFields,
} from './sessionManager.js'
import { ensureValidJwtToken } from './tokenRefreshManager.js'
import { createRequestEncryptionKey, encryptApiToken } from './apiEncryptionKey.js'

/**
 * Auth for ExecuteProcedureManager / DoTransactionManager /
 * DoMultiTransactionManager / file endpoints: per-request encrypted ApiToken +
 * RSAEncryptionKey header, silent JWT refresh, JWTToken header.
 */
export async function buildLegacyAuthHeaders() {
  await ensureValidJwtToken()
  markUserActivity()
  const jwtHeader = getJwtAuthorizationHeader()
  const encryptionKey = createRequestEncryptionKey()
  const headers = { RSAEncryptionKey: encryptionKey }
  if (jwtHeader) headers.JWTToken = jwtHeader
  return { headers, apiToken: encryptApiToken(API_TOKEN, encryptionKey) }
}

/** Logs the user out if the raw response says the session ended; refreshes SessionID otherwise. */
export function handleLegacySessionResponse(data) {
  handleSessionResponse(parseSessionFields(data))
}

/** Stamps DeviceSerial / SessionId / User_Id / DataTimeStamp onto a request payload. */
export function applySessionStamps(payload, { SessionID } = {}) {
  payload.DeviceSerial = getOrCreateDeviceSerial()
  payload.SessionId = SessionID ?? getStoredSessionId()
  payload.DataTimeStamp = payload.DataTimeStamp ?? new Date().toISOString()
  const userId = getStoredUserId()
  if (userId != null && userId !== '') payload.User_Id = userId
  return payload
}
