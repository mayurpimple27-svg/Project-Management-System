import { useEffect, useState } from 'react'
import { useDashboard } from '../../context/DashboardContext'

export const TasksPage = () => {
  const {
    busy,
    loadingBoard,
    selectedProjectId,
    taskEditEnabled,
    projectMembers,
    groupedTasks,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    fetchTaskDetails,
    createSubTask,
    toggleSubTask,
    deleteSubTask,
    uploadTaskAttachments,
  } = useDashboard()

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    assignedTo: '',
  })
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [activeTask, setActiveTask] = useState(null)
  const [taskDrawerLoading, setTaskDrawerLoading] = useState(false)
  const [subTaskForm, setSubTaskForm] = useState({ title: '' })
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTaskForm, setEditTaskForm] = useState({ title: '', description: '' })

  useEffect(() => {
    if (!selectedProjectId) {
      setActiveTaskId(null)
      setActiveTask(null)
      setEditingTaskId(null)
    }
  }, [selectedProjectId])

  const openTaskDetails = async (taskId) => {
    setActiveTaskId(taskId)
    setTaskDrawerLoading(true)
    const details = await fetchTaskDetails(taskId)
    setActiveTask(details)
    setTaskDrawerLoading(false)
  }

  const refreshActiveTask = async () => {
    if (!activeTaskId) return

    setTaskDrawerLoading(true)
    const details = await fetchTaskDetails(activeTaskId)
    setActiveTask(details)
    setTaskDrawerLoading(false)
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()

    const created = await createTask(taskForm)
    if (created) {
      setTaskForm({ title: '', description: '', status: 'todo', assignedTo: '' })
    }
  }

  const handleEditTask = async (event) => {
    event.preventDefault()

    const updated = await updateTask(editingTaskId, {
      title: editTaskForm.title.trim(),
      description: editTaskForm.description.trim(),
    })

    if (updated) {
      if (activeTaskId === editingTaskId) {
        await refreshActiveTask()
      }

      setEditingTaskId(null)
      setEditTaskForm({ title: '', description: '' })
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    const deleted = await deleteTask(taskId)
    if (deleted && activeTaskId === taskId) {
      setActiveTaskId(null)
      setActiveTask(null)
    }
  }

  const handleCreateSubTask = async (event) => {
    event.preventDefault()

    const created = await createSubTask(activeTaskId, subTaskForm.title)
    if (created) {
      setSubTaskForm({ title: '' })
      await refreshActiveTask()
    }
  }

  const handleToggleSubTask = async (subTask) => {
    const updated = await toggleSubTask(subTask)
    if (updated) {
      await refreshActiveTask()
    }
  }

  const handleDeleteSubTask = async (subTaskId) => {
    const deleted = await deleteSubTask(subTaskId)
    if (deleted) {
      await refreshActiveTask()
    }
  }

  const handleUploadAttachment = async (event) => {
    const files = event.target.files
    if (!files || !activeTaskId) return

    setUploadingAttachment(true)
    const updatedTask = await uploadTaskAttachments(activeTaskId, files)
    if (updatedTask) {
      setActiveTask(updatedTask)
      event.target.value = ''
    }
    setUploadingAttachment(false)
  }

  return (
    <section className="grid gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Tasks</p>
          <h3 className="text-xl font-bold text-slate-900">Task Board</h3>
        </div>
        {loadingBoard && <span className="text-xs text-slate-500">Syncing...</span>}
      </header>

      {!selectedProjectId ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-600">
          Select a project from the quick selector to manage tasks.
        </p>
      ) : (
        <>
          <form className="rounded-xl border border-slate-200 bg-white p-3" onSubmit={handleCreateTask}>
            <div className="grid gap-2">
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                placeholder="Task title"
                maxLength={120}
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                disabled={!taskEditEnabled}
              />
              <textarea
                className="min-h-20 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                placeholder="Task description"
                maxLength={260}
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={!taskEditEnabled}
              />
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                value={taskForm.assignedTo}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))
                }
                disabled={!taskEditEnabled}
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
                  disabled={!taskEditEnabled}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <button
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={busy || !taskEditEnabled}
                >
                  Add Task
                </button>
              </div>
              {!taskEditEnabled && (
                <p className="text-xs text-amber-700">
                  You can view tasks but cannot create them with this role.
                </p>
              )}
            </div>
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
                            onClick={() => openTaskDetails(task._id)}
                            type="button"
                          >
                            Open details
                          </button>
                          {taskEditEnabled && (
                            <select
                              className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
                              value={task.status}
                              onChange={(event) =>
                                updateTaskStatus(task._id, event.target.value)
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
        </>
      )}

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
                        <span className={subTask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}>
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
                      onChange={(event) => setSubTaskForm({ title: event.target.value })}
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
                        Attachment: {attachment.url.split('/').pop()}
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
                    <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 px-3 py-3 text-center text-sm transition hover:bg-slate-50">
                      <span className="font-semibold text-slate-700">Upload file</span>
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
                onChange={(e) =>
                  setEditTaskForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
              <textarea
                className="min-h-20 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                placeholder="Task description"
                maxLength={260}
                value={editTaskForm.description}
                onChange={(e) =>
                  setEditTaskForm((prev) => ({ ...prev, description: e.target.value }))
                }
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
    </section>
  )
}
