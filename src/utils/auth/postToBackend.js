import axios from 'axios'
import { AES256Encryption } from '../../../utils/encryption.js'
import { getBackendEndpoint, getDataToken } from '../../lib/runtimeConfig.js'
import { API_TOKEN } from './constants.js'
import {
  getJwtAuthorizationHeader,
  handleAuthResponse,
  handleSessionResponse,
  markUserActivity,
  parseSessionFields,
  shouldHandleSessionForEndpoint,
} from './sessionManager.js'
import { ensureValidJwtToken } from './tokenRefreshManager.js'
import { createRequestEncryptionKey, encryptApiToken } from './apiEncryptionKey.js'

// Endpoints that run before a JWT exists.
const ENDPOINTS_WITHOUT_JWT = new Set(['Checklogin', 'ExecuteAuthentication', 'RefreshToken', 'RequireAuthentication'])

function decryptField(value) {
  if (value == null || value === '') return value
  return AES256Encryption.decrypt(value)
}

export function parseBackendResponse(data) {
  const sessionFields = parseSessionFields(data)
  const rawUserId = data?.User_Id ?? data?.UserId
  return {
    status: decryptField(data?.Result),
    Data: data?.Data != null ? decryptField(data.Data) : undefined,
    error: data?.Error != null ? decryptField(data.Error) : undefined,
    ServerTime: data?.ServerTime != null ? decryptField(data.ServerTime) : undefined,
    TransToken: data?.TransToken,
    JWTToken: data?.JWTToken,
    RefreshToken: data?.RefreshToken,
    TokenExpiry: data?.TokenExpiry != null ? decryptField(data.TokenExpiry) : undefined,
    TokenExpiryDate: data?.TokenExpiryDate != null ? decryptField(data.TokenExpiryDate) : undefined,
    ...sessionFields,
    SessionId: sessionFields.SessionID,
    UserId: rawUserId,
    User_Id: rawUserId,
  }
}

/**
 * Encrypted gateway for the auth endpoints: AES-256 Data envelope, ApiToken
 * encrypted under a fresh per-request key (RSAEncryptionKey header), JWT
 * header + silent refresh where applicable, and automatic feeding of
 * auth/session fields back into sessionManager.
 */
export async function postToBackend({ endpoint, payload = {}, signal }) {
  const encryptionKey = createRequestEncryptionKey()
  const jsonData = {
    ApiToken: encryptApiToken(API_TOKEN, encryptionKey),
    Data: AES256Encryption.encrypt({
      ...payload,
      DataToken: payload.DataToken || getDataToken(),
      DataTimeStamp: payload.DataTimeStamp ?? new Date().toISOString(),
    }),
  }

  const headers = { 'Content-Type': 'application/json', RSAEncryptionKey: encryptionKey }
  if (!ENDPOINTS_WITHOUT_JWT.has(endpoint)) {
    await ensureValidJwtToken()
    markUserActivity()
    const jwtHeader = getJwtAuthorizationHeader()
    if (jwtHeader) headers.JWTToken = jwtHeader
  }

  const { data } = await axios.post(getBackendEndpoint(endpoint), jsonData, { headers, signal })
  const parsed = parseBackendResponse(data)

  handleAuthResponse(parsed)
  if (shouldHandleSessionForEndpoint(endpoint)) {
    handleSessionResponse({ SessionID: parsed.SessionID, IsSessionEnded: parsed.IsSessionEnded })
  }
  return parsed
}
