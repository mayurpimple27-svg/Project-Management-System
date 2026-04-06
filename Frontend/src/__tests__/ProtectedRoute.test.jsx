import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'

// Mock the API
vi.mock('../lib/api', () => ({
  apiRequest: vi.fn(),
}))

describe('ProtectedRoute', () => {
  it('redirects to auth when user is not logged in', async () => {
    const { apiRequest } = await import('../lib/api')
    apiRequest.mockResolvedValueOnce({ data: null })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<div>Auth Page</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<div>Dashboard</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    )

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByText('Auth Page')).toBeTruthy()
  })

  it('renders protected component when user is logged in', async () => {
    const { apiRequest } = await import('../lib/api')
    apiRequest.mockResolvedValueOnce({
      data: { _id: '1', username: 'testuser', email: 'test@example.com' },
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<div>Auth Page</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<div>Dashboard</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    )

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })
})
