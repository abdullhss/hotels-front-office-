export const NATIONAL_ID_LENGTH = 14
export const NATIONAL_ID_PATTERN = /^[12]\d{13}$/

const NATIONAL_ID_TYPE = 'national_id'

export function isNationalIdType(idType) {
  const type = String(idType ?? '').trim().toLowerCase()
  return !type || type === NATIONAL_ID_TYPE
}

export function shouldSanitizeAsNationalId(idType) {
  const type = String(idType ?? '').trim().toLowerCase()
  return type !== 'passport' && type !== 'residency'
}

export function sanitizeNationalIdInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, NATIONAL_ID_LENGTH)
}

export function isValidNationalIdNumber(idNumber) {
  return NATIONAL_ID_PATTERN.test(String(idNumber ?? '').trim())
}

/**
 * Validate national ID format when idType is national ID (or unset).
 * Returns { valid, errorKey } where errorKey is 'required' | 'format' | null.
 */
export function validateNationalIdNumber(idNumber, idType = NATIONAL_ID_TYPE) {
  if (!isNationalIdType(idType)) {
    return { valid: true, errorKey: null }
  }

  const value = String(idNumber ?? '').trim()
  if (!value) {
    return { valid: false, errorKey: 'required' }
  }
  if (!isValidNationalIdNumber(value)) {
    return { valid: false, errorKey: 'format' }
  }
  return { valid: true, errorKey: null }
}

export const NATIONAL_ID_MESSAGES = {
  ar: 'رقم الهوية يجب أن يبدأ بـ 1 أو 2 ويتكون من 14 رقمًا',
  en: 'ID number must start with 1 or 2 and be 14 digits',
}

export function getNationalIdNumberMessage(isArabic) {
  return isArabic ? NATIONAL_ID_MESSAGES.ar : NATIONAL_ID_MESSAGES.en
}
