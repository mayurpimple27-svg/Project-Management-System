import { useDashboard } from '../../context/DashboardContext'

export const OverviewPage = () => {
  const {
    selectedProject,
    selectedRole,
    visibleTasks,
    projectMembers,
    notes,
    pendingRequestCount,
  } = useDashboard()

  return (
    <section className="grid gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Overview</p>
        <h3 className="text-xl font-bold text-slate-900">Workspace Summary</h3>
      </header>

      {!selectedProject?.project?._id ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-600">
          Select a project from the quick selector to view metrics and start managing work.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{selectedRole}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Visible Tasks</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{visibleTasks.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Members</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{projectMembers.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{notes.length}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-700">Pending Access</p>
            <p className="mt-1 text-lg font-semibold text-amber-900">{pendingRequestCount}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900">How To Use This Dashboard</h4>
        <ul className="mt-2 grid gap-1 text-sm text-slate-700">
          <li>1. Use Projects page to create or select a project.</li>
          <li>2. Use Discover page to request access to other active projects.</li>
          <li>3. Use Access page to grant or reject join requests.</li>
          <li>4. Use Members and Notes pages for governance and documentation.</li>
          <li>5. Use Tasks page for full task board operations and task details.</li>
        </ul>
      </div>
    </section>
  )
}
