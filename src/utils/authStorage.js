const USER_DATA_KEY = 'userData'
const USER_ROLE_KEY = 'userRole'

function parseStoredUserData() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(USER_DATA_KEY)
    if (!raw?.trim()) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** First logged-in user record from `userData` localStorage. */
export function getAuthUser() {
  const users = parseStoredUserData()
  const first = users[0]
  return first && typeof first === 'object' ? first : null
}

export function getAuthUserData() {
  return parseStoredUserData()
}

export function getAuthHotelId() {
  const user = getAuthUser()
  if (!user) return 0
  const id = Number(user.hotel_id ?? user.Hotel_Id ?? user.hotel_Id ?? 0)
  return Number.isFinite(id) ? id : 0
}

export function getAuthUserId() {
  const user = getAuthUser()
  if (!user) return 0
  const id = Number(user.user_Id ?? user.User_Id ?? user.user_id ?? user.User_id ?? 0)
  return Number.isFinite(id) ? id : 0
}

export function getAuthRoleName() {
  const user = getAuthUser()
  const fromUser = user?.roleName ?? user?.RoleName ?? user?.role_name
  if (fromUser != null && String(fromUser).trim()) return String(fromUser).trim()
  if (typeof localStorage === 'undefined') return ''
  const stored = localStorage.getItem(USER_ROLE_KEY)
  return stored != null ? String(stored).trim() : ''
}

export function getAuthLoginName() {
  const user = getAuthUser()
  if (!user) return ''
  const name = user.LoginName ?? user.loginName ?? user.login_name
  return name != null ? String(name).trim() : ''
}

export function isAuthUserActive() {
  const user = getAuthUser()
  if (!user) return false
  const active = user.isActive ?? user.IsActive
  if (typeof active === 'boolean') return active
  const s = String(active ?? '').toLowerCase()
  return s === 'true' || s === '1'
}

/** Explicit hotel id when provided and valid; otherwise from auth session. */
export function resolveHotelId(hotelId) {
  const n = Number(hotelId)
  if (Number.isFinite(n) && n > 0) return n
  return getAuthHotelId()
}
