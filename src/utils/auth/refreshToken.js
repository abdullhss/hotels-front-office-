import axios from 'axios'
import { AES256Encryption } from '../../../utils/encryption.js'
import { getBackendEndpoint, getDataToken } from '../../lib/runtimeConfig.js'
import { API_TOKEN } from './constants.js'
import { getOrCreateDeviceSerial } from './deviceSerial.js'
import { createRequestEncryptionKey, encryptApiToken } from './apiEncryptionKey.js'
import { getAuthTokens, handleAuthResponse, sanitizeBearerToken } from './sessionManager.js'

function decryptField(value) {
  if (value == null || value === '') return value
  return AES256Encryption.decrypt(value)
}

/**
 * Bypasses postToBackend on purpose: RefreshToken doesn't use the
 * { ApiToken, Data } envelope (fields are sent individually) and must not
 * require an already-valid JWT.
 */
export async function refreshJwtToken() {
  const plainRefreshToken = sanitizeBearerToken(getAuthTokens().refreshToken)
  if (!plainRefreshToken) return null

  try {
    const encryptionKey = createRequestEncryptionKey()
    const { data: raw } = await axios.post(
      getBackendEndpoint('RefreshToken'),
      {
        ApiToken: encryptApiToken(API_TOKEN, encryptionKey),
        RefreshToken: plainRefreshToken,
        DataToken: AES256Encryption.encrypt(getDataToken()),
        DeviceSerial: AES256Encryption.encrypt(getOrCreateDeviceSerial()),
        DataTimeStamp: new Date().toISOString(),
      },
      { headers: { 'Content-Type': 'application/json', RSAEncryptionKey: encryptionKey } },
    )

    const status = decryptField(raw?.Result)
    const JWTToken = raw?.JWTToken != null ? sanitizeBearerToken(raw.JWTToken) : undefined
    const RefreshToken = raw?.RefreshToken != null ? sanitizeBearerToken(raw.RefreshToken) : undefined
    const TokenExpiry = raw?.TokenExpiry != null ? decryptField(raw.TokenExpiry) : undefined
    const TokenExpiryDate = raw?.TokenExpiryDate != null ? decryptField(raw.TokenExpiryDate) : undefined

    handleAuthResponse({ JWTToken, RefreshToken, TokenExpiry, TokenExpiryDate })

    if (Number(status) !== 200 || !JWTToken) return null
    return {
      jwtToken: JWTToken,
      refreshToken: RefreshToken || plainRefreshToken,
      tokenExpiry: TokenExpiry,
      tokenExpiryDate: TokenExpiryDate,
    }
  } catch {
    return null
  }
}
