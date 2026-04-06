import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ToastViewport } from './components/ToastViewport'
import { ProtectedRoute } from './components/ProtectedRoute'

const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })),
)

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ToastViewport />
        <Suspense
          fallback={
            <div className="grid min-h-screen place-items-center px-6">
              <div className="rounded-2xl border border-teal-200/70 bg-white/70 px-8 py-6 text-sm font-medium text-teal-900 shadow-lg backdrop-blur">
                Loading workspace...
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate replace to="/app" />} />
            <Route path="/auth" element={<AuthPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<DashboardPage />} />
            </Route>

            <Route path="*" element={<Navigate replace to="/app" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App

