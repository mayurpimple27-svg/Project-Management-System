import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { DashboardProvider, useDashboard } from '../../context/DashboardContext'
import { useToast } from '../../context/ToastContext'

const pageLinks = [
  { to: '/app/overview', label: 'Overview' },
  { to: '/app/projects', label: 'Projects' },
  { to: '/app/discover', label: 'Discover' },
  { to: '/app/tasks', label: 'Tasks' },
  { to: '/app/access', label: 'Access' },
  { to: '/app/members', label: 'Members' },
  { to: '/app/notes', label: 'Notes' },
]

const DashboardLayoutContent = () => {
  const { currentUser, logout } = useAuth()
  const { pushToast } = useToast()
  const {
    busy,
    projects,
    selectedProject,
    selectedProjectId,
    selectedRole,
    canReviewJoinRequests,
    pendingRequestCount,
    selectProjectById,
    visibleTasks,
    projectMembers,
    notes,
  } = useDashboard()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const pageBadges = {
    '/app/tasks': visibleTasks.length,
    '/app/access': canReviewJoinRequests ? pendingRequestCount : null,
    '/app/members': projectMembers.length,
    '/app/notes': notes.length,
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 p-3 md:p-5">
      <header className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Project Management</p>
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Camp Control Center</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {currentUser?.username}
            </span>
            <button
              className="rounded-full border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={handleLogout}
              disabled={busy}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Quick Project Select</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-500 md:max-w-md"
              value={selectedProjectId}
              onChange={(event) => selectProjectById(event.target.value)}
              disabled={projects.length === 0}
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map((entry) => (
                  <option key={entry.project._id} value={entry.project._id}>
                    {entry.project.name} ({entry.role})
                  </option>
                ))
              )}
            </select>

            {selectedProject?.project?._id && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Role: {selectedRole}
              </span>
            )}

            {canReviewJoinRequests && selectedProject?.project?._id && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Pending access requests: {pendingRequestCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
          <h3 className="text-lg font-semibold text-slate-900">Workspace Pages</h3>
          <p className="mt-1 text-xs text-slate-600">Navigate the dashboard by page.</p>

          <ul className="mt-3 grid gap-2">
            {pageLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-teal-400 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`
                  }
                  to={link.to}
                >
                  <span>{link.label}</span>
                  {pageBadges[link.to] !== undefined && pageBadges[link.to] !== null && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {pageBadges[link.to]}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Project</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {selectedProject?.project?.name || 'No project selected'}
            </p>
            <p className="mt-1 text-xs text-slate-600 line-clamp-3">
              {selectedProject?.project?.description ||
                'Pick a project from the quick selector to start managing tasks and members.'}
            </p>
          </div>
        </aside>

        <main className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur md:p-5">
          <Outlet />
        </main>
      </section>
    </div>
  )
}

export const DashboardLayout = () => (
  <DashboardProvider>
    <DashboardLayoutContent />
  </DashboardProvider>
)
