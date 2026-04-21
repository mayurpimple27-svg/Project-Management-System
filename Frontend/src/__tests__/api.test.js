import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiRequest } from '../lib/api'

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

// Mock fetch
globalThis.fetch = vi.fn()

describe('API Request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('makes a successful API request', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '1', name: 'Test' } }),
    })

    const result = await apiRequest('/test', { method: 'GET' })

    expect(result.data).toEqual({ id: '1', name: 'Test' })
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/test`,
      expect.objectContaining({
        credentials: 'include',
        method: 'GET',
      }),
    )
  })

  it('includes content-type header for requests with body', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { success: true } }),
    })

    await apiRequest('/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    })

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/test`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('throws error on failed request', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Error occurred' }),
    })

    await expect(apiRequest('/test', { method: 'GET' })).rejects.toThrow('Error occurred')
  })

  it('includes credentials for cross-origin requests', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '1' } }),
    })

    await apiRequest('/test', { method: 'GET' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        credentials: 'include',
      }),
    )
  })
})
