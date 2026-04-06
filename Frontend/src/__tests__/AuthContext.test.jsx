import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'

// Mock the API
vi.mock('../lib/api', () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from '../lib/api'

const renderWithProviders = (ui) => {
  return render(
    <ToastProvider>
      <AuthProvider>{ui}</AuthProvider>
    </ToastProvider>,
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads session on mount', async () => {
    apiRequest.mockResolvedValueOnce({
      data: { _id: '1', username: 'testuser', email: 'test@example.com', role: 'member' },
    })

    const TestComponent = () => {
      const { currentUser, sessionLoading } = useAuth()
      return (
        <div>
          {sessionLoading && <p>Loading...</p>}
          {currentUser && <p>Welcome {currentUser.username}</p>}
          {!currentUser && !sessionLoading && <p>Not logged in</p>}
        </div>
      )
    }

    renderWithProviders(<TestComponent />)

    expect(screen.getByText('Loading...')).toBeTruthy()

    await waitFor(() => {
      expect(screen.getByText('Welcome testuser')).toBeTruthy()
    })
  })

  it('handles login correctly', async () => {
    const user = userEvent.setup()

    apiRequest
      .mockRejectedValueOnce(new Error('Not authenticated'))
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockResolvedValueOnce({ data: { _id: '1', username: 'testuser', email: 'test@example.com' } })

    const TestComponent = () => {
      const { currentUser, login } = useAuth()

      return (
        <div>
          {currentUser ? (
            <p>Logged in as {currentUser.username}</p>
          ) : (
            <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
              Login
            </button>
          )}
        </div>
      )
    }

    renderWithProviders(<TestComponent />)

    await waitFor(() => expect(screen.getByText('Login')).toBeTruthy())

    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/auth/login', expect.any(Object))
    })
  })

  it('handles logout correctly', async () => {
    const user = userEvent.setup()

    apiRequest
      .mockResolvedValueOnce({
        data: { _id: '1', username: 'testuser', email: 'test@example.com' },
      })
      .mockResolvedValueOnce({})

    const TestComponent = () => {
      const { currentUser, logout } = useAuth()

      return (
        <div>
          {currentUser ? (
            <>
              <p>Logged in as {currentUser.username}</p>
              <button onClick={() => logout()}>Logout</button>
            </>
          ) : (
            <p>Not logged in</p>
          )}
        </div>
      )
    }

    renderWithProviders(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByText('Logged in as testuser')).toBeTruthy()
    })

    await user.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/auth/logout', expect.any(Object))
    })
  })
})
