import { AES256Encryption } from '../../../utils/encryption.js'

const ENCRYPTION_KEY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const ENCRYPTION_KEY_LENGTH = 32

/**
 * A fresh random key per request, sent as the RSAEncryptionKey header (the
 * name is inherited from the backend - it is really an AES key).
 */
export function createRequestEncryptionKey() {
  const bytes = new Uint8Array(ENCRYPTION_KEY_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ENCRYPTION_KEY_CHARS[b % ENCRYPTION_KEY_CHARS.length]).join('')
}

export function encryptApiToken(plainToken, encryptionKey) {
  return AES256Encryption.encrypt(plainToken, encryptionKey)
}
