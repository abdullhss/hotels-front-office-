const DEVICE_SERIAL_STORAGE_KEY = 'hotels_device_serial'

function createDeviceSerial() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Persisted per-device serial, sent to the backend with login / refresh / requests. */
export function getOrCreateDeviceSerial() {
  const existing = localStorage.getItem(DEVICE_SERIAL_STORAGE_KEY)
  if (existing) return existing
  const serial = createDeviceSerial()
  localStorage.setItem(DEVICE_SERIAL_STORAGE_KEY, serial)
  return serial
}
