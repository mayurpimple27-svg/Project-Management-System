import { useDashboard } from '../../context/DashboardContext'
import { useAuth } from '../../context/AuthContext'

export const MembersPage = () => {
  const { currentUser } = useAuth()
  const {
    busy,
    selectedProjectId,
    canReviewJoinRequests,
    projectMembers,
    updateMemberRole,
    removeMember,
  } = useDashboard()

  return (
    <section className="grid gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Members</p>
        <h3 className="text-xl font-bold text-slate-900">Project Members</h3>
      </header>

      {!selectedProjectId ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-600">
          Select a project from the quick selector to view members.
        </p>
      ) : (
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <ul className="grid gap-2">
            {projectMembers.map((member) => {
              const isCurrentUser = member.user?._id === currentUser?._id

              return (
                <li key={member.user?._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {member.user?.username || 'Unknown user'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.user?.fullName || 'No name'}
                      </p>
                    </div>

                    {canReviewJoinRequests ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
                          disabled={busy || isCurrentUser}
                          onChange={(event) =>
                            updateMemberRole(member.user?._id, event.target.value)
                          }
                          value={member.role}
                        >
                          <option value="admin">admin</option>
                          <option value="project_admin">project_admin</option>
                          <option value="member">member</option>
                        </select>
                        <button
                          className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                          disabled={busy || isCurrentUser}
                          onClick={() => removeMember(member)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {member.role}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
            {projectMembers.length === 0 && (
              <li className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
                No members found.
              </li>
            )}
          </ul>
        </article>
      )}
    </section>
  )
}
