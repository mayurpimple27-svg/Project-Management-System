import { useCallback } from 'react'

export const useProjectActions = ({
  apiRequest,
  setBusy,
  pushToast,
  projects,
  setSelectedProject,
  selectedProjectId,
  tasks,
  loadProjects,
  loadDiscoverProjects,
  loadJoinRequests,
  loadProjectMembers,
  loadProjectWorkspace,
}) => {
  const selectProjectById = useCallback(
    (projectId) => {
      const nextProject = projects.find((entry) => entry.project._id === projectId)
      if (nextProject) {
        setSelectedProject(nextProject)
      }
    },
    [projects, setSelectedProject],
  )

  const createProject = useCallback(
    async ({ name, description }) => {
      if (!name.trim()) return

      setBusy(true)

      try {
        await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        })

        pushToast('Project created successfully.', 'success')
        await loadProjects()
        await loadDiscoverProjects()
        return true
      } catch (error) {
        pushToast(error.message, 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [apiRequest, loadDiscoverProjects, loadProjects, pushToast, setBusy],
  )

  const requestJoinProject = useCallback(
    async (projectId) => {
      setBusy(true)

      try {
        await apiRequest(`/projects/${projectId}/join-requests`, {
          method: 'POST',
        })

        pushToast('Join request submitted to project admin.', 'success')
        await loadDiscoverProjects()
      } catch (error) {
        pushToast(error.message, 'error')
      } finally {
        setBusy(false)
      }
    },
    [apiRequest, loadDiscoverProjects, pushToast, setBusy],
  )

  const processJoinRequest = useCallback(
    async (requestId, action) => {
      if (!selectedProjectId) return

      setBusy(true)

      try {
        await apiRequest(`/projects/${selectedProjectId}/join-requests/${requestId}`, {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        })

        pushToast(`Request ${action}d successfully.`, 'success')
        await loadJoinRequests(selectedProjectId)
        await loadProjectMembers(selectedProjectId)
        await loadDiscoverProjects()
        await loadProjects()
      } catch (error) {
        pushToast(error.message, 'error')
      } finally {
        setBusy(false)
      }
    },
    [
      apiRequest,
      loadDiscoverProjects,
      loadJoinRequests,
      loadProjectMembers,
      loadProjects,
      pushToast,
      selectedProjectId,
      setBusy,
    ],
  )

  const updateMemberRole = useCallback(
    async (userId, newRole) => {
      if (!selectedProjectId) return

      setBusy(true)

      try {
        await apiRequest(`/projects/${selectedProjectId}/members/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({ newRole }),
        })

        pushToast('Member role updated.', 'success')
        await loadProjectMembers(selectedProjectId)
        await loadProjects()
      } catch (error) {
        pushToast(error.message, 'error')
      } finally {
        setBusy(false)
      }
    },
    [
      apiRequest,
      loadProjectMembers,
      loadProjects,
      pushToast,
      selectedProjectId,
      setBusy,
    ],
  )

  const removeMember = useCallback(
    async (member) => {
      if (!selectedProjectId) return

      const confirmed = window.confirm(
        `Remove ${member.user?.username || 'this member'} from project?`,
      )
      if (!confirmed) return

      setBusy(true)

      try {
        const impactedTasks = tasks.filter((task) => task?.assignedTo?._id === member.user?._id)

        await Promise.all(
          impactedTasks.map((task) =>
            apiRequest(`/tasks/${selectedProjectId}/t/${task._id}`, {
              method: 'PUT',
              body: JSON.stringify({ assignedTo: '' }),
            }),
          ),
        )

        await apiRequest(`/projects/${selectedProjectId}/members/${member.user?._id}`, {
          method: 'DELETE',
        })

        pushToast('Member removed and tasks unassigned.', 'success')
        await Promise.all([
          loadProjectMembers(selectedProjectId),
          loadProjectWorkspace(selectedProjectId),
          loadProjects(),
        ])
      } catch (error) {
        pushToast(error.message, 'error')
      } finally {
        setBusy(false)
      }
    },
    [
      apiRequest,
      loadProjectMembers,
      loadProjectWorkspace,
      loadProjects,
      pushToast,
      selectedProjectId,
      setBusy,
      tasks,
    ],
  )

  return {
    selectProjectById,
    createProject,
    requestJoinProject,
    processJoinRequest,
    updateMemberRole,
    removeMember,
  }
}
