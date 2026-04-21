import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ToastViewport } from './components/ToastViewport'
import { ProtectedRoute } from './components/ProtectedRoute'

const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })),
)

const DashboardLayout = lazy(() =>
  import('./pages/dashboard/DashboardLayout').then((module) => ({
    default: module.DashboardLayout,
  })),
)

const OverviewPage = lazy(() =>
  import('./pages/dashboard/OverviewPage').then((module) => ({
    default: module.OverviewPage,
  })),
)

const ProjectsPage = lazy(() =>
  import('./pages/dashboard/ProjectsPage').then((module) => ({
    default: module.ProjectsPage,
  })),
)

const DiscoverPage = lazy(() =>
  import('./pages/dashboard/DiscoverPage').then((module) => ({
    default: module.DiscoverPage,
  })),
)

const TasksPage = lazy(() =>
  import('./pages/dashboard/TasksPage').then((module) => ({
    default: module.TasksPage,
  })),
)

const AccessPage = lazy(() =>
  import('./pages/dashboard/AccessPage').then((module) => ({
    default: module.AccessPage,
  })),
)

const MembersPage = lazy(() =>
  import('./pages/dashboard/MembersPage').then((module) => ({
    default: module.MembersPage,
  })),
)

const NotesPage = lazy(() =>
  import('./pages/dashboard/NotesPage').then((module) => ({
    default: module.NotesPage,
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
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<Navigate replace to="overview" />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="discover" element={<DiscoverPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="access" element={<AccessPage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="notes" element={<NotesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate replace to="/app" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App

