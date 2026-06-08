/** Letters (any script) and spaces only */
export const NAME_PATTERN = /^[\p{L}\s]+$/u

export function sanitizeNameInput(value) {
  return String(value ?? '').replace(/[^\p{L}\s]/gu, '')
}

export function isValidName(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return false
  return NAME_PATTERN.test(trimmed)
}

/** Returns { valid, errorKey } where errorKey is 'required' | 'format' | null */
export function validateName(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return { valid: false, errorKey: 'required' }
  }
  if (!isValidName(trimmed)) {
    return { valid: false, errorKey: 'format' }
  }
  return { valid: true, errorKey: null }
}

export const NAME_MESSAGES = {
  ar: 'الاسم يجب أن يحتوي على حروف فقط',
  en: 'Name must contain letters only',
}

export function getNameLettersOnlyMessage(isArabic) {
  return isArabic ? NAME_MESSAGES.ar : NAME_MESSAGES.en
}
