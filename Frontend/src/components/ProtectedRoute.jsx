import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = () => {
  const { isAuthenticated, sessionLoading } = useAuth()

  if (sessionLoading) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="rounded-2xl border border-teal-200/70 bg-white/70 px-8 py-6 text-sm font-medium text-teal-900 shadow-lg backdrop-blur">
          Restoring secure session...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />
  }

  return <Outlet />
}
