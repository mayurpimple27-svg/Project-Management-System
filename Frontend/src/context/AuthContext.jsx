import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiRequest } from '../lib/api'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const { pushToast } = useToast()

  const loadSession = useCallback(async () => {
    setSessionLoading(true)

    try {
      const response = await apiRequest('/auth/current-user', { method: 'GET' })
      setCurrentUser(response?.data || null)
    } catch {
      setCurrentUser(null)
    } finally {
      setSessionLoading(false)
    }
  }, [])

  const login = useCallback(
    async ({ email, password }) => {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      await loadSession()
      pushToast('Welcome back. Session secured.', 'success')
    },
    [loadSession, pushToast],
  )

  const register = useCallback(
    async ({ fullName, username, email, password }) => {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          username: username.toLowerCase(),
          email,
          password,
        }),
      })
      pushToast('Account created. Verify email and login.', 'success')
    },
    [pushToast],
  )

  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' })
    setCurrentUser(null)
    pushToast('You have been logged out.', 'info')
  }, [pushToast])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const value = useMemo(
    () => ({
      currentUser,
      sessionLoading,
      isAuthenticated: Boolean(currentUser),
      loadSession,
      login,
      register,
      logout,
    }),
    [currentUser, sessionLoading, loadSession, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
