const rawApiBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
const API_BASE = /^https?:\/\/[^/]+$/i.test(rawApiBase)
  ? `${rawApiBase}/api/v1`
  : rawApiBase

let accessToken = null
let refreshPromise = null

export const setAccessToken = (token) => {
  accessToken = token || null
}

export const clearAccessToken = () => {
  accessToken = null
}

const buildHeaders = (options = {}) => ({
  ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  ...(options.headers || {}),
})

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data?.message || 'Session expired')
        }

        const nextToken = data?.data?.accessToken || null
        setAccessToken(nextToken)
        return nextToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: buildHeaders(options),
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (response.status === 401 && !options.skipAuthRetry) {
    try {
      await refreshAccessToken()
      return apiRequest(path, { ...options, skipAuthRetry: true })
    } catch {
      clearAccessToken()
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed')
  }

  return data
}
