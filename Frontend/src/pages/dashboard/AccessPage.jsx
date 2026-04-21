import { useDashboard } from '../../context/DashboardContext'

export const AccessPage = () => {
  const {
    busy,
    selectedProjectId,
    canReviewJoinRequests,
    joinRequests,
    pendingRequestCount,
    processJoinRequest,
  } = useDashboard()

  return (
    <section className="grid gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Access</p>
        <h3 className="text-xl font-bold text-slate-900">Access Requests</h3>
      </header>

      {!selectedProjectId ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-600">
          Select a project from the quick selector to review access requests.
        </p>
      ) : canReviewJoinRequests ? (
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Pending Requests</h4>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-800">
              {pendingRequestCount} pending
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-600">
            Select a request and click Grant Access to add the user as a member.
          </p>
          <ul className="grid gap-2">
            {joinRequests.map((request) => (
              <li key={request._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-sm font-medium text-slate-800">
                  {request.requestedBy?.username || 'Unknown user'}
                </p>
                <p className="text-xs text-slate-500">
                  {request.requestedBy?.email || 'No email'}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                    disabled={busy}
                    onClick={() => processJoinRequest(request._id, 'approve')}
                    type="button"
                  >
                    Grant Access
                  </button>
                  <button
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                    disabled={busy}
                    onClick={() => processJoinRequest(request._id, 'reject')}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
            {joinRequests.length === 0 && (
              <li className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
                No pending join requests.
              </li>
            )}
          </ul>
        </article>
      ) : (
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Access Requests</h4>
          <p className="mt-1 text-xs text-slate-600">
            You can request access to projects, but only admins and project admins can grant it.
          </p>
        </article>
      )}
    </section>
  )
}
