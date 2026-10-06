import { getAuthTokens, persistRefreshedTokens } from './sessionManager.js'
import { refreshJwtToken } from './refreshToken.js'

const MIN_REFRESH_DELAY_MS = 60 * 1000
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000
const DEFAULT_TOKEN_LIFETIME_MS = 60 * 60 * 1000

let refreshTimeoutId = null
let refreshInFlight = null

function resolveExpiryTimestamp({ tokenExpiry, tokenExpiryDate, jwtIssuedAt }) {
  if (tokenExpiryDate) {
    const parsed = new Date(tokenExpiryDate).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  if (tokenExpiry) {
    const minutes = Number(tokenExpiry)
    if (!Number.isNaN(minutes)) return (Number(jwtIssuedAt) || Date.now()) + minutes * 60 * 1000
  }
  return Date.now() + DEFAULT_TOKEN_LIFETIME_MS
}

function doRefresh() {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = refreshJwtToken()
    .then((tokens) => { if (tokens) persistRefreshedTokens(tokens); return tokens })
    .finally(() => { refreshInFlight = null })
  return refreshInFlight
}

/** Called before every JWT-bearing request: refresh first if the token is close to expiring. */
export async function ensureValidJwtToken() {
  const tokens = getAuthTokens()
  if (!tokens.jwtToken || !tokens.refreshToken) return
  if (resolveExpiryTimestamp(tokens) - Date.now() > REFRESH_BEFORE_EXPIRY_MS) return
  await doRefresh()
}

/** Schedules the next refresh so the token never goes stale while the user is idle. */
export function startTokenRefreshScheduler() {
  stopTokenRefreshScheduler()
  const tokens = getAuthTokens()
  if (!tokens.jwtToken || !tokens.refreshToken) return
  const delay = Math.max(
    resolveExpiryTimestamp(tokens) - Date.now() - REFRESH_BEFORE_EXPIRY_MS,
    MIN_REFRESH_DELAY_MS,
  )
  refreshTimeoutId = setTimeout(async () => {
    await doRefresh()
    startTokenRefreshScheduler()
  }, delay)
}

export function stopTokenRefreshScheduler() {
  if (refreshTimeoutId) { clearTimeout(refreshTimeoutId); refreshTimeoutId = null }
}
