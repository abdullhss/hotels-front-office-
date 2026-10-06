let runtimeConfig = null

function ensureKeys(config) {
  const missing = ['url', 'token'].filter(
    (key) => !(key in config) || config[key] === null || config[key] === '',
  )
  if (missing.length > 0) {
    throw new Error(`Missing required runtime config key(s): ${missing.join(', ')}`)
  }
}

/** Loads /config.json once before the app renders (see main.jsx). */
export async function loadConfig() {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to fetch /config.json (status: ${response.status})`)
    }
    const parsed = await response.json()
    ensureKeys(parsed)
    runtimeConfig = parsed
    return runtimeConfig
  } catch (error) {
    throw new Error(`Runtime config load failed: ${error?.message || 'Unknown error'}`)
  }
}

export function getConfig() {
  if (!runtimeConfig) {
    throw new Error('Runtime config is not loaded. Call loadConfig() before using getConfig().')
  }
  return runtimeConfig
}

export function getBackendEndpoint(path) {
  return `${getConfig().url}${path}`
}

export function getDataToken() {
  return getConfig().token
}
