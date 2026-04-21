import { useState } from 'react'
import { useDashboard } from '../../context/DashboardContext'

export const ProjectsPage = () => {
  const { busy, projects, selectedProject, selectProjectById, createProject } = useDashboard()
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })

  const handleCreateProject = async (event) => {
    event.preventDefault()

    const created = await createProject(projectForm)
    if (created !== false) {
      setProjectForm({ name: '', description: '' })
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-900">Create Project</h3>
        <form className="mt-3 grid gap-2" onSubmit={handleCreateProject}>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
            placeholder="New project name"
            maxLength={70}
            value={projectForm.name}
            onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <textarea
            className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
            placeholder="Description"
            maxLength={260}
            value={projectForm.description}
            onChange={(e) =>
              setProjectForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <button
            className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-75"
            disabled={busy}
          >
            Add Project
          </button>
        </form>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-900">Your Projects</h3>
        <ul className="mt-3 grid max-h-[64vh] gap-2 overflow-y-auto pr-1">
          {projects.map((entry) => {
            const isActive = entry.project._id === selectedProject?.project?._id

            return (
              <li key={entry.project._id}>
                <button
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => selectProjectById(entry.project._id)}
                  type="button"
                >
                  <p className="font-semibold text-slate-900">{entry.project.name}</p>
                  <p className="text-xs text-slate-500">
                    {entry.project.members} members • {entry.role}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {isActive ? 'Current project workspace' : 'Click to select this project'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        isActive
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isActive ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
          {projects.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
              No projects yet. Create your first one.
            </li>
          )}
        </ul>
      </article>
    </section>
  )
}
