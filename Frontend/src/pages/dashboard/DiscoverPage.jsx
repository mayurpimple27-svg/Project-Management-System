import { useDashboard } from '../../context/DashboardContext'

export const DiscoverPage = () => {
  const { busy, discoverProjects, requestJoinProject } = useDashboard()

  return (
    <section className="grid gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Discover</p>
        <h3 className="text-xl font-bold text-slate-900">Discover Active Projects</h3>
      </header>

      <ul className="grid gap-2 md:grid-cols-2">
        {discoverProjects.map((project) => (
          <li key={project._id} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-900">{project.name}</p>
            <p className="mt-1 text-xs text-slate-500 line-clamp-3">
              {project.description || 'No description'}
            </p>
            <div className="mt-3">
              {project.isMember ? (
                <span className="text-xs font-semibold text-emerald-700">Already a member</span>
              ) : project.hasPendingRequest ? (
                <span className="text-xs font-semibold text-amber-700">Request pending</span>
              ) : (
                <button
                  className="rounded-md border border-teal-300 px-2 py-1 text-xs font-semibold text-teal-700"
                  disabled={busy}
                  onClick={() => requestJoinProject(project._id)}
                  type="button"
                >
                  Request Access
                </button>
              )}
            </div>
          </li>
        ))}
        {discoverProjects.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
            No active projects available.
          </li>
        )}
      </ul>
    </section>
  )
}
