import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const canManageTasks = (role) => role === 'admin' || role === 'project_admin'
const canManageNotes = (role) => role === 'admin'

export const DashboardPage = () => {
  const { currentUser, logout } = useAuth()
  const { pushToast } = useToast()

  const [projects, setProjects] = useState([])
  const [discoverProjects, setDiscoverProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [joinRequests, setJoinRequests] = useState([])

  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', assignedTo: '' })
  const [noteForm, setNoteForm] = useState({ content: '' })

  const [busy, setBusy] = useState(false)
  const [loadingBoard, setLoadingBoard] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [activeTask, setActiveTask] = useState(null)
  const [taskDrawerLoading, setTaskDrawerLoading] = useState(false)
  const [subTaskForm, setSubTaskForm] = useState({ title: '' })
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTaskForm, setEditTaskForm] = useState({ title: '', description: '' })
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteForm, setEditNoteForm] = useState({ content: '' })

  const selectedRole = selectedProject?.role
  const taskEditEnabled = canManageTasks(selectedRole)
  const noteEditEnabled = canManageNotes(selectedRole)
  const canReviewJoinRequests = selectedRole === 'admin' || selectedRole === 'project_admin'

  const visibleTasks = useMemo(() => {
    if (!currentUser?._id) return tasks
    if (selectedRole !== 'member') return tasks

    return tasks.filter((task) => task?.assignedTo?._id === currentUser._id)
  }, [tasks, selectedRole, currentUser?._id])

  const groupedTasks = useMemo(() => {
    const groups = { todo: [], in_progress: [], done: [] }

    for (const task of visibleTasks) {
      groups[task.status]?.push(task)
    }

    return groups
  }, [visibleTasks])

  const loadProjects = useCallback(async () => {
    const response = await apiRequest('/projects', { method: 'GET' })
    const incoming = response?.data || []
    setProjects(incoming)

    if (incoming.length > 0) {
      const stillSelected = incoming.find(
        (entry) => entry.project._id === selectedProject?.project?._id,
      )
      setSelectedProject(stillSelected || incoming[0])
    } else {
      setSelectedProject(null)
    }
  }, [selectedProject?.project?._id])

  const loadDiscoverProjects = useCallback(async () => {
    const response = await apiRequest('/projects/discover', { method: 'GET' })
    setDiscoverProjects(response?.data || [])
  }, [])

  const loadProjectWorkspace = useCallback(async (projectId) => {
    setLoadingBoard(true)

    try {
      const [tasksRes, notesRes] = await Promise.all([
        apiRequest(`/tasks/${projectId}`, { method: 'GET' }),
        apiRequest(`/notes/${projectId}`, { method: 'GET' }),
      ])

      setTasks(tasksRes?.data || [])
      setNotes(notesRes?.data || [])
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setLoadingBoard(false)
    }
  }, [pushToast])

  const loadProjectMembers = useCallback(
    async (projectId) => {
      try {
        const response = await apiRequest(`/projects/${projectId}/members`, {
          method: 'GET',
        })
        setProjectMembers(response?.data || [])
      } catch (error) {
        setProjectMembers([])
        pushToast(error.message, 'error')
      }
    },
    [pushToast],
  )

  const loadJoinRequests = useCallback(
    async (projectId) => {
      if (!canReviewJoinRequests) {
        setJoinRequests([])
        return
      }

      try {
        const response = await apiRequest(`/projects/${projectId}/join-requests`, {
          method: 'GET',
        })
        setJoinRequests(response?.data || [])
      } catch (error) {
        setJoinRequests([])
        pushToast(error.message, 'error')
      }
    },
    [canReviewJoinRequests, pushToast],
  )

  const loadTaskDetails = useCallback(
    async (projectId, taskId) => {
      setTaskDrawerLoading(true)

      try {
        const response = await apiRequest(`/tasks/${projectId}/t/${taskId}`, {
          method: 'GET',
        })
        setActiveTask(response?.data || null)
      } catch (error) {
        pushToast(error.message, 'error')
      } finally {
        setTaskDrawerLoading(false)
      }
    },
    [pushToast],
  )

  useEffect(() => {
    loadProjects().catch((error) => pushToast(error.message, 'error'))
    loadDiscoverProjects().catch((error) => pushToast(error.message, 'error'))
  }, [loadProjects, loadDiscoverProjects, pushToast])

  useEffect(() => {
    const projectId = selectedProject?.project?._id

    if (!projectId) {
      setTasks([])
      setNotes([])
      return
    }

    loadProjectWorkspace(projectId)
    loadProjectMembers(projectId)
    loadJoinRequests(projectId)
  }, [selectedProject, loadProjectWorkspace, loadProjectMembers, loadJoinRequests])

  useEffect(() => {
    if (!selectedProject?.project?._id || !activeTaskId) {
      setActiveTask(null)
      return
    }

    loadTaskDetails(selectedProject.project._id, activeTaskId)
  }, [activeTaskId, selectedProject, loadTaskDetails])

  const handleCreateProject = async (event) => {
    event.preventDefault()

    if (!projectForm.name.trim()) return

    setBusy(true)

    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectForm.name.trim(),
          description: projectForm.description.trim(),
        }),
      })

      setProjectForm({ name: '', description: '' })
      pushToast('Project created successfully.', 'success')
      await loadProjects()
      await loadDiscoverProjects()
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()

    if (!selectedProject?.project?._id || !taskForm.title.trim()) return

    if (!taskEditEnabled) {
      pushToast('Your role cannot create tasks in this project.', 'error')
      return
    }

    setBusy(true)

    try {
      await apiRequest(`/tasks/${selectedProject.project._id}`, {
        method: 'POST',
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          status: taskForm.status,
          assignedTo: taskForm.assignedTo || undefined,
        }),
      })

      setTaskForm({ title: '', description: '', status: 'todo', assignedTo: '' })
      pushToast('Task added to board.', 'success')
      await loadProjectWorkspace(selectedProject.project._id)
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId, status) => {
    if (!selectedProject?.project?._id || !taskEditEnabled) return

    setBusy(true)

    try {
      await apiRequest(`/tasks/${selectedProject.project._id}/t/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })

      await loadProjectWorkspace(selectedProject.project._id)

      if (activeTaskId === taskId) {
        await loadTaskDetails(selectedProject.project._id, taskId)
      }

      pushToast('Task status updated.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateNote = async (event) => {
    event.preventDefault()

    if (!selectedProject?.project?._id || !noteForm.content.trim()) return

    if (!noteEditEnabled) {
      pushToast('Only admins can create notes in this project.', 'error')
      return
    }

    setBusy(true)

    try {
      await apiRequest(`/notes/${selectedProject.project._id}`, {
        method: 'POST',
        body: JSON.stringify({ content: noteForm.content.trim() }),
      })

      setNoteForm({ content: '' })
      pushToast('Note saved.', 'success')
      await loadProjectWorkspace(selectedProject.project._id)
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateSubTask = async (event) => {
    event.preventDefault()

    if (!selectedProject?.project?._id || !activeTaskId || !subTaskForm.title.trim()) {
      return
    }

    if (!taskEditEnabled) {
      pushToast('Your role cannot add subtasks.', 'error')
      return
    }

    setBusy(true)

    try {
      await apiRequest(
        `/tasks/${selectedProject.project._id}/t/${activeTaskId}/subtasks`,
        {
          method: 'POST',
          body: JSON.stringify({ title: subTaskForm.title.trim() }),
        },
      )

      setSubTaskForm({ title: '' })
      await loadTaskDetails(selectedProject.project._id, activeTaskId)
      pushToast('Subtask created.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleSubTask = async (subTask) => {
    if (!selectedProject?.project?._id) return

    setBusy(true)

    try {
      await apiRequest(`/tasks/${selectedProject.project._id}/st/${subTask._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isCompleted: !subTask.isCompleted }),
      })

      if (activeTaskId) {
        await loadTaskDetails(selectedProject.project._id, activeTaskId)
      }

      pushToast('Subtask updated.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteSubTask = async (subTaskId) => {
    if (!selectedProject?.project?._id || !taskEditEnabled) return

    setBusy(true)

    try {
      await apiRequest(`/tasks/${selectedProject.project._id}/st/${subTaskId}`, {
        method: 'DELETE',
      })

      if (activeTaskId) {
        await loadTaskDetails(selectedProject.project._id, activeTaskId)
      }

      pushToast('Subtask deleted.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUploadAttachment = async (event) => {
    const files = event.target.files
    if (!files || !selectedProject?.project?._id || !activeTaskId) return

    setUploadingAttachment(true)

    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('attachments', file)
      }

      const response = await fetch(
        `/api/v1/tasks/${selectedProject.project._id}/t/${activeTaskId}`,
        {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        },
      )

      if (!response.ok) {
        throw new Error('Failed to upload attachment')
      }

      const data = await response.json()
      setActiveTask(data?.data || null)
      pushToast('Attachment uploaded successfully.', 'success')
      event.target.value = ''
    } catch (error) {
      pushToast(error.message || 'Failed to upload attachment', 'error')
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleEditTask = async (event) => {
    event.preventDefault()
    if (!selectedProject?.project?._id || !editingTaskId) return

    setBusy(true)

    try {
      await apiRequest(`/tasks/${selectedProject.project._id}/t/${editingTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTaskForm.title.trim(),
          description: editTaskForm.description.trim(),
        }),
      })

      await loadProjectWorkspace(selectedProject.project._id)
      if (activeTaskId === editingTaskId) {
        await loadTaskDetails(selectedProject.project._id, editingTaskId)
      }

      setEditingTaskId(null)
      setEditTaskForm({ title: '', description: '' })
      pushToast('Task updated successfully.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!selectedProject?.project?._id || !taskEditEnabled) return

    if (!window.confirm('Are you sure you want to delete this task?')) return

    setBusy(true)

    try {
      await apiRequest(`/tasks/${selectedProject.project._id}/t/${taskId}`, {
        method: 'DELETE',
      })

      await loadProjectWorkspace(selectedProject.project._id)
      if (activeTaskId === taskId) {
        setActiveTaskId(null)
        setActiveTask(null)
      }

      pushToast('Task deleted successfully.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleEditNote = async (event) => {
    event.preventDefault()
    if (!selectedProject?.project?._id || !editingNoteId) return

    setBusy(true)

    try {
      await apiRequest(`/notes/${selectedProject.project._id}/n/${editingNoteId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editNoteForm.content.trim() }),
      })

      await loadProjectWorkspace(selectedProject.project._id)
      setEditingNoteId(null)
      setEditNoteForm({ content: '' })
      pushToast('Note updated successfully.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!selectedProject?.project?._id || !noteEditEnabled) return

    if (!window.confirm('Are you sure you want to delete this note?')) return

    setBusy(true)

    try {
      await apiRequest(`/notes/${selectedProject.project._id}/n/${noteId}`, {
        method: 'DELETE',
      })

      await loadProjectWorkspace(selectedProject.project._id)
      pushToast('Note deleted successfully.', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const handleRequestJoinProject = async (projectId) => {
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
  }

  const handleProcessJoinRequest = async (requestId, action) => {
    if (!selectedProject?.project?._id) return

    setBusy(true)

    try {
      await apiRequest(
        `/projects/${selectedProject.project._id}/join-requests/${requestId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        },
      )

      pushToast(`Request ${action}d successfully.`, 'success')
      await loadJoinRequests(selectedProject.project._id)
      await loadProjectMembers(selectedProject.project._id)
      await loadDiscoverProjects()
      await loadProjects()
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateMemberRole = async (userId, newRole) => {
    if (!selectedProject?.project?._id) return

    setBusy(true)

    try {
      await apiRequest(`/projects/${selectedProject.project._id}/members/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ newRole }),
      })

      pushToast('Member role updated.', 'success')
      await loadProjectMembers(selectedProject.project._id)
      await loadProjects()
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveMember = async (member) => {
    if (!selectedProject?.project?._id) return

    const confirmed = window.confirm(
      `Remove ${member.user?.username || 'this member'} from project?`,
    )
    if (!confirmed) return

    setBusy(true)

    try {
      const impactedTasks = tasks.filter((task) => task?.assignedTo?._id === member.user?._id)

      await Promise.all(
        impactedTasks.map((task) =>
          apiRequest(`/tasks/${selectedProject.project._id}/t/${task._id}`, {
            method: 'PUT',
            body: JSON.stringify({ assignedTo: '' }),
          }),
        ),
      )

      await apiRequest(`/projects/${selectedProject.project._id}/members/${member.user?._id}`, {
        method: 'DELETE',
      })

      pushToast('Member removed and tasks unassigned.', 'success')
      await Promise.all([
        loadProjectMembers(selectedProject.project._id),
        loadProjectWorkspace(selectedProject.project._id),
        loadProjects(),
      ])
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 p-3 md:p-5">
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
      </header>

      <section className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
          <h3 className="text-lg font-semibold text-slate-900">Projects</h3>

          <form className="mt-4 grid gap-2" onSubmit={handleCreateProject}>
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
              onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <button
              className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-75"
              disabled={busy}
            >
              Add Project
            </button>
          </form>

          <ul className="mt-5 grid max-h-[40vh] gap-2 overflow-y-auto pr-1">
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
                    onClick={() => setSelectedProject(entry)}
                    type="button"
                  >
                    <p className="font-semibold text-slate-900">{entry.project.name}</p>
                    <p className="text-xs text-slate-500">
                      {entry.project.members} members • {entry.role}
                    </p>
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

          <div className="mt-5 border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-900">Active Projects</h4>
            <ul className="mt-2 grid max-h-[28vh] gap-2 overflow-y-auto pr-1">
              {discoverProjects.map((project) => (
                <li key={project._id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  <div className="mt-2">
                    {project.isMember ? (
                      <span className="text-xs font-semibold text-emerald-700">Already a member</span>
                    ) : project.hasPendingRequest ? (
                      <span className="text-xs font-semibold text-amber-700">Request pending</span>
                    ) : (
                      <button
                        className="rounded-md border border-teal-300 px-2 py-1 text-xs font-semibold text-teal-700"
                        disabled={busy}
                        onClick={() => handleRequestJoinProject(project._id)}
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
          </div>
        </aside>

        <main className="grid gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedProject?.project?.name || 'Select a project'}
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedProject?.project?.description || 'Project tasks and notes appear here.'}
                </p>
              </div>

              {selectedProject?.project?._id && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Role: {selectedProject.role}
                </span>
              )}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-slate-900">Task Board</h4>
                {loadingBoard && <span className="text-xs text-slate-500">Syncing...</span>}
              </div>

              <form className="mb-4 grid gap-2" onSubmit={handleCreateTask}>
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                  placeholder="Task title"
                  maxLength={120}
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  disabled={!selectedProject?.project?._id || !taskEditEnabled}
                />
                <textarea
                  className="min-h-20 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                  placeholder="Task description"
                  maxLength={260}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={!selectedProject?.project?._id || !taskEditEnabled}
                />
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  disabled={!selectedProject?.project?._id || !taskEditEnabled}
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.username} ({member.role})
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))}
                    disabled={!selectedProject?.project?._id || !taskEditEnabled}
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-75"
                    disabled={busy || !selectedProject?.project?._id || !taskEditEnabled}
                  >
                    Add Task
                  </button>
                </div>
                {!taskEditEnabled && selectedProject?.project?._id && (
                  <p className="text-xs text-amber-700">You can view tasks but cannot create them with this role.</p>
                )}
              </form>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['todo', 'Todo', 'bg-amber-50 border-amber-200'],
                  ['in_progress', 'In Progress', 'bg-sky-50 border-sky-200'],
                  ['done', 'Done', 'bg-emerald-50 border-emerald-200'],
                ].map(([key, label, style]) => (
                  <div key={key} className={`rounded-xl border p-3 ${style}`}>
                    <h5 className="mb-2 text-sm font-semibold text-slate-800">{label}</h5>
                    <ul className="grid gap-2">
                      {groupedTasks[key].map((task) => (
                        <li
                          key={task._id}
                          className="rounded-lg border border-white/80 bg-white/80 p-2 text-sm shadow-sm"
                        >
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          {task.description && <p className="mt-1 text-xs text-slate-600">{task.description}</p>}
                          <p className="mt-1 text-xs text-slate-500">
                            Assigned to: {task?.assignedTo?.username || 'Unassigned'}
                          </p>
                          <div className="mt-2 grid gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                className="text-xs font-medium text-slate-700 underline decoration-dotted underline-offset-2"
                                onClick={() => setActiveTaskId(task._id)}
                                type="button"
                              >
                                Open details
                              </button>
                              {taskEditEnabled && (
                                <select
                                  className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
                                  value={task.status}
                                  onChange={(event) =>
                                    handleUpdateTaskStatus(task._id, event.target.value)
                                  }
                                >
                                  <option value="todo">Todo</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="done">Done</option>
                                </select>
                              )}
                            </div>
                            {taskEditEnabled && (
                              <div className="flex gap-1">
                                <button
                                  className="flex-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700"
                                  onClick={() => {
                                    setEditingTaskId(task._id)
                                    setEditTaskForm({
                                      title: task.title,
                                      description: task.description || '',
                                    })
                                  }}
                                  type="button"
                                >
                                  Edit
                                </button>
                                <button
                                  className="flex-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                                  onClick={() => handleDeleteTask(task._id)}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                      {groupedTasks[key].length === 0 && (
                        <li className="rounded-lg border border-dashed border-slate-300 px-2 py-4 text-center text-xs text-slate-500">
                          No tasks
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
              {canReviewJoinRequests && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Members</h4>
                  <ul className="grid gap-2">
                    {projectMembers.map((member) => {
                      const isCurrentUser = member.user?._id === currentUser?._id

                      return (
                        <li
                          key={member.user?._id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {member.user?.username || 'Unknown user'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {member.user?.fullName || 'No name'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
                                disabled={busy || isCurrentUser}
                                onChange={(event) =>
                                  handleUpdateMemberRole(member.user?._id, event.target.value)
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
                                onClick={() => handleRemoveMember(member)}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
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
                </div>
              )}

              {canReviewJoinRequests && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Join Requests</h4>
                  <ul className="grid gap-2">
                    {joinRequests.map((request) => (
                      <li
                        key={request._id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
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
                            onClick={() => handleProcessJoinRequest(request._id, 'approve')}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                            disabled={busy}
                            onClick={() => handleProcessJoinRequest(request._id, 'reject')}
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
                </div>
              )}

              <h4 className="mb-3 text-base font-semibold text-slate-900">Project Notes</h4>

              <form className="mb-4 grid gap-2" onSubmit={handleCreateNote}>
                <textarea
                  className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                  placeholder="Write a note"
                  maxLength={500}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ content: e.target.value })}
                  disabled={!selectedProject?.project?._id || !noteEditEnabled}
                  required
                />
                <button
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={busy || !selectedProject?.project?._id || !noteEditEnabled}
                >
                  Save Note
                </button>
                {!noteEditEnabled && selectedProject?.project?._id && (
                  <p className="text-xs text-amber-700">Only project admins can add notes.</p>
                )}
              </form>

              <ul className="grid max-h-[52vh] gap-2 overflow-y-auto pr-1">
                {notes.map((note) => (
                  <li key={note._id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <p className="text-slate-800">{note.content}</p>
                    <p className="mt-2 text-xs text-slate-500">by {note.createdBy?.username || 'unknown'}</p>
                    {noteEditEnabled && (
                      <div className="mt-2 flex gap-1">
                        <button
                          className="flex-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700"
                          onClick={() => {
                            setEditingNoteId(note._id)
                            setEditNoteForm({ content: note.content })
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="flex-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                          onClick={() => handleDeleteNote(note._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
                {notes.length === 0 && (
                  <li className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                    Notes for this project will appear here.
                  </li>
                )}
              </ul>
            </article>
          </section>
        </main>
      </section>

      {activeTaskId && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/45 p-3 md:items-center">
          <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Task Detail</p>
                <h4 className="text-lg font-semibold text-slate-900">
                  {activeTask?.title || 'Loading task...'}
                </h4>
              </div>
              <button
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                onClick={() => {
                  setActiveTaskId(null)
                  setActiveTask(null)
                }}
                type="button"
              >
                Close
              </button>
            </div>

            {taskDrawerLoading ? (
              <p className="text-sm text-slate-600">Loading task details...</p>
            ) : (
              <>
                <p className="mb-4 text-sm text-slate-700">
                  {activeTask?.description || 'No task description provided.'}
                </p>

                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p>
                    Current status: <span className="font-semibold">{activeTask?.status || 'todo'}</span>
                  </p>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-slate-900">Subtasks</h5>
                </div>

                <ul className="mb-4 grid gap-2">
                  {(activeTask?.subtasks || []).map((subTask) => (
                    <li
                      key={subTask._id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <label className="flex items-center gap-2 text-sm text-slate-800">
                        <input
                          checked={Boolean(subTask.isCompleted)}
                          className="h-4 w-4"
                          onChange={() => handleToggleSubTask(subTask)}
                          type="checkbox"
                        />
                        <span
                          className={
                            subTask.isCompleted
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800'
                          }
                        >
                          {subTask.title}
                        </span>
                      </label>
                      {taskEditEnabled && (
                        <button
                          className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                          onClick={() => handleDeleteSubTask(subTask._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  ))}
                  {(activeTask?.subtasks || []).length === 0 && (
                    <li className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                      No subtasks yet.
                    </li>
                  )}
                </ul>

                {taskEditEnabled && (
                  <form className="grid gap-2" onSubmit={handleCreateSubTask}>
                    <input
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                      maxLength={120}
                      onChange={(event) =>
                        setSubTaskForm({ title: event.target.value })
                      }
                      placeholder="Add subtask"
                      required
                      value={subTaskForm.title}
                    />
                    <button
                      className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-75"
                      disabled={busy}
                      type="submit"
                    >
                      Create Subtask
                    </button>
                  </form>
                )}

                <div className="mb-2 mt-6 flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-slate-900">Attachments</h5>
                </div>

                <ul className="mb-4 grid gap-2">
                  {(activeTask?.attachments || []).map((attachment, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-sm text-teal-600 hover:underline"
                      >
                        📎 {attachment.url.split('/').pop()}
                      </a>
                      <span className="text-xs text-slate-500">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </span>
                    </li>
                  ))}
                  {(activeTask?.attachments || []).length === 0 && (
                    <li className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                      No attachments yet.
                    </li>
                  )}
                </ul>

                {taskEditEnabled && (
                  <div className="grid gap-2">
                    <label className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-center text-sm cursor-pointer hover:bg-slate-50 transition">
                      <span className="font-semibold text-slate-700">+ Upload File</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleUploadAttachment}
                        className="hidden"
                        disabled={uploadingAttachment}
                      />
                    </label>
                    {uploadingAttachment && (
                      <p className="text-xs text-slate-600">Uploading...</p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {editingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-slate-900">Edit Task</h4>
            </div>

            <form className="grid gap-3" onSubmit={handleEditTask}>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                placeholder="Task title"
                maxLength={120}
                value={editTaskForm.title}
                onChange={(e) => setEditTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <textarea
                className="min-h-20 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                placeholder="Task description"
                maxLength={260}
                value={editTaskForm.description}
                onChange={(e) => setEditTaskForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={busy}
                  type="submit"
                >
                  Save Task
                </button>
                <button
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setEditingTaskId(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-slate-900">Edit Note</h4>
            </div>

            <form className="grid gap-3" onSubmit={handleEditNote}>
              <textarea
                className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                placeholder="Edit note content"
                maxLength={500}
                value={editNoteForm.content}
                onChange={(e) => setEditNoteForm({ content: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={busy}
                  type="submit"
                >
                  Save Note
                </button>
                <button
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setEditingNoteId(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

